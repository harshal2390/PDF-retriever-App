import React, { useState, useEffect } from 'react';
import { 
  User, 
  Palette, 
  Cpu, 
  Shield, 
  Check, 
  Sparkles,
  Sliders
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../services/api';
import { UserSettingsData } from '../../types';
import { SessionManager } from './SessionManager';
import { formatDate } from '../../utils/cn';

export const SettingsPanel: React.FC = () => {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<'account' | 'appearance' | 'ai' | 'security'>('account');

  const [aiSettings, setAiSettings] = useState<UserSettingsData>({
    user_id: '',
    model: 'llama-3.3-70b-versatile',
    top_k: 4,
    similarity_threshold: 0.0,
    theme: 'system',
  });
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const s = await api.getSettings();
        setAiSettings(s);
      } catch (err) {
        console.error(err);
      }
    };
    fetchSettings();
  }, []);

  const handleSaveAi = async () => {
    setSaving(true);
    try {
      await api.updateSettings({
        model: aiSettings.model,
        top_k: aiSettings.top_k,
        similarity_threshold: aiSettings.similarity_threshold,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    } catch (err) {
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-background-light dark:bg-background-dark">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Settings & Preferences
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Configure your workspace account, interface theme, and AI retrieval parameters.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 border-b border-zinc-200 dark:border-zinc-800 pb-px text-xs font-medium">
          <button
            onClick={() => setActiveTab('account')}
            className={`flex items-center gap-2 px-3 py-2 border-b-2 transition-colors ${
              activeTab === 'account'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Account</span>
          </button>

          <button
            onClick={() => setActiveTab('appearance')}
            className={`flex items-center gap-2 px-3 py-2 border-b-2 transition-colors ${
              activeTab === 'appearance'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Appearance</span>
          </button>

          <button
            onClick={() => setActiveTab('ai')}
            className={`flex items-center gap-2 px-3 py-2 border-b-2 transition-colors ${
              activeTab === 'ai'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>AI & Retrieval</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-2 px-3 py-2 border-b-2 transition-colors ${
              activeTab === 'security'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Security</span>
          </button>
        </div>

        {/* Tab 1: Account */}
        {activeTab === 'account' && (
          <div className="p-6 rounded-2xl bg-white dark:bg-card-dark border border-zinc-200/80 dark:border-zinc-800 space-y-4 shadow-2xs">
            <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
              Profile Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-zinc-400 block mb-1">Full Name</label>
                <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 font-medium">
                  {user?.name}
                </div>
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">Email Address</label>
                <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 font-medium">
                  {user?.email}
                </div>
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">Member Since</label>
                <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200">
                  {user?.created_at
                    ? new Date(user.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : 'Active Member'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Appearance */}
        {activeTab === 'appearance' && (
          <div className="p-6 rounded-2xl bg-white dark:bg-card-dark border border-zinc-200/80 dark:border-zinc-800 space-y-4 shadow-2xs">
            <div>
              <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                Theme & Interface Style
              </h3>
              <p className="text-xs text-zinc-500 mt-1">
                Choose your preferred interface theme or match your system settings automatically.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <button
                onClick={() => setTheme('light')}
                className={`p-4 rounded-xl border text-left transition-all ${
                  theme === 'light'
                    ? 'border-indigo-600 bg-indigo-50/20 dark:bg-indigo-950/20 ring-1 ring-indigo-500'
                    : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300'
                }`}
              >
                <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-xs mb-2">
                  ☀
                </div>
                <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Light</div>
                <div className="text-[11px] text-zinc-400 mt-0.5">Clean high-contrast document paper feel (#FAFAF9)</div>
              </button>

              <button
                onClick={() => setTheme('dark')}
                className={`p-4 rounded-xl border text-left transition-all ${
                  theme === 'dark'
                    ? 'border-indigo-600 bg-indigo-50/20 dark:bg-indigo-950/20 ring-1 ring-indigo-500'
                    : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300'
                }`}
              >
                <div className="w-6 h-6 rounded-full bg-zinc-800 text-zinc-200 flex items-center justify-center text-xs mb-2">
                  ☾
                </div>
                <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Dark</div>
                <div className="text-[11px] text-zinc-400 mt-0.5">Deep obsidian minimal dark mode (#09090B)</div>
              </button>

              <button
                onClick={() => setTheme('system')}
                className={`p-4 rounded-xl border text-left transition-all ${
                  theme === 'system'
                    ? 'border-indigo-600 bg-indigo-50/20 dark:bg-indigo-950/20 ring-1 ring-indigo-500'
                    : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300'
                }`}
              >
                <div className="w-6 h-6 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 flex items-center justify-center text-xs mb-2">
                  ⚙
                </div>
                <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">System</div>
                <div className="text-[11px] text-zinc-400 mt-0.5">Sync with operating system preferences</div>
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: AI & Retrieval Settings */}
        {activeTab === 'ai' && (
          <div className="p-6 rounded-2xl bg-white dark:bg-card-dark border border-zinc-200/80 dark:border-zinc-800 space-y-5 shadow-2xs">
            <div>
              <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                Groq LLM & FAISS Retrieval Configuration
              </h3>
              <p className="text-xs text-zinc-500 mt-1">
                Fine-tune inference models, retrieval chunk depth, and similarity thresholds.
              </p>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="font-medium text-zinc-800 dark:text-zinc-200 block mb-1.5">
                  LLM Inference Model
                </label>
                <select
                  value={aiSettings.model}
                  onChange={(e) => setAiSettings({ ...aiSettings, model: e.target.value })}
                  className="w-full sm:w-80 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="openai/gpt-oss-120b">openai/gpt-oss-120b (Recommended - Flagship)</option>
                  <option value="qwen/qwen3.8-27b">qwen/qwen3.8-27b (Fast & Precise)</option>
                  <option value="openai/gpt-oss-20b">openai/gpt-oss-20b (Ultra-fast)</option>
                </select>
                <p className="text-[11px] text-zinc-400 mt-1">
                  Powered by Groq ultra-low latency LPU engine.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-medium text-zinc-800 dark:text-zinc-200">
                    Top K Retrieved Chunks
                  </label>
                  <span className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
                    {aiSettings.top_k} chunks
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={8}
                  step={1}
                  value={aiSettings.top_k}
                  onChange={(e) => setAiSettings({ ...aiSettings, top_k: parseInt(e.target.value, 10) })}
                  className="w-full accent-indigo-600"
                />
                <p className="text-[11px] text-zinc-400 mt-1">
                  Higher values provide broader context across more pages, while lower values offer tighter precision.
                </p>
              </div>

              <div>
                <label className="font-medium text-zinc-800 dark:text-zinc-200 block mb-1.5">
                  Vector Embedding Model
                </label>
                <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-mono text-[11px]">
                  sentence-transformers/all-MiniLM-L6-v2 (Normalized Cosine)
                </div>
              </div>

              <div className="pt-3 flex items-center gap-3">
                <button
                  onClick={handleSaveAi}
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium shadow-sm transition-all flex items-center gap-2"
                >
                  {savedSuccess ? <Check className="w-3.5 h-3.5" /> : null}
                  <span>{saving ? 'Saving...' : savedSuccess ? 'Saved!' : 'Save AI Settings'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Security */}
        {activeTab === 'security' && (
          <div className="p-6 rounded-2xl bg-white dark:bg-card-dark border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
            <SessionManager />
          </div>
        )}
      </div>
    </div>
  );
};
