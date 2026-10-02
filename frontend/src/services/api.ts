import { 
  User, 
  AuthSession, 
  ConversationItemData, 
  DocumentItem, 
  MessageItem, 
  UserSettingsData, 
  DashboardStats,
  SourceCitationData 
} from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('documind_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMsg = `Request failed: ${response.statusText}`;
    try {
      const errJson = await response.json();
      errorMsg = errJson.detail || errorMsg;
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  return response.json();
}

export const api = {
  // Auth
  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    return request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  async register(email: string, password: string, name: string): Promise<{ token: string; user: User }> {
    return request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
  },

  async getMe(): Promise<User> {
    return request('/auth/me');
  },

  async logout(): Promise<void> {
    try {
      await request('/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    } finally {
      localStorage.removeItem('documind_token');
    }
  },

  async getAuthSessions(): Promise<AuthSession[]> {
    const res = await request<{ sessions: AuthSession[] }>('/auth/sessions');
    return res.sessions;
  },

  async revokeSession(token: string): Promise<void> {
    await request(`/auth/sessions/${token}`, { method: 'DELETE' });
  },

  async revokeOtherSessions(): Promise<{ revoked_count: number }> {
    return request('/auth/sessions/revoke-others', { method: 'POST' });
  },

  // Dashboard & Search
  async getDashboardStats(): Promise<DashboardStats> {
    return request('/dashboard/stats');
  },

  async search(query: string): Promise<{ conversations: any[]; documents: any[] }> {
    return request(`/search?q=${encodeURIComponent(query)}`);
  },

  // Conversations
  async getConversations(includeArchived = false): Promise<ConversationItemData[]> {
    const res = await request<{ sessions: ConversationItemData[] }>(`/sessions?include_archived=${includeArchived}`);
    return res.sessions;
  },

  async createConversation(title?: string, docIds?: string[]): Promise<ConversationItemData> {
    return request('/sessions', {
      method: 'POST',
      body: JSON.stringify({ title, doc_ids: docIds || [] }),
    });
  },

  async getConversation(id: string): Promise<ConversationItemData> {
    return request(`/sessions/${id}`);
  },

  async updateConversation(
    id: string,
    updates: { title?: string; doc_ids?: string[]; is_archived?: boolean }
  ): Promise<ConversationItemData> {
    return request(`/sessions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  async deleteConversation(id: string): Promise<void> {
    await request(`/sessions/${id}`, { method: 'DELETE' });
  },

  async getSessionMessages(sessionId: string): Promise<MessageItem[]> {
    const res = await request<{ messages: MessageItem[] }>(`/sessions/${sessionId}/messages`);
    return res.messages;
  },

  async getSessionDocuments(sessionId: string): Promise<{ documents: DocumentItem[]; selected_ids: string[] }> {
    return request(`/sessions/${sessionId}/documents`);
  },

  async updateSessionDocuments(sessionId: string, docIds: string[]): Promise<void> {
    await request(`/sessions/${sessionId}/documents`, {
      method: 'PUT',
      body: JSON.stringify({ doc_ids: docIds }),
    });
  },

  async uploadDocumentsToSession(
    sessionId: string, 
    files: File[],
    onProgress?: (progress: number, step: string) => void
  ): Promise<{ uploaded_count: number; documents: DocumentItem[] }> {
    const formData = new FormData();
    files.forEach((f) => formData.append('files', f));

    onProgress?.(25, 'Uploading documents...');

    const headers: Record<string, string> = {
      ...getAuthHeader(),
    };

    onProgress?.(50, 'Extracting text and chunking...');

    const response = await fetch(`${API_BASE}/sessions/${sessionId}/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });

    onProgress?.(80, 'Generating embeddings & indexing in FAISS...');

    if (!response.ok) {
      let err = 'Upload failed';
      try {
        const j = await response.json();
        err = j.detail || err;
      } catch {}
      throw new Error(err);
    }

    onProgress?.(100, 'Ready');
    return response.json();
  },

  // Document Library
  async getAllDocuments(): Promise<DocumentItem[]> {
    const res = await request<{ documents: DocumentItem[] }>('/documents');
    return res.documents;
  },

  async renameDocument(id: string, name: string): Promise<DocumentItem> {
    return request(`/documents/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ name }),
    });
  },

  async deleteDocument(id: string): Promise<void> {
    await request(`/documents/${id}`, { method: 'DELETE' });
  },

  async previewDocument(id: string): Promise<{ document: DocumentItem; total_pages: number; pages: { page: number; text: string }[] }> {
    return request(`/documents/${id}/preview`);
  },

  // Settings
  async getSettings(): Promise<UserSettingsData> {
    return request('/settings');
  },

  async updateSettings(settings: Partial<UserSettingsData>): Promise<UserSettingsData> {
    return request('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  },

  // RAG Chat Stream
  async querySessionStream(
    sessionId: string,
    question: string,
    onSources: (sources: SourceCitationData[]) => void,
    onToken: (token: string) => void,
    onDone: (fullText: string, sources: SourceCitationData[]) => void,
    onError: (err: string) => void,
    signal?: AbortSignal,
    useWebSearch: boolean = true,
    onTitle?: (newTitle: string) => void
  ) {
    try {
      const response = await fetch(`${API_BASE}/sessions/${sessionId}/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify({ question, stream: true, use_web_search: useWebSearch }),
        signal,
      });

      if (!response.ok) {
        let err = 'Failed to generate response';
        try {
          const j = await response.json();
          err = j.detail || err;
        } catch {}
        onError(err);
        return;
      }

      if (!response.body) {
        onError('No readable stream available from server');
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let fullText = '';
      let receivedSources: SourceCitationData[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        let currentEvent = 'message';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          if (trimmed.startsWith('event:')) {
            currentEvent = trimmed.replace('event:', '').trim();
          } else if (trimmed.startsWith('data:')) {
            const rawData = trimmed.replace('data:', '').trim();
            try {
              const parsed = JSON.parse(rawData);

              if (currentEvent === 'sources') {
                receivedSources = parsed.sources || [];
                onSources(receivedSources);
              } else if (currentEvent === 'token') {
                const token = parsed.token || '';
                fullText += token;
                onToken(token);
              } else if (currentEvent === 'title') {
                if (parsed.title) {
                  onTitle?.(parsed.title);
                }
              } else if (currentEvent === 'done') {
                const completed = parsed.complete_text || fullText;
                const finalSources = parsed.sources || receivedSources;
                onDone(completed, finalSources);
              } else if (currentEvent === 'error') {
                onError(parsed.error || 'Server error during generation');
              }
            } catch {
              // skip parse error
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // User stopped generation manually
        return;
      }
      onError(err.message || 'Stream connection lost');
    }
  },
};
