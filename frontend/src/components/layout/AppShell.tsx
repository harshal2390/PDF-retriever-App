import React from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { RightPanel } from './RightPanel';
import { ChatContainer } from '../chat/ChatContainer';
import { WorkspaceDashboard } from '../dashboard/WorkspaceDashboard';
import { DocumentLibrary } from '../library/DocumentLibrary';
import { SettingsPanel } from '../settings/SettingsPanel';
import { CommandPalette } from '../navigation/CommandPalette';
import { DocumentPreviewModal } from '../documents/DocumentPreviewModal';

export const AppShell: React.FC = () => {
  const { currentView, leftSidebarOpen, setLeftSidebarOpen } = useWorkspace();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background-light dark:bg-background-dark font-sans select-none antialiased">
      {/* 1. Left Zone: Navigation & Conversation History */}
      <Sidebar />

      {/* Mobile Drawer Backdrop */}
      {leftSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden backdrop-blur-xs"
          onClick={() => setLeftSidebarOpen(false)}
        />
      )}

      {/* 2. Center Zone: Workspace Header + Active View */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
        <Header />

        <div className="flex-1 overflow-hidden flex flex-col">
          {currentView === 'workspace' && <ChatContainer />}
          {currentView === 'dashboard' && <WorkspaceDashboard />}
          {currentView === 'library' && <DocumentLibrary />}
          {currentView === 'settings' && <SettingsPanel />}
        </div>
      </main>

      {/* 3. Right Zone: Documents Context & Grounding Sources Inspector */}
      {currentView === 'workspace' && <RightPanel />}

      {/* Global Modals */}
      <CommandPalette />
      <DocumentPreviewModal />
    </div>
  );
};
