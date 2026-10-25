import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { CategoryBadge, SeverityBadge, StatusBadge } from '../components/common/Badge';
import type { FindingCategory, FindingSeverity } from '../types';
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Code2,
  Copy,
  ExternalLink,
  FileCode,
  GitPullRequest,
  Loader2,
  PlusCircle,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

export const ReviewDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [severityFilter, setSeverityFilter] = useState<FindingSeverity | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<FindingCategory | 'all'>('all');
  const [copiedFixId, setCopiedFixId] = useState<string | null>(null);

  const { data: review, isLoading, error } = useQuery({
    queryKey: ['review', id],
    queryFn: () => api.getReview(id!),
    enabled: !!id,
    refetchInterval: (query) => {
      // Poll every 3 seconds if review is still processing
      const current = query.state.data;
      if (current && (current.status === 'processing' || current.status === 'pending')) {
        return 3000;
      }
      return false;
    },
  });

  const handleCopyFix = (fixCode: string, findingId: string) => {
    navigator.clipboard.writeText(fixCode);
    setCopiedFixId(findingId);
    setTimeout(() => {
      setCopiedFixId(null);
    }, 2000);
  };

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          <p className="text-sm">Loading review findings...</p>
        </div>
      </div>
    );
  }

  if (error || !review) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center">
        <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-white">Review Not Found</h2>
        <p className="text-sm text-slate-400 mt-1">
          {error instanceof Error ? error.message : 'The requested review could not be retrieved.'}
        </p>
        <Link
          to="/history"
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to History
        </Link>
      </div>
    );
  }

  // Filter findings based on selected filters
  const filteredFindings = review.findings.filter((f) => {
    const matchesSev = severityFilter === 'all' || f.severity === severityFilter;
    const matchesCat = categoryFilter === 'all' || f.category === categoryFilter;
    return matchesSev && matchesCat;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6 text-slate-100">
      {/* Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <Link
            to="/history"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Review History
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-3 flex-wrap">
            <span>{review.title || 'Code Review Report'}</span>
            <StatusBadge status={review.status} />
          </h1>
          <div className="flex items-center gap-4 mt-2 text-xs text-slate-400 flex-wrap">
            {review.source_type === 'github_pr' ? (
              <span className="flex items-center gap-1 text-indigo-400 font-medium">
                <GitPullRequest className="w-3.5 h-3.5" />
                {review.repository_owner}/{review.repository_name} #{review.pull_request_number}
                {review.pull_request_url && (
                  <a
                    href={review.pull_request_url}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-indigo-300 ml-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </span>
            ) : (
              <span className="flex items-center gap-1 text-slate-300">
                <Code2 className="w-3.5 h-3.5 text-indigo-400" />
                {review.language || 'Snippet'}
              </span>
            )}
            <span>•</span>
            <span>Model: {review.model_provider} / {review.model_name}</span>
            <span>•</span>
            <span>Created: {new Date(review.created_at).toLocaleString()}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/reviews/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            New Review
          </Link>
        </div>
      </div>

      {/* Review Failed State */}
      {review.status === 'failed' && (
        <div className="p-5 rounded-2xl bg-red-950/60 border border-red-800 text-red-200 space-y-2">
          <div className="flex items-center gap-2 font-bold text-red-300">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <span>Analysis Failed</span>
          </div>
          <p className="text-sm text-red-300/90">{review.error_message || 'The review could not be completed.'}</p>
        </div>
      )}

      {/* Executive Summary Card */}
      {review.review_summary && (
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                Executive Review Summary
              </h2>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Total Findings:</span>
              <span className="font-bold text-white px-2 py-0.5 rounded-full bg-slate-800">
                {review.total_findings}
              </span>
            </div>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
            {review.review_summary}
          </p>
        </div>
      )}

      {/* Filters Bar */}
      <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        {/* Severity Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-400 font-semibold mr-1">Severity:</span>
          <button
            onClick={() => setSeverityFilter('all')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              severityFilter === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            All ({review.total_findings})
          </button>
          {review.critical_count > 0 && (
            <button
              onClick={() => setSeverityFilter('critical')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                severityFilter === 'critical'
                  ? 'bg-red-600 text-white'
                  : 'bg-slate-950 text-red-400 hover:text-red-300 border border-red-900/50'
              }`}
            >
              Critical ({review.critical_count})
            </button>
          )}
          {review.high_count > 0 && (
            <button
              onClick={() => setSeverityFilter('high')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                severityFilter === 'high'
                  ? 'bg-orange-600 text-white'
                  : 'bg-slate-950 text-orange-400 hover:text-orange-300 border border-orange-900/50'
              }`}
            >
              High ({review.high_count})
            </button>
          )}
          {review.medium_count > 0 && (
            <button
              onClick={() => setSeverityFilter('medium')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                severityFilter === 'medium'
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-950 text-amber-400 hover:text-amber-300 border border-amber-900/50'
              }`}
            >
              Medium ({review.medium_count})
            </button>
          )}
          {review.low_count > 0 && (
            <button
              onClick={() => setSeverityFilter('low')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                severityFilter === 'low'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-950 text-blue-400 hover:text-blue-300 border border-blue-900/50'
              }`}
            >
              Low ({review.low_count})
            </button>
          )}
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2">
          <label htmlFor="cat-filter" className="text-xs text-slate-400 font-semibold">Category:</label>
          <select
            id="cat-filter"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as any)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Categories</option>
            <option value="bug">Bugs</option>
            <option value="security">Security</option>
            <option value="performance">Performance</option>
            <option value="maintainability">Maintainability</option>
          </select>
        </div>
      </div>

      {/* Findings List */}
      <div className="space-y-4">
        {filteredFindings.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800">
            <ShieldCheck className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white">
              {review.total_findings === 0 ? 'No Defects Detected' : 'No findings match the active filters'}
            </h3>
            <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
              {review.total_findings === 0
                ? 'Your code passed all automated checks without critical bugs, security vulnerabilities, or performance issues.'
                : 'Try adjusting or clearing your filters to see other review findings.'}
            </p>
          </div>
        ) : (
          filteredFindings.map((finding) => (
            <div
              key={finding.id}
              className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4 hover:border-slate-700 transition-colors"
            >
              {/* Finding Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2 flex-wrap">
                  <SeverityBadge severity={finding.severity} />
                  <CategoryBadge category={finding.category} />
                  <span className="font-bold text-base text-white">{finding.title}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  {finding.file_path && (
                    <span className="flex items-center gap-1 text-slate-300 font-mono">
                      <FileCode className="w-3.5 h-3.5 text-indigo-400" />
                      {finding.file_path}
                    </span>
                  )}
                  {finding.start_line !== null && (
                    <span className="px-2 py-0.5 rounded bg-slate-800 font-mono text-indigo-300">
                      Line {finding.start_line}
                      {finding.end_line && finding.end_line !== finding.start_line ? ` - ${finding.end_line}` : ''}
                    </span>
                  )}
                  <span>Confidence: {(finding.confidence * 100).toFixed(0)}%</span>
                </div>
              </div>

              {/* Description & Impact */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Issue & Impact
                </h4>
                <p className="text-sm text-slate-300 leading-relaxed">{finding.description}</p>
              </div>

              {/* Code Snippet if present */}
              {finding.code_snippet && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Problematic Code
                  </h4>
                  <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-rose-300 overflow-x-auto">
                    <code>{finding.code_snippet}</code>
                  </pre>
                </div>
              )}

              {/* Recommendation */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Recommendation
                </h4>
                <p className="text-sm text-slate-300 leading-relaxed">{finding.recommendation}</p>
              </div>

              {/* Suggested Fix */}
              {finding.suggested_fix && (
                <div className="rounded-xl overflow-hidden border border-emerald-800/60 bg-emerald-950/20">
                  <div className="px-4 py-2 bg-emerald-950/40 border-b border-emerald-800/40 flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Suggested Fix
                    </span>
                    <button
                      onClick={() => handleCopyFix(finding.suggested_fix!, finding.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-900/60 hover:bg-emerald-800/80 text-emerald-200 transition-colors cursor-pointer"
                    >
                      {copiedFixId === finding.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-300" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Fix</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-4 font-mono text-xs text-emerald-200 overflow-x-auto bg-slate-950/90">
                    <code>{finding.suggested_fix}</code>
                  </pre>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
