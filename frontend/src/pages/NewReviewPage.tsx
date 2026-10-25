import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { api } from '../services/api';
import type { FindingCategory } from '../types';
import {
  AlertCircle,
  Bug,
  Code2,
  FileCode,
  GitPullRequest,
  Info,
  Loader2,
  RotateCcw,
  Send,
  ShieldAlert,
  Sparkles,
  Zap,
} from 'lucide-react';

const SAMPLE_CODE = `def process_transaction(user_id, amount, divisor):
    # Potential SQL injection risk
    query = f"SELECT balance FROM accounts WHERE user_id = '{user_id}'"
    
    # Division by zero risk
    fee_rate = 100 / divisor
    
    # Hardcoded test secret
    admin_secret = "sk_live_12345678abcdefgh"
    
    try:
        balance = fetch_account(query)
        return balance - (amount * fee_rate)
    except:
        # Bare except catches signals and masks fatal errors
        return None
`;

export const NewReviewPage: React.FC = () => {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'pasted' | 'github'>('pasted');
  const [code, setCode] = useState<string>(SAMPLE_CODE);
  const [language, setLanguage] = useState<string>('python');
  const [title, setTitle] = useState<string>('');
  const [depth, setDepth] = useState<'standard' | 'deep'>('standard');
  const [prUrl, setPrUrl] = useState<string>('');

  const [categories, setCategories] = useState<FindingCategory[]>([
    'bug',
    'security',
    'performance',
    'maintainability',
  ]);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const toggleCategory = (cat: FindingCategory) => {
    if (categories.includes(cat)) {
      if (categories.length === 1) return; // Keep at least one category checked
      setCategories(categories.filter((c) => c !== cat));
    } else {
      setCategories([...categories, cat]);
    }
  };

  const codeBytes = new TextEncoder().encode(code).length;
  const maxBytes = 100_000;
  const isOversized = codeBytes > maxBytes;

  const handleSubmitPasted = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!code.trim()) {
      setError('Please provide code to analyze.');
      return;
    }

    if (isOversized) {
      setError(`Code size (${Math.round(codeBytes / 1024)} KB) exceeds the 100 KB limit.`);
      return;
    }

    try {
      setIsSubmitting(true);
      const review = await api.createPastedReview({
        code,
        language: language === 'auto' ? undefined : language,
        title: title.trim() || undefined,
        categories,
        depth,
      });
      navigate(`/reviews/${review.id}`);
    } catch (err: any) {
      setError(err.message || 'Review submission failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitGitHub = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!prUrl.trim()) {
      setError('Please provide a valid GitHub Pull Request URL.');
      return;
    }

    try {
      setIsSubmitting(true);
      const review = await api.createGitHubReview({
        pull_request_url: prUrl.trim(),
        title: title.trim() || undefined,
        categories,
        depth,
      });
      navigate(`/reviews/${review.id}`);
    } catch (err: any) {
      setError(err.message || 'GitHub review failed. Ensure the PR is valid and accessible.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const categoryConfigs: { key: FindingCategory; label: string; icon: any; color: string }[] = [
    { key: 'bug', label: 'Bugs & Crashes', icon: Bug, color: 'text-rose-400' },
    { key: 'security', label: 'Security & CVEs', icon: ShieldAlert, color: 'text-purple-400' },
    { key: 'performance', label: 'Performance & Leaks', icon: Zap, color: 'text-emerald-400' },
    { key: 'maintainability', label: 'Maintainability', icon: Sparkles, color: 'text-cyan-400' },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6 text-slate-100">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Start New Code Review</h1>
        <p className="text-sm text-slate-400 mt-1">
          Submit source code or a live GitHub pull request for automated AI analysis and actionable fixes.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800">
        <button
          onClick={() => {
            setActiveTab('pasted');
            setError(null);
          }}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'pasted'
              ? 'border-indigo-500 text-indigo-400 bg-slate-900/40'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/20'
          }`}
        >
          <Code2 className="w-4 h-4" />
          Pasted Code
        </button>
        <button
          onClick={() => {
            setActiveTab('github');
            setError(null);
          }}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'github'
              ? 'border-indigo-500 text-indigo-400 bg-slate-900/40'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/20'
          }`}
        >
          <GitPullRequest className="w-4 h-4" />
          GitHub Pull Request
        </button>
      </div>

      {/* Error alert */}
      {error && (
        <div className="p-4 rounded-xl bg-red-950/50 border border-red-800 text-red-300 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-400" />
          <div>
            <p className="font-semibold text-red-200">Analysis Request Failed</p>
            <p className="mt-0.5 text-xs text-red-300/90">{error}</p>
          </div>
        </div>
      )}

      {/* Main Review Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Editor or URL Input (2 spans) */}
        <div className="lg:col-span-2 space-y-4">
          {activeTab === 'pasted' ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Source Code Editor
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <label htmlFor="lang-select" className="text-xs text-slate-400">Language:</label>
                  <select
                    id="lang-select"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="auto">Auto-detect</option>
                    <option value="python">Python</option>
                    <option value="typescript">TypeScript</option>
                    <option value="javascript">JavaScript</option>
                    <option value="go">Go</option>
                    <option value="rust">Rust</option>
                    <option value="java">Java</option>
                    <option value="csharp">C#</option>
                    <option value="cpp">C++</option>
                    <option value="html">HTML</option>
                    <option value="sql">SQL</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => setCode('')}
                    title="Clear editor"
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Monaco Editor Container */}
              <div className="rounded-xl overflow-hidden border border-slate-800 bg-[#1e1e1e]">
                <Editor
                  height="450px"
                  language={language === 'auto' ? 'python' : language}
                  theme="vs-dark"
                  value={code}
                  onChange={(val) => setCode(val || '')}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 13,
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    lineNumbers: 'on',
                    tabSize: 4,
                  }}
                />
              </div>

              {/* Editor footer / meter */}
              <div className="flex items-center justify-between text-xs text-slate-400 px-1 pt-1">
                <span>Lines: {code.split('\n').length}</span>
                <span className={isOversized ? 'text-red-400 font-bold' : ''}>
                  {(codeBytes / 1024).toFixed(1)} KB / {(maxBytes / 1024).toFixed(0)} KB max
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-6">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
                <GitPullRequest className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-semibold text-white">GitHub Pull Request Details</h3>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Pull Request URL
                </label>
                <input
                  type="url"
                  required
                  value={prUrl}
                  onChange={(e) => setPrUrl(e.target.value)}
                  placeholder="https://github.com/owner/repository/pull/123"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
                <p className="text-xs text-slate-400">
                  Provide a public GitHub pull request URL. For private repositories, configure a GitHub Personal Access Token in your environment.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2 text-xs text-slate-400">
                <div className="flex items-center gap-1.5 text-indigo-400 font-semibold">
                  <Info className="w-4 h-4" />
                  <span>How Diff Analysis Works</span>
                </div>
                <p>
                  The review engine fetches changed file patches directly from GitHub's REST API. It analyzes code additions and modifications, filtering out large binaries and lockfiles, and attaches findings to the exact affected lines.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Settings & Submit (1 span) */}
        <div className="space-y-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 pb-3 border-b border-slate-800">
              Review Parameters
            </h3>

            {/* Optional Title */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Review Title (Optional)
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Auth Token Refactor"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Categories */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Target Categories
              </label>
              <div className="space-y-2">
                {categoryConfigs.map((cfg) => {
                  const Icon = cfg.icon;
                  const checked = categories.includes(cfg.key);
                  return (
                    <label
                      key={cfg.key}
                      onClick={() => toggleCategory(cfg.key)}
                      className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer select-none transition-colors ${
                        checked
                          ? 'bg-slate-800/80 border-indigo-500/50 text-white'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 text-xs font-medium">
                        <Icon className={`w-4 h-4 ${cfg.color}`} />
                        <span>{cfg.label}</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {}}
                        className="rounded border-slate-700 text-indigo-600 focus:ring-0"
                      />
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Analysis Depth */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Analysis Depth
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDepth('standard')}
                  className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-colors cursor-pointer ${
                    depth === 'standard'
                      ? 'bg-indigo-600 text-white border-indigo-500'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  Standard
                </button>
                <button
                  type="button"
                  onClick={() => setDepth('deep')}
                  className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-colors cursor-pointer ${
                    depth === 'deep'
                      ? 'bg-indigo-600 text-white border-indigo-500'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  Deep
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="button"
              disabled={isSubmitting || (activeTab === 'pasted' && isOversized)}
              onClick={activeTab === 'pasted' ? handleSubmitPasted : handleSubmitGitHub}
              className="w-full py-3 px-4 rounded-xl font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer hover:scale-101"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Analyzing Code...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Submit for Review</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
