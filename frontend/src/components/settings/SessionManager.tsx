import React, { useEffect, useState } from 'react';
import { Shield, Smartphone, Laptop, Trash2, CheckCircle2 } from 'lucide-react';
import { api } from '../../services/api';
import { AuthSession } from '../../types';
import { formatDate } from '../../utils/cn';

export const SessionManager: React.FC = () => {
  const [sessions, setSessions] = useState<AuthSession[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = async () => {
    try {
      const list = await api.getAuthSessions();
      setSessions(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleRevoke = async (token: string) => {
    try {
      await api.revokeSession(token);
      await fetchSessions();
    } catch (err) {
      alert('Failed to revoke session');
    }
  };

  const handleRevokeOthers = async () => {
    if (window.confirm('Sign out of all other devices and active browser sessions?')) {
      try {
        const res = await api.revokeOtherSessions();
        alert(`Revoked ${res.revoked_count} active sessions.`);
        await fetchSessions();
      } catch (err) {
        alert('Failed to revoke other sessions');
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
            Active Device Sessions
          </h4>
          <p className="text-[11px] text-zinc-500">
            Manage devices where your DocuMind AI account is currently signed in.
          </p>
        </div>

        {sessions.length > 1 && (
          <button
            onClick={handleRevokeOthers}
            className="px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50/50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 text-xs font-medium transition-colors"
          >
            Sign out of all other sessions
          </button>
        )}
      </div>

      <div className="space-y-2">
        {sessions.map((sess) => (
          <div
            key={sess.token}
            className="flex items-center justify-between p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-card-dark text-xs"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500">
                {sess.browser.toLowerCase().includes('mobile') ? (
                  <Smartphone className="w-4 h-4" />
                ) : (
                  <Laptop className="w-4 h-4" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {sess.browser}
                  </span>
                  {sess.is_current && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      Current session
                    </span>
                  )}
                </div>

                <div className="text-[11px] text-zinc-400 mt-0.5 space-x-2">
                  <span>IP: {sess.ip_address}</span>
                  <span>·</span>
                  <span>{sess.location}</span>
                  <span>·</span>
                  <span>Last active: {formatDate(sess.last_active)}</span>
                </div>
              </div>
            </div>

            {!sess.is_current && (
              <button
                onClick={() => handleRevoke(sess.token)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                title="Revoke session"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
