import os
import shutil
import uuid
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from pydantic import BaseModel

from app.db.storage import (
    list_conversations,
    create_conversation,
    get_conversation,
    update_conversation,
    delete_conversation,
    list_messages,
    create_document,
    list_documents,
    get_user_settings
)
from app.api.deps import get_current_user
from app.config.settings import UPLOADS_DIR
from app.rag.rag_service import rag_service

router = APIRouter(prefix="/sessions", tags=["Conversations"])

class CreateSessionRequest(BaseModel):
    title: Optional[str] = "New Conversation"
    doc_ids: Optional[List[str]] = []

class UpdateSessionRequest(BaseModel):
    title: Optional[str] = None
    doc_ids: Optional[List[str]] = None
    is_archived: Optional[bool] = None

class UpdateSelectedDocsRequest(BaseModel):
    doc_ids: List[str]

@router.get("")
def get_user_sessions(include_archived: bool = False, user: Dict[str, Any] = Depends(get_current_user)):
    conversations = list_conversations(user["id"], include_archived=include_archived)
    return {"sessions": conversations}

@router.post("")
def create_user_session(payload: CreateSessionRequest, user: Dict[str, Any] = Depends(get_current_user)):
    conv = create_conversation(user["id"], title=payload.title or "New Conversation", doc_ids=payload.doc_ids or [])
    return conv

@router.get("/{session_id}")
def get_session_details(session_id: str, user: Dict[str, Any] = Depends(get_current_user)):
    conv = get_conversation(session_id, user["id"])
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation session not found")
    return conv

@router.patch("/{session_id}")
def update_session_details(session_id: str, payload: UpdateSessionRequest, user: Dict[str, Any] = Depends(get_current_user)):
    conv = update_conversation(
        session_id=session_id,
        user_id=user["id"],
        title=payload.title,
        doc_ids=payload.doc_ids,
        is_archived=payload.is_archived
    )
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation session not found")
    return conv

@router.delete("/{session_id}")
def remove_session(session_id: str, user: Dict[str, Any] = Depends(get_current_user)):
    success = delete_conversation(session_id, user["id"])
    if not success:
        raise HTTPException(status_code=404, detail="Conversation session not found")
    return {"status": "success", "message": "Conversation deleted"}

@router.get("/{session_id}/messages")
def get_session_messages(session_id: str, user: Dict[str, Any] = Depends(get_current_user)):
    conv = get_conversation(session_id, user["id"])
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation session not found")
    messages = list_messages(session_id)
    return {"messages": messages}

@router.get("/{session_id}/documents")
def get_session_documents(session_id: str, user: Dict[str, Any] = Depends(get_current_user)):
    conv = get_conversation(session_id, user["id"])
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation session not found")
    
    # Return all documents available to this user, flagging which ones are selected for this session
    all_docs = list_documents(user["id"])
    selected_ids = set(conv.get("associated_doc_ids", []))
    
    result = []
    valid_selected_ids = []
    for doc in all_docs:
        doc_copy = dict(doc)
        is_sel = doc["id"] in selected_ids
        doc_copy["selected"] = is_sel
        result.append(doc_copy)
        if is_sel:
            valid_selected_ids.append(doc["id"])

    return {"documents": result, "selected_ids": valid_selected_ids}

@router.put("/{session_id}/documents")
def update_session_selected_docs(session_id: str, payload: UpdateSelectedDocsRequest, user: Dict[str, Any] = Depends(get_current_user)):
    deduped = list(dict.fromkeys(payload.doc_ids))
    conv = update_conversation(
        session_id=session_id,
        user_id=user["id"],
        doc_ids=deduped
    )
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation session not found")
    return {"status": "success", "associated_doc_ids": conv["associated_doc_ids"]}

@router.post("/{session_id}/upload")
async def upload_documents_to_session(
    session_id: str,
    files: List[UploadFile] = File(...),
    user: Dict[str, Any] = Depends(get_current_user)
):
    conv = get_conversation(session_id, user["id"])
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation session not found")

    uploaded_records = []
    all_chunks = []
    current_doc_ids = set(conv.get("associated_doc_ids", []))

    for file in files:
        if not file.filename.lower().endswith(".pdf"):
            raise HTTPException(status_code=400, detail=f"File '{file.filename}' is not a valid PDF")

        doc_id = str(uuid.uuid4())
        safe_filename = f"{doc_id}_{file.filename}"
        dest_path = UPLOADS_DIR / safe_filename

        with open(dest_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        file_size = os.path.getsize(dest_path)

        try:
            # Extract and chunk
            process_res = rag_service.process_pdf(str(dest_path), doc_id, file.filename)
            total_pages = process_res["total_pages"]
            chunks = process_res["chunks"]
            chunk_count = process_res["chunk_count"]
            all_chunks.extend(chunks)

            # Record in DB with consistent doc_id
            doc_record = create_document(
                user_id=user["id"],
                filename=safe_filename,
                original_name=file.filename,
                file_path=str(dest_path),
                file_size=file_size,
                page_count=total_pages,
                chunk_count=chunk_count,
                session_id=session_id,
                doc_id=doc_id
            )
            uploaded_records.append(doc_record)
            current_doc_ids.add(doc_record["id"])

        except Exception as e:
            if dest_path.exists():
                dest_path.unlink()
            raise HTTPException(status_code=400, detail=f"Error processing '{file.filename}': {str(e)}")

    # Index all chunks into the session's FAISS vector store
    if all_chunks:
        rag_service.index_documents_for_session(session_id, all_chunks)

    # Update conversation's associated doc ids
    update_conversation(session_id, user["id"], doc_ids=list(current_doc_ids))

    return {
        "status": "success",
        "uploaded_count": len(uploaded_records),
        "documents": uploaded_records
    }
