import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { 
  ConversationItemData, 
  DocumentItem, 
  MessageItem, 
  SourceCitationData 
} from '../types';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

type ActiveView = 'workspace' | 'dashboard' | 'library' | 'settings';

interface UploadProgressState {
  isUploading: boolean;
  progress: number;
  step: string;
}

interface WorkspaceContextType {
  currentView: ActiveView;
  setCurrentView: (view: ActiveView) => void;
  currentSession: ConversationItemData | null;
  sessions: ConversationItemData[];
  messages: MessageItem[];
  sessionDocs: DocumentItem[];
  selectedDocIds: string[];
  allDocs: DocumentItem[];
  activeSource: SourceCitationData | null;
  rightPanelTab: 'documents' | 'sources' | null;
  setRightPanelTab: (tab: 'documents' | 'sources' | null) => void;
  leftSidebarOpen: boolean;
  setLeftSidebarOpen: (open: boolean) => void;
  rightSidebarOpen: boolean;
  setRightSidebarOpen: (open: boolean) => void;
  isGenerating: boolean;
  uploadState: UploadProgressState;
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
  previewDoc: DocumentItem | null;
  setPreviewDoc: (doc: DocumentItem | null) => void;
  webSearchEnabled: boolean;
  setWebSearchEnabled: (enabled: boolean) => void;

  // Actions
  loadSessions: () => Promise<void>;
  loadAllDocs: () => Promise<void>;
  selectSession: (id: string) => Promise<void>;
  createNewSession: (title?: string, docIds?: string[]) => Promise<string>;
  renameSession: (id: string, newTitle: string) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  toggleDocSelection: (docId: string) => Promise<void>;
  selectAllDocs: (docIds: string[]) => Promise<void>;
  uploadPDFsToSession: (files: File[]) => Promise<void>;
  sendMessage: (text: string) => Promise<void>;
  stopGeneration: () => void;
  inspectSource: (source: SourceCitationData) => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState<ActiveView>('workspace');
  const [currentSession, setCurrentSession] = useState<ConversationItemData | null>(null);
  const [sessions, setSessions] = useState<ConversationItemData[]>([]);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [sessionDocs, setSessionDocs] = useState<DocumentItem[]>([]);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [allDocs, setAllDocs] = useState<DocumentItem[]>([]);
  
  const [activeSource, setActiveSource] = useState<SourceCitationData | null>(null);
  const [rightPanelTab, setRightPanelTab] = useState<'documents' | 'sources' | null>('documents');
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);

  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadState, setUploadState] = useState<UploadProgressState>({
    isUploading: false,
    progress: 0,
    step: '',
  });

  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);
  const [webSearchEnabled, setWebSearchEnabled] = useState(true);

  const abortControllerRef = useRef<AbortController | null>(null);

  const loadSessions = async () => {
    if (!user) return;
    try {
      const convs = await api.getConversations();
      setSessions(convs);
      setCurrentSession((curr) => {
        if (!curr) return null;
        const updated = convs.find((c) => c.id === curr.id);
        return updated || curr;
      });
      return;
    } catch (err) {
      console.error('Failed to load conversations:', err);
    }
  };

  const loadAllDocs = async () => {
    if (!user) return;
    try {
      const docs = await api.getAllDocuments();
      setAllDocs(docs);
    } catch (err) {
      console.error('Failed to load documents:', err);
    }
  };

  useEffect(() => {
    if (user) {
      loadSessions().then(() => {
        loadAllDocs();
      });
    } else {
      setSessions([]);
      setCurrentSession(null);
      setMessages([]);
      setSessionDocs([]);
      setAllDocs([]);
    }
  }, [user]);

  // Keyboard shortcut for Command Palette (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const selectSession = async (sessionId: string) => {
    try {
      const conv = await api.getConversation(sessionId);
      setCurrentSession(conv);
      setCurrentView('workspace');

      const [msgs, docsData] = await Promise.all([
        api.getSessionMessages(sessionId),
        api.getSessionDocuments(sessionId),
      ]);

      setMessages(msgs);
      setSessionDocs(docsData.documents);
      setSelectedDocIds(docsData.selected_ids || []);
    } catch (err) {
      console.error('Failed to select conversation:', err);
    }
  };

  const createNewSession = async (title?: string, docIds?: string[]): Promise<string> => {
    const newConv = await api.createConversation(title || 'New Conversation', docIds);
    setSessions((prev) => [newConv, ...prev]);
    await selectSession(newConv.id);
    return newConv.id;
  };

  const renameSession = async (id: string, newTitle: string) => {
    await api.updateConversation(id, { title: newTitle });
    setSessions((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title: newTitle } : c))
    );
    if (currentSession?.id === id) {
      setCurrentSession((prev) => (prev ? { ...prev, title: newTitle } : null));
    }
  };

  const deleteSession = async (id: string) => {
    await api.deleteConversation(id);
    setSessions((prev) => prev.filter((c) => c.id !== id));
    if (currentSession?.id === id) {
      const remaining = sessions.filter((c) => c.id !== id);
      if (remaining.length > 0) {
        selectSession(remaining[0].id);
      } else {
        setCurrentSession(null);
        setMessages([]);
        setSessionDocs([]);
        setSelectedDocIds([]);
      }
    }
  };

  const toggleDocSelection = async (docId: string) => {
    if (!currentSession) return;
    const isSelected = selectedDocIds.includes(docId);
    const updated = isSelected
      ? selectedDocIds.filter((id) => id !== docId)
      : Array.from(new Set([...selectedDocIds, docId]));

    setSelectedDocIds(updated);
    setSessionDocs((prev) =>
      prev.map((d) => (d.id === docId ? { ...d, selected: !isSelected } : d))
    );

    try {
      await api.updateSessionDocuments(currentSession.id, updated);
      // Update local session
      setCurrentSession((prev) =>
        prev ? { ...prev, associated_doc_ids: updated } : null
      );
    } catch (err) {
      console.error('Failed to update session selected documents:', err);
    }
  };

  const selectAllDocs = async (docIds: string[]) => {
    if (!currentSession) return;
    const isAllSelected = docIds.length > 0 && docIds.every((id) => selectedDocIds.includes(id));
    const newSelected = isAllSelected ? [] : docIds;

    setSelectedDocIds(newSelected);
    setSessionDocs((prev) => prev.map((d) => ({ ...d, selected: !isAllSelected })));

    try {
      await api.updateSessionDocuments(currentSession.id, newSelected);
      setCurrentSession((prev) =>
        prev ? { ...prev, associated_doc_ids: newSelected } : null
      );
    } catch (err) {
      console.error('Failed to update session selected documents:', err);
    }
  };

  const uploadPDFsToSession = async (files: File[]) => {
    if (!currentSession) {
      // Auto create a session if none selected
      const newId = await createNewSession('Document Analysis');
      await doUpload(newId, files);
    } else {
      await doUpload(currentSession.id, files);
    }
  };

  const doUpload = async (sessionId: string, files: File[]) => {
    setUploadState({ isUploading: true, progress: 10, step: 'Preparing upload...' });
    try {
      await api.uploadDocumentsToSession(sessionId, files, (prog, step) => {
        setUploadState({ isUploading: true, progress: prog, step });
      });

      // Refresh documents
      const docsData = await api.getSessionDocuments(sessionId);
      setSessionDocs(docsData.documents);
      setSelectedDocIds(docsData.selected_ids || []);
      loadAllDocs();
      loadSessions();
    } catch (err: any) {
      alert(`Upload error: ${err.message}`);
    } finally {
      setTimeout(() => {
        setUploadState({ isUploading: false, progress: 0, step: '' });
      }, 1000);
    }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isGenerating) return;

    let targetSessionId = currentSession?.id;
    if (!targetSessionId) {
      // Create session first
      const title = text.slice(0, 30) + (text.length > 30 ? '...' : '');
      targetSessionId = await createNewSession(title);
    }

    const tempUserId = `user_${Date.now()}`;
    const tempAssistantId = `asst_${Date.now()}`;

    // 1. Optimistic user message
    const userMsg: MessageItem = {
      id: tempUserId,
      session_id: targetSessionId,
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    };

    // 2. Placeholder assistant message with streaming state
    const assistantMsg: MessageItem = {
      id: tempAssistantId,
      session_id: targetSessionId,
      role: 'assistant',
      content: '',
      sources: [],
      created_at: new Date().toISOString(),
      isStreaming: true,
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setIsGenerating(true);

    abortControllerRef.current = new AbortController();

    await api.querySessionStream(
      targetSessionId,
      text,
      // onSources
      (sources) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempAssistantId ? { ...m, sources } : m
          )
        );
      },
      // onToken
      (token) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempAssistantId
              ? { ...m, content: m.content + token }
              : m
          )
        );
      },
      // onDone
      (finalText, sources) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempAssistantId
              ? { ...m, content: finalText, sources, isStreaming: false }
              : m
          )
        );
        setIsGenerating(false);
        abortControllerRef.current = null;
        loadSessions(); // update timestamp
      },
      // onError
      (error) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempAssistantId
              ? { ...m, content: `Error: ${error}`, isStreaming: false }
              : m
          )
        );
        setIsGenerating(false);
        abortControllerRef.current = null;
      },
      abortControllerRef.current.signal,
      webSearchEnabled,
      // onTitle (ChatGPT-style auto rename)
      (newTitle) => {
        setCurrentSession((curr) => (curr && curr.id === targetSessionId ? { ...curr, title: newTitle } : curr));
        setSessions((prev) =>
          prev.map((s) => (s.id === targetSessionId ? { ...s, title: newTitle } : s))
        );
      }
    );
  };

  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsGenerating(false);
      setMessages((prev) =>
        prev.map((m) => (m.isStreaming ? { ...m, isStreaming: false } : m))
      );
    }
  };

  const inspectSource = (source: SourceCitationData) => {
    setActiveSource(source);
    setRightPanelTab('sources');
    setRightSidebarOpen(true);
  };

  return (
    <WorkspaceContext.Provider
      value={{
        currentView,
        setCurrentView,
        currentSession,
        sessions,
        messages,
        sessionDocs,
        selectedDocIds,
        allDocs,
        activeSource,
        rightPanelTab,
        setRightPanelTab,
        leftSidebarOpen,
        setLeftSidebarOpen,
        rightSidebarOpen,
        setRightSidebarOpen,
        isGenerating,
        uploadState,
        commandPaletteOpen,
        setCommandPaletteOpen,
        previewDoc,
        setPreviewDoc,
        webSearchEnabled,
        setWebSearchEnabled,
        loadSessions,
        loadAllDocs,
        selectSession,
        createNewSession,
        renameSession,
        deleteSession,
        toggleDocSelection,
        selectAllDocs,
        uploadPDFsToSession,
        sendMessage,
        stopGeneration,
        inspectSource,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context) throw new Error('useWorkspace must be used within WorkspaceProvider');
  return context;
};
