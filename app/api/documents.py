import os
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from pypdf import PdfReader

from app.db.storage import (
    list_documents,
    get_document,
    rename_document,
    delete_document
)
from app.api.deps import get_current_user

router = APIRouter(prefix="/documents", tags=["Documents Library"])

class RenameDocRequest(BaseModel):
    name: str

@router.get("")
def get_all_documents(user: Dict[str, Any] = Depends(get_current_user)):
    docs = list_documents(user["id"])
    return {"documents": docs}

@router.get("/{doc_id}")
def get_single_document(doc_id: str, user: Dict[str, Any] = Depends(get_current_user)):
    doc = get_document(doc_id, user["id"])
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc

@router.patch("/{doc_id}")
def update_doc_name(doc_id: str, payload: RenameDocRequest, user: Dict[str, Any] = Depends(get_current_user)):
    if not payload.name.strip():
        raise HTTPException(status_code=400, detail="Document name cannot be empty")
    
    doc = rename_document(doc_id, user["id"], payload.name.strip())
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc

@router.delete("/{doc_id}")
def remove_document(doc_id: str, user: Dict[str, Any] = Depends(get_current_user)):
    doc = get_document(doc_id, user["id"])
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Try deleting local file
    try:
        file_path = doc.get("file_path")
        if file_path and os.path.exists(file_path):
            os.remove(file_path)
    except Exception:
        pass

    delete_document(doc_id, user["id"])
    return {"status": "success", "message": "Document deleted"}

@router.get("/{doc_id}/preview")
def preview_document(doc_id: str, user: Dict[str, Any] = Depends(get_current_user)):
    doc = get_document(doc_id, user["id"])
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    file_path = doc.get("file_path")
    if not file_path or not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Document file not found on disk")
    
    try:
        reader = PdfReader(file_path)
        sample_pages = []
        for i in range(min(5, len(reader.pages))):
            text = reader.pages[i].extract_text() or ""
            sample_pages.append({
                "page": i + 1,
                "text": text[:1000]
            })
        return {
            "document": doc,
            "total_pages": len(reader.pages),
            "pages": sample_pages
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to preview document: {str(e)}")
