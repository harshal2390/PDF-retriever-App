export interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

export interface AuthSession {
  token: string;
  browser: string;
  ip_address: string;
  location: string;
  created_at: string;
  last_active: string;
  is_current: boolean;
}

export interface DocumentItem {
  id: string;
  user_id: string;
  session_id?: string;
  filename: string;
  original_name: string;
  file_path: string;
  file_size: number;
  page_count: number;
  chunk_count: number;
  status: 'ready' | 'processing' | 'error';
  created_at: string;
  selected?: boolean;
}

export interface SourceCitationData {
  id: number;
  doc_id?: string;
  document_name: string;
  page: number | string;
  snippet: string;
  score?: number;
  is_web?: boolean;
  url?: string;
}

export interface MessageItem {
  id: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: SourceCitationData[];
  created_at: string;
  isStreaming?: boolean;
}

export interface ConversationItemData {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  associated_doc_ids: string[];
  is_archived: number;
}

export interface UserSettingsData {
  user_id: string;
  model: string;
  top_k: number;
  similarity_threshold: number;
  theme: string;
}

export interface DashboardStats {
  document_count: number;
  total_pages: number;
  conversation_count: number;
  recent_conversations: {
    id: string;
    title: string;
    updated_at: string;
    doc_count: number;
  }[];
  recent_documents: {
    id: string;
    original_name: string;
    page_count: number;
    file_size: number;
    created_at: string;
  }[];
}
