import json
import hashlib
import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional

from sqlalchemy.orm import Session
from sqlalchemy import func, or_, desc

from app.db.database import SessionLocal, Base, engine
from app.db.models import User, AuthSession, Conversation, Document, Message, UserSettings

# Initialize DB tables via SQLAlchemy
Base.metadata.create_all(bind=engine)

def get_db_session() -> Session:
    return SessionLocal()

def hash_password(password: str) -> str:
    salt = "documind_salt_2026"
    return hashlib.sha256((salt + password).encode("utf-8")).hexdigest()

# Seed default demo user if not present
def seed_demo_user():
    db = get_db_session()
    try:
        existing = db.query(User).filter(User.email == "demo@documind.ai").first()
        if not existing:
            demo_id = str(uuid.uuid4())
            user = User(
                id=demo_id,
                email="demo@documind.ai",
                password_hash=hash_password("password123"),
                name="Demo Researcher",
                created_at=datetime.utcnow()
            )
            settings = UserSettings(user_id=demo_id)
            db.add(user)
            db.add(settings)
            db.commit()
    finally:
        db.close()

seed_demo_user()

# --- User Auth Helpers ---
def create_user(email: str, password: str, name: str) -> Optional[Dict[str, Any]]:
    db = get_db_session()
    try:
        email_clean = email.lower().strip()
        existing = db.query(User).filter(User.email == email_clean).first()
        if existing:
            return None
        
        user_id = str(uuid.uuid4())
        user = User(
            id=user_id,
            email=email_clean,
            password_hash=hash_password(password),
            name=name.strip(),
            created_at=datetime.utcnow()
        )
        settings = UserSettings(user_id=user_id)
        db.add(user)
        db.add(settings)
        db.commit()
        return {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "created_at": user.created_at.isoformat()
        }
    except Exception:
        db.rollback()
        return None
    finally:
        db.close()

def authenticate_user(email: str, password: str) -> Optional[Dict[str, Any]]:
    db = get_db_session()
    try:
        pw_hash = hash_password(password)
        user = db.query(User).filter(
            User.email == email.lower().strip(),
            User.password_hash == pw_hash
        ).first()
        if user:
            return {
                "id": user.id,
                "email": user.email,
                "name": user.name,
                "created_at": user.created_at.isoformat()
            }
        return None
    finally:
        db.close()

def get_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
    db = get_db_session()
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            return {
                "id": user.id,
                "email": user.email,
                "name": user.name,
                "created_at": user.created_at.isoformat()
            }
        return None
    finally:
        db.close()

# --- Auth Session (Device) Helpers ---
def create_auth_session(user_id: str, browser: str = "Chrome / Windows", ip: str = "127.0.0.1", location: str = "Local Dev") -> str:
    db = get_db_session()
    try:
        token = str(uuid.uuid4())
        now = datetime.utcnow()
        sess = AuthSession(
            token=token,
            user_id=user_id,
            browser=browser,
            ip_address=ip,
            location=location,
            created_at=now,
            last_active=now
        )
        db.add(sess)
        db.commit()
        return token
    finally:
        db.close()

def get_user_by_token(token: str) -> Optional[Dict[str, Any]]:
    db = get_db_session()
    try:
        sess = db.query(AuthSession).filter(AuthSession.token == token).first()
        if not sess:
            return None
        sess.last_active = datetime.utcnow()
        db.commit()
        user = sess.user
        return {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "created_at": user.created_at.isoformat(),
            "token": sess.token,
            "browser": sess.browser,
            "ip_address": sess.ip_address,
            "location": sess.location
        }
    finally:
        db.close()

def list_auth_sessions(user_id: str, current_token: str) -> List[Dict[str, Any]]:
    db = get_db_session()
    try:
        sessions = db.query(AuthSession).filter(AuthSession.user_id == user_id).order_by(desc(AuthSession.last_active)).all()
        return [
            {
                "token": s.token,
                "browser": s.browser,
                "ip_address": s.ip_address,
                "location": s.location,
                "created_at": s.created_at.isoformat() if s.created_at else "",
                "last_active": s.last_active.isoformat() if s.last_active else "",
                "is_current": (s.token == current_token)
            }
            for s in sessions
        ]
    finally:
        db.close()

def revoke_auth_session(token: str, user_id: str) -> bool:
    db = get_db_session()
    try:
        sess = db.query(AuthSession).filter(AuthSession.token == token, AuthSession.user_id == user_id).first()
        if sess:
            db.delete(sess)
            db.commit()
            return True
        return False
    finally:
        db.close()

def revoke_other_auth_sessions(user_id: str, current_token: str) -> int:
    db = get_db_session()
    try:
        sessions = db.query(AuthSession).filter(AuthSession.user_id == user_id, AuthSession.token != current_token).all()
        count = len(sessions)
        for s in sessions:
            db.delete(s)
        db.commit()
        return count
    finally:
        db.close()

def delete_auth_session(token: str):
    db = get_db_session()
    try:
        sess = db.query(AuthSession).filter(AuthSession.token == token).first()
        if sess:
            db.delete(sess)
            db.commit()
    finally:
        db.close()

# --- Conversation / Session Helpers ---
def list_conversations(user_id: str, include_archived: bool = False) -> List[Dict[str, Any]]:
    db = get_db_session()
    try:
        q = db.query(Conversation).filter(Conversation.user_id == user_id)
        if not include_archived:
            q = q.filter(Conversation.is_archived == 0)
        convs = q.order_by(desc(Conversation.updated_at)).all()
        result = []
        for c in convs:
            result.append({
                "id": c.id,
                "user_id": c.user_id,
                "title": c.title,
                "created_at": c.created_at.isoformat() if c.created_at else "",
                "updated_at": c.updated_at.isoformat() if c.updated_at else "",
                "associated_doc_ids": json.loads(c.associated_doc_ids or "[]"),
                "is_archived": c.is_archived
            })
        return result
    finally:
        db.close()

def create_conversation(user_id: str, title: str = "New Conversation", doc_ids: Optional[List[str]] = None) -> Dict[str, Any]:
    db = get_db_session()
    try:
        session_id = str(uuid.uuid4())
        now = datetime.utcnow()
        conv = Conversation(
            id=session_id,
            user_id=user_id,
            title=title,
            created_at=now,
            updated_at=now,
            associated_doc_ids=json.dumps(doc_ids or []),
            is_archived=0
        )
        db.add(conv)
        db.commit()
        return {
            "id": conv.id,
            "user_id": conv.user_id,
            "title": conv.title,
            "created_at": conv.created_at.isoformat(),
            "updated_at": conv.updated_at.isoformat(),
            "associated_doc_ids": doc_ids or [],
            "is_archived": 0
        }
    finally:
        db.close()

def get_conversation(session_id: str, user_id: str) -> Optional[Dict[str, Any]]:
    db = get_db_session()
    try:
        c = db.query(Conversation).filter(Conversation.id == session_id, Conversation.user_id == user_id).first()
        if not c:
            return None
        return {
            "id": c.id,
            "user_id": c.user_id,
            "title": c.title,
            "created_at": c.created_at.isoformat() if c.created_at else "",
            "updated_at": c.updated_at.isoformat() if c.updated_at else "",
            "associated_doc_ids": json.loads(c.associated_doc_ids or "[]"),
            "is_archived": c.is_archived
        }
    finally:
        db.close()

def update_conversation(
    session_id: str,
    user_id: str,
    title: Optional[str] = None,
    doc_ids: Optional[List[str]] = None,
    is_archived: Optional[bool] = None
) -> Optional[Dict[str, Any]]:
    db = get_db_session()
    try:
        c = db.query(Conversation).filter(Conversation.id == session_id, Conversation.user_id == user_id).first()
        if not c:
            return None
        if title is not None:
            c.title = title
        if doc_ids is not None:
            c.associated_doc_ids = json.dumps(doc_ids)
        if is_archived is not None:
            c.is_archived = 1 if is_archived else 0
        c.updated_at = datetime.utcnow()
        db.commit()
        return {
            "id": c.id,
            "user_id": c.user_id,
            "title": c.title,
            "created_at": c.created_at.isoformat() if c.created_at else "",
            "updated_at": c.updated_at.isoformat() if c.updated_at else "",
            "associated_doc_ids": json.loads(c.associated_doc_ids or "[]"),
            "is_archived": c.is_archived
        }
    finally:
        db.close()

def delete_conversation(session_id: str, user_id: str) -> bool:
    db = get_db_session()
    try:
        c = db.query(Conversation).filter(Conversation.id == session_id, Conversation.user_id == user_id).first()
        if c:
            db.delete(c)
            db.commit()
            return True
        return False
    finally:
        db.close()

# --- Message Helpers ---
def list_messages(session_id: str) -> List[Dict[str, Any]]:
    db = get_db_session()
    try:
        msgs = db.query(Message).filter(Message.session_id == session_id).order_by(Message.created_at.asc()).all()
        return [
            {
                "id": m.id,
                "session_id": m.session_id,
                "role": m.role,
                "content": m.content,
                "sources": json.loads(m.sources or "[]"),
                "created_at": m.created_at.isoformat() if m.created_at else ""
            }
            for m in msgs
        ]
    finally:
        db.close()

def add_message(session_id: str, role: str, content: str, sources: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
    db = get_db_session()
    try:
        msg_id = str(uuid.uuid4())
        now = datetime.utcnow()
        msg = Message(
            id=msg_id,
            session_id=session_id,
            role=role,
            content=content,
            sources=json.dumps(sources or []),
            created_at=now
        )
        db.add(msg)
        # Update conversation updated_at
        c = db.query(Conversation).filter(Conversation.id == session_id).first()
        if c:
            c.updated_at = now
        db.commit()
        return {
            "id": msg.id,
            "session_id": msg.session_id,
            "role": msg.role,
            "content": msg.content,
            "sources": sources or [],
            "created_at": now.isoformat()
        }
    finally:
        db.close()

# --- Document Helpers ---
def create_document(
    user_id: str,
    filename: str,
    original_name: str,
    file_path: str,
    file_size: int,
    page_count: int,
    chunk_count: int,
    session_id: Optional[str] = None,
    doc_id: Optional[str] = None
) -> Dict[str, Any]:
    db = get_db_session()
    try:
        final_doc_id = doc_id or str(uuid.uuid4())
        now = datetime.utcnow()
        doc = Document(
            id=final_doc_id,
            user_id=user_id,
            session_id=session_id,
            filename=filename,
            original_name=original_name,
            file_path=file_path,
            file_size=file_size,
            page_count=page_count,
            chunk_count=chunk_count,
            status="ready",
            created_at=now
        )
        db.add(doc)
        db.commit()
        return {
            "id": doc.id,
            "user_id": doc.user_id,
            "session_id": doc.session_id,
            "filename": doc.filename,
            "original_name": doc.original_name,
            "file_path": doc.file_path,
            "file_size": doc.file_size,
            "page_count": doc.page_count,
            "chunk_count": doc.chunk_count,
            "status": doc.status,
            "created_at": now.isoformat()
        }
    finally:
        db.close()

def list_documents(user_id: str, session_id: Optional[str] = None) -> List[Dict[str, Any]]:
    db = get_db_session()
    try:
        q = db.query(Document).filter(Document.user_id == user_id)
        if session_id:
            q = q.filter(or_(Document.session_id == session_id, Document.session_id.is_(None)))
        docs = q.order_by(desc(Document.created_at)).all()
        return [
            {
                "id": d.id,
                "user_id": d.user_id,
                "session_id": d.session_id,
                "filename": d.filename,
                "original_name": d.original_name,
                "file_path": d.file_path,
                "file_size": d.file_size,
                "page_count": d.page_count,
                "chunk_count": d.chunk_count,
                "status": d.status,
                "created_at": d.created_at.isoformat() if d.created_at else ""
            }
            for d in docs
        ]
    finally:
        db.close()

def get_document(doc_id: str, user_id: str) -> Optional[Dict[str, Any]]:
    db = get_db_session()
    try:
        d = db.query(Document).filter(Document.id == doc_id, Document.user_id == user_id).first()
        if not d:
            return None
        return {
            "id": d.id,
            "user_id": d.user_id,
            "session_id": d.session_id,
            "filename": d.filename,
            "original_name": d.original_name,
            "file_path": d.file_path,
            "file_size": d.file_size,
            "page_count": d.page_count,
            "chunk_count": d.chunk_count,
            "status": d.status,
            "created_at": d.created_at.isoformat() if d.created_at else ""
        }
    finally:
        db.close()

def rename_document(doc_id: str, user_id: str, new_name: str) -> Optional[Dict[str, Any]]:
    db = get_db_session()
    try:
        d = db.query(Document).filter(Document.id == doc_id, Document.user_id == user_id).first()
        if not d:
            return None
        d.original_name = new_name
        db.commit()
        return {
            "id": d.id,
            "user_id": d.user_id,
            "session_id": d.session_id,
            "filename": d.filename,
            "original_name": d.original_name,
            "file_path": d.file_path,
            "file_size": d.file_size,
            "page_count": d.page_count,
            "chunk_count": d.chunk_count,
            "status": d.status,
            "created_at": d.created_at.isoformat() if d.created_at else ""
        }
    finally:
        db.close()

def delete_document(doc_id: str, user_id: str) -> bool:
    db = get_db_session()
    try:
        d = db.query(Document).filter(Document.id == doc_id, Document.user_id == user_id).first()
        if d:
            db.delete(d)
            db.commit()
            return True
        return False
    finally:
        db.close()

# --- Settings Helpers ---
def get_user_settings(user_id: str) -> Dict[str, Any]:
    db = get_db_session()
    try:
        s = db.query(UserSettings).filter(UserSettings.user_id == user_id).first()
        if s:
            return {
                "user_id": s.user_id,
                "model": s.model,
                "top_k": s.top_k,
                "similarity_threshold": s.similarity_threshold,
                "theme": s.theme
            }
        return {"user_id": user_id, "model": "openai/gpt-oss-120b", "top_k": 4, "similarity_threshold": 0.0, "theme": "system"}
    finally:
        db.close()

def update_user_settings(
    user_id: str,
    model: Optional[str] = None,
    top_k: Optional[int] = None,
    similarity_threshold: Optional[float] = None,
    theme: Optional[str] = None
) -> Dict[str, Any]:
    db = get_db_session()
    try:
        s = db.query(UserSettings).filter(UserSettings.user_id == user_id).first()
        if not s:
            s = UserSettings(user_id=user_id)
            db.add(s)
        if model is not None:
            s.model = model
        if top_k is not None:
            s.top_k = top_k
        if similarity_threshold is not None:
            s.similarity_threshold = similarity_threshold
        if theme is not None:
            s.theme = theme
        db.commit()
        return {
            "user_id": s.user_id,
            "model": s.model,
            "top_k": s.top_k,
            "similarity_threshold": s.similarity_threshold,
            "theme": s.theme
        }
    finally:
        db.close()

# --- Dashboard & Global Search ---
def get_dashboard_stats(user_id: str) -> Dict[str, Any]:
    db = get_db_session()
    try:
        doc_count = db.query(Document).filter(Document.user_id == user_id).count()
        total_pages = db.query(func.coalesce(func.sum(Document.page_count), 0)).filter(Document.user_id == user_id).scalar()
        conv_count = db.query(Conversation).filter(Conversation.user_id == user_id, Conversation.is_archived == 0).count()

        recent_convs = db.query(Conversation).filter(Conversation.user_id == user_id, Conversation.is_archived == 0).order_by(desc(Conversation.updated_at)).limit(5).all()
        recent_docs = db.query(Document).filter(Document.user_id == user_id).order_by(desc(Document.created_at)).limit(5).all()

        return {
            "document_count": doc_count,
            "total_pages": int(total_pages or 0),
            "conversation_count": conv_count,
            "recent_conversations": [
                {
                    "id": c.id,
                    "title": c.title,
                    "updated_at": c.updated_at.isoformat() if c.updated_at else "",
                    "doc_count": len(json.loads(c.associated_doc_ids or "[]"))
                }
                for c in recent_convs
            ],
            "recent_documents": [
                {
                    "id": d.id,
                    "original_name": d.original_name,
                    "page_count": d.page_count,
                    "file_size": d.file_size,
                    "created_at": d.created_at.isoformat() if d.created_at else ""
                }
                for d in recent_docs
            ]
        }
    finally:
        db.close()

def global_search(user_id: str, query: str) -> Dict[str, Any]:
    db = get_db_session()
    try:
        pat = f"%{query}%"
        convs = db.query(Conversation).filter(
            Conversation.user_id == user_id,
            Conversation.title.ilike(pat)
        ).limit(10).all()

        docs = db.query(Document).filter(
            Document.user_id == user_id,
            Document.original_name.ilike(pat)
        ).limit(10).all()

        return {
            "conversations": [
                {"id": c.id, "title": c.title, "updated_at": c.updated_at.isoformat() if c.updated_at else ""}
                for c in convs
            ],
            "documents": [
                {"id": d.id, "original_name": d.original_name, "page_count": d.page_count, "created_at": d.created_at.isoformat() if d.created_at else ""}
                for d in docs
            ]
        }
    finally:
        db.close()
