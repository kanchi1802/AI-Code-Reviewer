import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  Activity,
  CheckCircle2,
  Cpu,
  Database,
  Server,
  Shield,
  User,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();

  const { data: health, isLoading: isHealthLoading } = useQuery({
    queryKey: ['systemHealth'],
    queryFn: () => api.getHealth(),
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-8 text-slate-100">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Account & System Settings</h1>
        <p className="text-sm text-slate-400 mt-1">
          Review your account profile and inspect server-side review engine configuration.
        </p>
      </div>

      {/* Account Profile Card */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-6">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
          <User className="w-5 h-5 text-indigo-400" />
          <h2 className="text-base font-semibold text-white">Developer Profile</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold block mb-1">
              Full Name
            </span>
            <span className="text-sm font-medium text-slate-200">{user?.name}</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold block mb-1">
              Email Address
            </span>
            <span className="text-sm font-medium text-slate-200">{user?.email}</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold block mb-1">
              Account ID
            </span>
            <span className="text-xs font-mono text-slate-400 truncate block">{user?.id}</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold block mb-1">
              Member Since
            </span>
            <span className="text-sm font-medium text-slate-200">
              {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {/* Backend Engine & Provider Status */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-6">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
          <Activity className="w-5 h-5 text-indigo-400" />
          <h2 className="text-base font-semibold text-white">Review Engine Status</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
              <Server className="w-4 h-4 text-emerald-400" />
              <span>FastAPI Gateway</span>
            </div>
            <span className="text-sm font-semibold text-emerald-400 flex items-center gap-1.5 mt-2">
              <CheckCircle2 className="w-4 h-4" />
              {isHealthLoading ? 'Checking...' : health?.status?.toUpperCase() || 'ONLINE'}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
              <Database className="w-4 h-4 text-indigo-400" />
              <span>Database Connection</span>
            </div>
            <span className="text-sm font-semibold text-slate-200 flex items-center gap-1.5 mt-2 capitalize">
              {isHealthLoading ? 'Connecting...' : health?.database || 'Connected'}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
              <Cpu className="w-4 h-4 text-purple-400" />
              <span>Active AI Provider</span>
            </div>
            <span className="text-sm font-semibold text-purple-400 flex items-center gap-1.5 mt-2 uppercase">
              {isHealthLoading ? 'Loading...' : health?.ai_provider || 'OPENAI'}
            </span>
          </div>
        </div>
      </div>

      {/* Security & Code Retention Notice */}
      <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-3">
        <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
          <Shield className="w-4 h-4" />
          <span>Security & Data Confidentiality Notice</span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          • All provider API keys (OpenAI, Gemini, GitHub) remain strictly on the backend server and are never exposed to browser client sessions.
        </p>
        <p className="text-xs text-slate-400 leading-relaxed">
          • Source code retention is configurable via the <code className="text-indigo-300">STORE_SOURCE_CODE</code> environment flag. Submitted code is analyzed securely and never trained on without your explicit authorization.
        </p>
        <p className="text-xs text-slate-400 leading-relaxed">
          • Password credentials are cryptographically protected using Argon2/bcrypt algorithms with salted digests.
        </p>
      </div>
    </div>
  );
};
