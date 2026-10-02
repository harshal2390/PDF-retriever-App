import json
import asyncio
from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from sse_starlette.sse import EventSourceResponse

from app.db.storage import (
    get_conversation,
    update_conversation,
    list_messages,
    add_message,
    get_user_settings
)
from app.api.deps import get_current_user
from app.rag.rag_service import rag_service, sanitize_plain_text

router = APIRouter(prefix="/sessions", tags=["RAG Chat"])

class QueryRequest(BaseModel):
    question: str
    stream: Optional[bool] = True
    use_web_search: Optional[bool] = True

@router.post("/{session_id}/query")
async def query_rag_session(
    session_id: str,
    payload: QueryRequest,
    user: Dict[str, Any] = Depends(get_current_user)
):
    query_text = payload.question.strip()
    if not query_text:
        raise HTTPException(status_code=400, detail="Query cannot be empty")

    conv = get_conversation(session_id, user["id"])
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation session not found")

    selected_doc_ids = conv.get("associated_doc_ids", [])
    user_settings = get_user_settings(user["id"])
    model = user_settings.get("model", "llama-3.3-70b-versatile")
    top_k = user_settings.get("top_k", 4)

    # 1. Save user question to DB
    add_message(session_id, role="user", content=query_text)

    # 2. Fetch history for conversational memory
    history_messages = list_messages(session_id)
    # Exclude the current question we just added from history
    chat_history = [{"role": m["role"], "content": m["content"]} for m in history_messages[:-1]]

    use_web_search = payload.use_web_search if payload.use_web_search is not None else True

    current_title = conv.get("title", "")
    needs_rename = current_title in ["New Conversation", "New Chat", ""] or not current_title

    if payload.stream:
        async def event_generator():
            full_response = ""
            retrieved_sources = []
            try:
                async for event in rag_service.stream_query_response(
                    session_id=session_id,
                    query=query_text,
                    chat_history=chat_history,
                    selected_doc_ids=selected_doc_ids,
                    model=model,
                    top_k=top_k,
                    use_web_search=use_web_search
                ):
                    event_type = event.get("event")
                    data_str = event.get("data")
                    data_obj = json.loads(data_str)

                    if event_type == "sources":
                        retrieved_sources = data_obj.get("sources", [])
                    elif event_type == "token":
                        full_response += data_obj.get("token", "")
                    elif event_type == "done":
                        full_response = data_obj.get("complete_text", full_response)
                        retrieved_sources = data_obj.get("sources", retrieved_sources)

                    yield {
                        "event": event_type,
                        "data": data_str
                    }

                # 3. Save assistant response with sources to DB
                if full_response.strip():
                    saved_msg = add_message(session_id, role="assistant", content=sanitize_plain_text(full_response), sources=retrieved_sources)
                    yield {
                        "event": "saved",
                        "data": json.dumps({"message_id": saved_msg["id"]})
                    }

                # 4. Auto-rename conversation based on query + answer (like ChatGPT)
                if needs_rename and full_response.strip():
                    try:
                        new_title = await rag_service.generate_title_async(query_text, full_response[:150])
                        if new_title and new_title != current_title:
                            update_conversation(session_id, user["id"], title=new_title)
                            yield {
                                "event": "title",
                                "data": json.dumps({"title": new_title})
                            }
                    except Exception as te:
                        print(f"[Auto-Rename Error] {te}")

            except Exception as e:
                err_text = f"An error occurred while generating response: {str(e)}"
                yield {
                    "event": "error",
                    "data": json.dumps({"error": err_text})
                }

        return EventSourceResponse(event_generator())

    else:
        # Synchronous fallback
        result = rag_service.synchronous_query(
            session_id=session_id,
            query=query_text,
            chat_history=chat_history,
            selected_doc_ids=selected_doc_ids,
            model=model,
            top_k=top_k,
            use_web_search=use_web_search
        )
        assistant_msg = add_message(session_id, role="assistant", content=result["answer"], sources=result["sources"])

        # Auto-rename if needed
        conv_title = current_title
        if needs_rename and result.get("answer"):
            try:
                new_title = rag_service.generate_title(query_text, result["answer"][:150])
                if new_title:
                    update_conversation(session_id, user["id"], title=new_title)
                    conv_title = new_title
            except Exception:
                pass

        return {
            "answer": result["answer"],
            "sources": result["sources"],
            "message_id": assistant_msg["id"],
            "title": conv_title
        }
