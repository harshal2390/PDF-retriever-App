import sys
import os
from pathlib import Path

# Force UTF-8 stdout if possible
if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_full_pipeline():
    print("1. Testing Health Endpoint...")
    res = client.get("/api/health")
    assert res.status_code == 200, res.text
    print("[PASS] Health Check passed:", res.json())

    print("\n2. Testing Authentication (Demo Login)...")
    login_res = client.post("/api/auth/login", json={
        "email": "demo@documind.ai",
        "password": "password123"
    })
    assert login_res.status_code == 200, login_res.text
    auth_data = login_res.json()
    token = auth_data["token"]
    user = auth_data["user"]
    print("[PASS] Logged in successfully as:", user["email"])
    headers = {"Authorization": f"Bearer {token}"}

    print("\n3. Testing Dashboard Stats...")
    stats_res = client.get("/api/dashboard/stats", headers=headers)
    assert stats_res.status_code == 200
    print("[PASS] Initial stats:", stats_res.json())

    print("\n4. Testing Create Conversation Session...")
    conv_res = client.post("/api/sessions", json={"title": "Cloud Computing Analysis"}, headers=headers)
    assert conv_res.status_code == 200
    session_id = conv_res.json()["id"]
    print("[PASS] Created conversation session ID:", session_id)

    pdf_path = Path("data/pdfs/Unit-2.pdf")
    if pdf_path.exists():
        print(f"\n5. Testing PDF Upload & Indexing ({pdf_path.name})...")
        with open(pdf_path, "rb") as f:
            upload_res = client.post(
                f"/api/sessions/{session_id}/upload",
                files={"files": (pdf_path.name, f, "application/pdf")},
                headers=headers
            )
        assert upload_res.status_code == 200, upload_res.text
        upload_data = upload_res.json()
        print(f"[PASS] Uploaded and indexed {upload_data['uploaded_count']} document(s):")
        for doc in upload_data["documents"]:
            print(f"   - {doc['original_name']}: {doc['page_count']} pages, {doc['chunk_count']} chunks")

        print("\n6. Testing RAG Query with Grounded Citations (Sync)...")
        query_res = client.post(
            f"/api/sessions/{session_id}/query",
            json={"question": "What are the main topics discussed in this unit?", "stream": False},
            headers=headers
        )
        assert query_res.status_code == 200, query_res.text
        answer_data = query_res.json()
        print("[PASS] Grounded Answer received:")
        print(answer_data["answer"][:300] + "...")
        print(f"[PASS] Sources retrieved: {len(answer_data['sources'])}")
        for s in answer_data["sources"][:3]:
            print(f"   [{s['id']}] {s['document_name']} (Page {s['page']}) Score: {s.get('score')}")

        print("\n6b. Testing RAG Query with Dual Grounding (Document + Web Search)...")
        web_query_res = client.post(
            f"/api/sessions/{session_id}/query",
            json={
                "question": "What is the latest status of quantum computing in cloud services?",
                "stream": False,
                "use_web_search": True
            },
            headers=headers
        )
        assert web_query_res.status_code == 200, web_query_res.text
        web_answer_data = web_query_res.json()
        print("[PASS] Web-augmented Answer received:")
        print(web_answer_data["answer"][:300] + "...")
        print(f"[PASS] Total dual sources retrieved: {len(web_answer_data['sources'])}")
        for s in web_answer_data["sources"]:
            src_type = "Web" if s.get("is_web") else f"Page {s.get('page')}"
            print(f"   [{s['id']}] [{src_type}] {s['document_name']}")

    print("\n7. Testing Session Messages Retrieval...")
    msg_res = client.get(f"/api/sessions/{session_id}/messages", headers=headers)
    assert msg_res.status_code == 200
    messages = msg_res.json()["messages"]
    print(f"[PASS] Retrieved {len(messages)} messages from database.")

    print("\n8. Testing Active Device Sessions (Security)...")
    devices_res = client.get("/api/auth/sessions", headers=headers)
    assert devices_res.status_code == 200
    print(f"[PASS] Active sessions: {len(devices_res.json()['sessions'])}")

    print("\n9. Testing ChatGPT-style Auto Conversation Renaming...")
    # Create conversation with default title "New Conversation"
    auto_conv_res = client.post("/api/sessions", json={"title": "New Conversation"}, headers=headers)
    assert auto_conv_res.status_code == 200
    auto_conv_id = auto_conv_res.json()["id"]
    print(f"[PASS] Created fresh session with default title: '{auto_conv_res.json()['title']}'")

    # Ask first question
    first_q_res = client.post(
        f"/api/sessions/{auto_conv_id}/query",
        json={
            "question": "What is continuous integration and automated testing in DevOps?",
            "stream": False,
            "use_web_search": True
        },
        headers=headers
    )
    assert first_q_res.status_code == 200, first_q_res.text
    renamed_title = first_q_res.json().get("title")
    print(f"[PASS] Response received! Auto-renamed title in query response: '{renamed_title}'")

    # Verify session details in DB
    check_conv_res = client.get(f"/api/sessions/{auto_conv_id}", headers=headers)
    assert check_conv_res.status_code == 200
    db_title = check_conv_res.json()["title"]
    print(f"[PASS] Verified persisted title in database: '{db_title}'")
    assert db_title != "New Conversation", "Title should have been updated from 'New Conversation'!"

    print("\n=== ALL BACKEND & RAG PIPELINE TESTS PASSED! ===")

if __name__ == "__main__":
    test_full_pipeline()
