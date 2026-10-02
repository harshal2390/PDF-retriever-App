from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any

from app.db.storage import (
    create_user,
    authenticate_user,
    create_auth_session,
    delete_auth_session,
    list_auth_sessions,
    revoke_auth_session,
    revoke_other_auth_sessions
)
from app.api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str

class LoginRequest(BaseModel):
    email: str
    password: str

class AuthResponse(BaseModel):
    token: str
    user: Dict[str, Any]

def detect_client_info(request: Request) -> Dict[str, str]:
    user_agent = request.headers.get("user-agent", "Unknown Device")
    browser = "Desktop Browser"
    if "Chrome" in user_agent:
        browser = "Chrome / Windows" if "Windows" in user_agent else "Chrome"
    elif "Firefox" in user_agent:
        browser = "Firefox"
    elif "Safari" in user_agent:
        browser = "Safari / Mac" if "Mac" in user_agent else "Safari"
    elif "Edge" in user_agent:
        browser = "Edge"

    client_ip = request.client.host if request.client else "127.0.0.1"
    return {
        "browser": browser,
        "ip": client_ip,
        "location": "Local Network" if client_ip in ["127.0.0.1", "localhost", "::1"] else "Remote Client"
    }

@router.post("/register", response_model=AuthResponse)
def register(payload: RegisterRequest, request: Request):
    if len(payload.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    
    user = create_user(payload.email, payload.password, payload.name)
    if not user:
        raise HTTPException(status_code=400, detail="Email is already registered")
    
    info = detect_client_info(request)
    token = create_auth_session(user["id"], info["browser"], info["ip"], info["location"])
    
    return {"token": token, "user": user}

@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest, request: Request):
    user = authenticate_user(payload.email, payload.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    info = detect_client_info(request)
    token = create_auth_session(user["id"], info["browser"], info["ip"], info["location"])
    
    return {"token": token, "user": user}

@router.get("/me")
def get_me(user: Dict[str, Any] = Depends(get_current_user)):
    return user

@router.post("/logout")
def logout(user: Dict[str, Any] = Depends(get_current_user)):
    token = user.get("current_token")
    if token:
        delete_auth_session(token)
    return {"status": "success", "message": "Logged out successfully"}

@router.get("/sessions")
def get_sessions(user: Dict[str, Any] = Depends(get_current_user)):
    sessions = list_auth_sessions(user["id"], user.get("current_token", ""))
    return {"sessions": sessions}

@router.delete("/sessions/{token_id}")
def revoke_session(token_id: str, user: Dict[str, Any] = Depends(get_current_user)):
    success = revoke_auth_session(token_id, user["id"])
    if not success:
        raise HTTPException(status_code=404, detail="Session not found or already revoked")
    return {"status": "success", "message": "Session revoked"}

@router.post("/sessions/revoke-others")
def revoke_others(user: Dict[str, Any] = Depends(get_current_user)):
    count = revoke_other_auth_sessions(user["id"], user.get("current_token", ""))
    return {"status": "success", "revoked_count": count}
