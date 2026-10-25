import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { SeverityBadge, StatusBadge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import type { ReviewListItem } from '../types';
import {
  AlertTriangle,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Code2,
  FileCode2,
  Filter,
  GitPullRequest,
  Loader2,
  PlusCircle,
  Search,
  Trash2,
} from 'lucide-react';

export const HistoryPage: React.FC = () => {
  const queryClient = useQueryClient();

  const [page, setPage] = useState<number>(1);
  const pageSize = 10;
  const [sourceTypeFilter, setSourceTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [reviewToDelete, setReviewToDelete] = useState<ReviewListItem | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['reviews', page, pageSize, sourceTypeFilter, statusFilter],
    queryFn: () =>
      api.listReviews({
        page,
        pageSize,
        sourceType: sourceTypeFilter || undefined,
        status: statusFilter || undefined,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteReview(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      setReviewToDelete(null);
    },
  });

  const handleDeleteConfirm = () => {
    if (reviewToDelete) {
      deleteMutation.mutate(reviewToDelete.id);
    }
  };

  const filteredItems = (data?.items || []).filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const titleMatch = (item.title || '').toLowerCase().includes(q);
    const langMatch = (item.language || '').toLowerCase().includes(q);
    const repoMatch = (item.repository_name || '').toLowerCase().includes(q);
    return titleMatch || langMatch || repoMatch;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Review History</h1>
          <p className="text-sm text-slate-400 mt-1">
            Browse, inspect, and manage your past code reviews and findings.
          </p>
        </div>
        <Link
          to="/reviews/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-colors self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          New Review
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col md:flex-row items-center gap-4">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search reviews by title, language, or repository..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span>Type:</span>
          </div>
          <select
            value={sourceTypeFilter}
            onChange={(e) => {
              setSourceTypeFilter(e.target.value);
              setPage(1);
            }}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Types</option>
            <option value="pasted_code">Pasted Code</option>
            <option value="github_pr">GitHub PR</option>
          </select>

          <div className="flex items-center gap-1.5 text-xs text-slate-400 ml-2">
            <span>Status:</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="processing">Processing</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Main Reviews Table */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            <p className="text-sm">Loading review records...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-slate-400">
            <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <p className="text-slate-200 font-medium">Failed to retrieve reviews.</p>
            <p className="text-xs mt-1">{error instanceof Error ? error.message : 'Unknown error'}</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-12 h-12 rounded-xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <FileCode2 className="w-6 h-6" />
            </div>
            <h4 className="text-base font-medium text-slate-200">No reviews found</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {data && data.total > 0
                ? 'No reviews match your current search and filter criteria.'
                : 'You have not submitted any reviews yet. Start with a code snippet or GitHub PR.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="text-xs uppercase bg-slate-950/60 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">Review Title</th>
                  <th className="px-5 py-3.5">Source</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Severity Counts</th>
                  <th className="px-5 py-3.5">Created</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredItems.map((rev) => (
                  <tr key={rev.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-4 font-medium text-slate-100 max-w-sm">
                      <Link to={`/reviews/${rev.id}`} className="hover:text-indigo-400 transition-colors truncate block">
                        {rev.title || 'Untitled Review'}
                      </Link>
                    </td>
                    <td className="px-5 py-4">
                      {rev.source_type === 'github_pr' ? (
                        <span className="inline-flex items-center gap-1.5 text-xs text-indigo-400 font-medium">
                          <GitPullRequest className="w-3.5 h-3.5" />
                          PR #{rev.pull_request_number}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                          <Code2 className="w-3.5 h-3.5 text-slate-500" />
                          {rev.language || 'Snippet'}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={rev.status} />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {rev.critical_count > 0 && <SeverityBadge severity="critical" count={rev.critical_count} />}
                        {rev.high_count > 0 && <SeverityBadge severity="high" count={rev.high_count} />}
                        {rev.medium_count > 0 && <SeverityBadge severity="medium" count={rev.medium_count} />}
                        {rev.low_count > 0 && <SeverityBadge severity="low" count={rev.low_count} />}
                        {rev.total_findings === 0 && rev.status === 'completed' && (
                          <span className="text-xs text-emerald-400">Clean</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-400 whitespace-nowrap">
                      {new Date(rev.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/reviews/${rev.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-indigo-300 transition-colors"
                        >
                          View
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                        <button
                          onClick={() => setReviewToDelete(rev)}
                          title="Delete review"
                          className="p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-950/30 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {data && data.total_pages > 1 && (
          <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div>
              Showing page <span className="font-semibold text-slate-200">{data.page}</span> of{' '}
              <span className="font-semibold text-slate-200">{data.total_pages}</span> ({data.total} total)
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="p-1.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-800 disabled:opacity-40 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= data.total_pages}
                onClick={() => setPage(page + 1)}
                className="p-1.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-800 disabled:opacity-40 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!reviewToDelete}
        onClose={() => setReviewToDelete(null)}
        title="Confirm Review Deletion"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-300">
            Are you sure you want to delete{' '}
            <span className="font-semibold text-white">"{reviewToDelete?.title || 'this review'}"</span>?
          </p>
          <p className="text-xs text-slate-400">
            This action cannot be undone. All associated findings and severity statistics will be permanently removed.
          </p>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setReviewToDelete(null)}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={deleteMutation.isPending}
              onClick={handleDeleteConfirm}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white flex items-center gap-2 shadow-sm shadow-red-600/30 transition-colors cursor-pointer"
            >
              {deleteMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {deleteMutation.isPending ? 'Deleting...' : 'Delete Permanently'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
