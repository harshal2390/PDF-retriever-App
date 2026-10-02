# DocuMind AI — Multi-PDF RAG SaaS Platform

> **"Chat with your documents. Understand anything."**

DocuMind AI is a production-quality, modern Retrieval-Augmented Generation (RAG) platform. Designed with an editorial, minimal aesthetic inspired by Linear, Claude, and NotebookLM, it transforms multi-page PDF documents into interactive, grounded knowledge engines with verifiable page citations.

---

## 🏛 Core Architectural Philosophy

The defining UX concept of DocuMind AI is the transparent RAG pipeline:

```
[Uploaded PDFs] ──▶ [Text Extraction & Chunking] ──▶ [Normalized Cosine FAISS Embeddings]
                                                                  │
[User Query] ──▶ [Vector Semantic Retrieval] ◀─────────────────────┘
                       │
                       ▼
         [Top-K Ranked Source Excerpts]
                       │
                       ▼
       [Grounded LLM Generation via Groq]
                       │
                       ▼
      [Answer with Clickable [1][2] Inline Citations]
```

---

## ⚡ Tech Stack

### Backend
- **Python 3.11**
- **FastAPI**: Asynchronous REST API with CORS and Server-Sent Events (SSE) streaming
- **SQLAlchemy 2.0**: Declarative ORM managing Users, Sessions, Conversations, Documents, Messages, and Devices
- **LangChain**: Text splitters, document loaders, and prompt orchestration
- **FAISS (`faiss-cpu`)**: Local high-performance vector store with persistence and similarity scoring
- **Hugging Face (`sentence-transformers/all-MiniLM-L6-v2`)**: Normalized dense vector embeddings
- **Groq API**: High-speed LPU inference with strict grounding prompts
- **SQLite**: Zero-config persistent relational database with automatic migrations

### Frontend
- **React 18** with **TypeScript**
- **Vite**: Ultra-fast bundler and dev server
- **Tailwind CSS**: Custom color palette supporting Light (`#FAFAF9`) & Dark (`#09090B`) modes
- **Lucide Icons**: Crisp modern iconography
- **Clean Component Architecture**: Independent, modular components

---

## ✨ Key Features

1. **Three-Zone Desktop Workspace**:
   - **Left Zone**: Collapsible sidebar with navigation, grouped conversation history (*Today*, *Yesterday*, *Previous 7 days*, *Older*), search, and user settings.
   - **Center Zone**: Editorial document-style conversation feed, interactive markdown formatting, suggestion chips, thinking state, and fixed bottom composer.
   - **Right Zone**: Collapsible context & sources panel allowing per-document selection and side-by-side citation inspection.

2. **Verifiable Inline Citations `[1]`, `[2]`**:
   - Every grounded answer generates numbered citation brackets.
   - Clicking any citation opens the **Source Grounding Panel**, highlighting the exact document chunk, page number, similarity score, and relevant excerpt.
   - Quick actions to **Copy Citation** or **Preview Document Page**.

3. **Multi-PDF Upload & Real-Time Processing Pipeline**:
   - Drag-and-drop or multi-file picker.
   - Step-by-step progress tracking: *Uploading* → *Parsing text* → *Splitting chunks* → *Generating embeddings* → *FAISS Indexing* → *Ready*.

4. **Dedicated Document Library**:
   - Filter and search across all uploaded documents.
   - Inspect page counts, file sizes, chunk metrics, and indexing status.
   - Rename, delete, preview text pages, or initiate direct single-doc chats.

5. **Security & Session Management**:
   - Active device sessions list showing browser, IP address, location, and last active timestamp.
   - Single-click **Revoke Device** or **Sign Out of All Other Sessions**.

6. **Command Palette (`Cmd/Ctrl + K`)**:
   - Global modal for instant search across conversations and documents, theme toggling, and quick actions.

---

## 🚀 Quick Start Guide

### Prerequisites
- Python 3.11+
- Node.js 18+ and npm
- Groq API Key (configured in `.env`)

### 1. Backend Setup

```bash
# Activate virtual environment
# Windows:
.\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run FastAPI backend
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

The API docs will be available at: `http://127.0.0.1:8000/docs`

### 2. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install packages
npm install

# Start Vite dev server
npm run dev
```

Visit the application at: `http://localhost:5173`

### 3. Demo Account Credentials
- **Email:** `demo@documind.ai`
- **Password:** `password123`
*(Or click "Fill Demo Credentials" on the login screen, or register a new account).*

---

## 🐳 Docker Deployment

To build and run the full stack container:

```bash
docker build -t documind-ai .
docker run -p 8000:8000 --env-file .env documind-ai
```

The FastAPI backend will automatically serve both the API endpoints and the pre-built React frontend bundle at `http://localhost:8000`.

---

## 📡 REST API Reference

| Endpoint | Method | Description |
| :--- | :---: | :--- |
| `/api/auth/register` | `POST` | Create a new user account |
| `/api/auth/login` | `POST` | Authenticate and obtain session token |
| `/api/auth/me` | `GET` | Get current user profile |
| `/api/auth/sessions` | `GET` | List active device sessions |
| `/api/auth/sessions/{token}` | `DELETE` | Revoke a specific device session |
| `/api/auth/sessions/revoke-others` | `POST` | Revoke all other active sessions |
| `/api/dashboard/stats` | `GET` | Document, conversation, and page statistics |
| `/api/sessions` | `GET` / `POST` | List conversations or create a new session |
| `/api/sessions/{id}` | `GET` / `PATCH` / `DELETE` | Get, rename, archive, or delete conversation |
| `/api/sessions/{id}/documents` | `GET` / `PUT` | Get or update selected documents for session |
| `/api/sessions/{id}/upload` | `POST` | Upload and index multiple PDFs into session |
| `/api/sessions/{id}/messages` | `GET` | Retrieve chat history for conversation |
| `/api/sessions/{id}/query` | `POST` | Query RAG engine (supports SSE stream & JSON) |
| `/api/documents` | `GET` | Full user document library |
| `/api/documents/{id}/preview` | `GET` | Preview extracted text from document pages |
| `/api/settings` | `GET` / `PUT` | AI model parameters and theme preferences |
| `/api/search` | `GET` | Global search across titles and document names |
