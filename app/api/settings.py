from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.db.storage import (
    get_user_settings,
    update_user_settings,
    get_dashboard_stats,
    global_search
)
from app.api.deps import get_current_user

router = APIRouter(tags=["Settings & Dashboard"])

class UpdateSettingsRequest(BaseModel):
    model: Optional[str] = None
    top_k: Optional[int] = None
    similarity_threshold: Optional[float] = None
    theme: Optional[str] = None

@router.get("/settings")
def fetch_settings(user: Dict[str, Any] = Depends(get_current_user)):
    return get_user_settings(user["id"])

@router.put("/settings")
def modify_settings(payload: UpdateSettingsRequest, user: Dict[str, Any] = Depends(get_current_user)):
    updated = update_user_settings(
        user_id=user["id"],
        model=payload.model,
        top_k=payload.top_k,
        similarity_threshold=payload.similarity_threshold,
        theme=payload.theme
    )
    return updated

@router.get("/dashboard/stats")
def fetch_dashboard_stats(user: Dict[str, Any] = Depends(get_current_user)):
    return get_dashboard_stats(user["id"])

@router.get("/search")
def run_global_search(q: str, user: Dict[str, Any] = Depends(get_current_user)):
    if not q.strip():
        return {"conversations": [], "documents": []}
    return global_search(user["id"], q.strip())
