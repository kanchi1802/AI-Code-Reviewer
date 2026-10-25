import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ArrowRight,
  Bug,
  GitPullRequest,
  ShieldAlert,
  Sparkles,
  Zap,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] bg-slate-950 text-slate-100">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-28 px-4 sm:px-6 lg:px-8 border-b border-slate-900">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.15),rgba(255,255,255,0))] pointer-events-none" />
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-indigo-950/80 text-indigo-300 border border-indigo-800/80 mb-6 shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI-Powered Automated Code Review Engine</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white mb-6 leading-tight">
            Ship High-Quality Code with{' '}
            <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
              Instant AI Reviews
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Detect hidden bugs, security vulnerabilities, performance bottlenecks, and maintainability issues
            before they reach production. Analyze code snippets or live GitHub Pull Requests in seconds.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {user ? (
              <Link
                to="/dashboard"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all hover:scale-102"
              >
                Go to Dashboard
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all hover:scale-102"
                >
                  Start Reviewing Free
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/login"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
                >
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-white tracking-tight">Enterprise-Grade Analysis Features</h2>
          <p className="text-slate-400 mt-3 max-w-xl mx-auto">
            Engineered with senior architect review rigor, anti-injection defenses, and grounded location precision.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Feature 1 */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-indigo-500/50 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-rose-950/60 border border-rose-800/80 flex items-center justify-center text-rose-400 mb-4">
              <Bug className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Bugs & Edge Cases</h3>
            <p className="text-sm text-slate-400">
              Uncovers unhandled exceptions, zero-division hazards, null pointer crashes, and subtle logic regressions.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-indigo-500/50 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-purple-950/60 border border-purple-800/80 flex items-center justify-center text-purple-400 mb-4">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Security Auditing</h3>
            <p className="text-sm text-slate-400">
              Identifies SQL injections, hardcoded credentials, insecure crypto, and broken authorization flows.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-indigo-500/50 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-800/80 flex items-center justify-center text-emerald-400 mb-4">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Performance Leaks</h3>
            <p className="text-sm text-slate-400">
              Pinpoints N+1 database queries, unclosed socket handles, memory retention, and O(n²) algorithmic bottlenecks.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-indigo-500/50 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-indigo-950/60 border border-indigo-800/80 flex items-center justify-center text-indigo-400 mb-4">
              <GitPullRequest className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">GitHub PR Diffs</h3>
            <p className="text-sm text-slate-400">
              Paste any GitHub Pull Request URL to fetch, parse, and analyze actual diff changes directly from GitHub.
            </p>
          </div>
        </div>
      </section>

      {/* Review Workflow Preview */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-t border-slate-900 bg-slate-900/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-white">How It Works</h2>
            <p className="text-slate-400 mt-2 text-sm">Four seamless steps from submission to actionable fix</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-center">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <div className="w-8 h-8 rounded-full bg-indigo-600/20 text-indigo-400 font-bold mx-auto mb-3 flex items-center justify-center text-sm">
                1
              </div>
              <h4 className="font-semibold text-slate-200 text-sm">Submit Code or PR</h4>
              <p className="text-xs text-slate-400 mt-1">Paste your snippet into Monaco Editor or enter a GitHub PR URL.</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <div className="w-8 h-8 rounded-full bg-indigo-600/20 text-indigo-400 font-bold mx-auto mb-3 flex items-center justify-center text-sm">
                2
              </div>
              <h4 className="font-semibold text-slate-200 text-sm">Deep AI Analysis</h4>
              <p className="text-xs text-slate-400 mt-1">Evaluated across bugs, security, performance, and structure.</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <div className="w-8 h-8 rounded-full bg-indigo-600/20 text-indigo-400 font-bold mx-auto mb-3 flex items-center justify-center text-sm">
                3
              </div>
              <h4 className="font-semibold text-slate-200 text-sm">Grounded Findings</h4>
              <p className="text-xs text-slate-400 mt-1">Every issue is mapped to file and exact line numbers with severity.</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <div className="w-8 h-8 rounded-full bg-indigo-600/20 text-indigo-400 font-bold mx-auto mb-3 flex items-center justify-center text-sm">
                4
              </div>
              <h4 className="font-semibold text-slate-200 text-sm">One-Click Fix</h4>
              <p className="text-xs text-slate-400 mt-1">Copy ready-to-merge remediation patches directly into your IDE.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-8 border-t border-slate-900 text-center text-xs text-slate-500">
        <p>© 2026 AI Code Reviewer. Production-minded portfolio project built with FastAPI, React, PostgreSQL, and LLM integration.</p>
      </footer>
    </div>
  );
};
