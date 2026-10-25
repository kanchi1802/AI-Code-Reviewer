import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { SeverityBadge, StatusBadge } from '../components/common/Badge';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Code2,
  FileCode2,
  Flame,
  GitPullRequest,
  History,
  Loader2,
  PlusCircle,
  ShieldAlert,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export const DashboardPage: React.FC = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboardSummary'],
    queryFn: () => api.getDashboardSummary(),
    refetchInterval: 15000, // auto refresh every 15s
  });

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          <p className="text-sm">Loading dashboard analytics...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center text-slate-400">
        <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-2" />
        <p className="text-slate-200 font-medium">Failed to load dashboard metrics.</p>
        <p className="text-sm mt-1">{error instanceof Error ? error.message : 'Unknown error'}</p>
      </div>
    );
  }

  // Derived chart data exclusively from real backend database records
  const severityChartData = [
    { name: 'Critical', count: data.severity_breakdown.critical, fill: '#ef4444' },
    { name: 'High', count: data.severity_breakdown.high, fill: '#f97316' },
    { name: 'Medium', count: data.severity_breakdown.medium, fill: '#f59e0b' },
    { name: 'Low', count: data.severity_breakdown.low, fill: '#3b82f6' },
    { name: 'Info', count: data.severity_breakdown.info, fill: '#64748b' },
  ];

  const categoryChartData = Object.entries(data.category_breakdown || {}).map(([key, value]) => ({
    name: key.charAt(0).toUpperCase() + key.slice(1),
    value,
  }));

  const CATEGORY_COLORS = ['#f43f5e', '#a855f7', '#10b981', '#06b6d4'];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 bg-slate-950 text-slate-100">
      {/* Header with Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Review Dashboard</h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time analytics and findings derived from your saved code reviews.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/history"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
          >
            <History className="w-4 h-4" />
            View History
          </Link>
          <Link
            to="/reviews/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            New Review
          </Link>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Reviews</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-950/60 text-indigo-400 flex items-center justify-center">
              <Code2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">{data.total_reviews}</span>
            <span className="text-xs text-slate-400">submitted</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Completed</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-950/60 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-emerald-400">{data.completed_reviews}</span>
            <span className="text-xs text-slate-400">successful</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Findings</span>
            <div className="w-8 h-8 rounded-lg bg-amber-950/60 text-amber-400 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-amber-400">{data.total_findings}</span>
            <span className="text-xs text-slate-400">actionable items</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Critical & High</span>
            <div className="w-8 h-8 rounded-lg bg-rose-950/60 text-rose-400 flex items-center justify-center">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-rose-400">
              {data.severity_breakdown.critical + data.severity_breakdown.high}
            </span>
            <span className="text-xs text-slate-400">high risk</span>
          </div>
        </div>
      </div>

      {/* Visual Analytics Grid */}
      {data.total_findings > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Severity Distribution Chart */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
            <h3 className="text-base font-semibold text-slate-200 mb-4">Findings by Severity Level</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={severityChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                    labelStyle={{ color: '#e2e8f0', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {severityChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category Breakdown Chart */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
            <h3 className="text-base font-semibold text-slate-200 mb-4">Findings by Category</h3>
            {categoryChartData.length > 0 ? (
              <div className="h-64 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      innerRadius={45}
                      paddingAngle={4}
                      label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                    >
                      {categoryChartData.map((_, index) => (
                        <Cell key={`pie-cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-sm text-slate-500">
                No category data available yet.
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* Recent Reviews Table */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-white">Recent Reviews</h3>
            <p className="text-xs text-slate-400 mt-0.5">Your latest analysis runs and their outcomes</p>
          </div>
          {data.recent_reviews.length > 0 && (
            <Link
              to="/history"
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1"
            >
              See all
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {data.recent_reviews.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-12 h-12 rounded-xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <FileCode2 className="w-6 h-6" />
            </div>
            <h4 className="text-base font-medium text-slate-200">No reviews found yet</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Submit your first snippet or GitHub PR to view automated AI findings and metrics.
            </p>
            <Link
              to="/reviews/new"
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              Create Review
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="text-xs uppercase bg-slate-950/60 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">Review</th>
                  <th className="px-5 py-3.5">Source</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Severities</th>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {data.recent_reviews.map((rev) => (
                  <tr key={rev.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-4 font-medium text-slate-100 max-w-xs truncate">
                      {rev.title || 'Untitled Review'}
                    </td>
                    <td className="px-5 py-4">
                      {rev.source_type === 'github_pr' ? (
                        <span className="inline-flex items-center gap-1.5 text-xs text-indigo-400">
                          <GitPullRequest className="w-3.5 h-3.5" />
                          PR #{rev.pull_request_number}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
                          <Code2 className="w-3.5 h-3.5" />
                          {rev.language || 'Code Snippet'}
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
                      <Link
                        to={`/reviews/${rev.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-indigo-300 transition-colors"
                      >
                        Open
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
