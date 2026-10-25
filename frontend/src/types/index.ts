export interface User {
  id: string;
  name: string;
  email: string;
  is_active: boolean;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export type FindingCategory = 'bug' | 'security' | 'performance' | 'maintainability';
export type FindingSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type ReviewSourceType = 'pasted_code' | 'github_pr';
export type ReviewStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface Finding {
  id: string;
  review_id: string;
  category: FindingCategory;
  severity: FindingSeverity;
  title: string;
  description: string;
  file_path: string | null;
  start_line: number | null;
  end_line: number | null;
  code_snippet: string | null;
  recommendation: string;
  suggested_fix: string | null;
  confidence: number;
  created_at: string;
}

export interface Review {
  id: string;
  user_id: string;
  source_type: ReviewSourceType;
  title: string | null;
  language: string | null;
  source_code: string | null;
  repository_owner: string | null;
  repository_name: string | null;
  pull_request_number: number | null;
  pull_request_url: string | null;
  status: ReviewStatus;
  model_provider: string;
  model_name: string;
  review_summary: string | null;
  total_findings: number;
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  info_count: number;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
  findings: Finding[];
}

export interface ReviewListItem {
  id: string;
  user_id: string;
  source_type: ReviewSourceType;
  title: string | null;
  language: string | null;
  repository_owner: string | null;
  repository_name: string | null;
  pull_request_number: number | null;
  pull_request_url: string | null;
  status: ReviewStatus;
  model_provider: string;
  model_name: string;
  review_summary: string | null;
  total_findings: number;
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  info_count: number;
  created_at: string;
  completed_at: string | null;
}

export interface ReviewListResponse {
  items: ReviewListItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface SeverityStats {
  critical: number;
  high: number;
  medium: number;
  low: number;
  info: number;
}

export interface DashboardSummary {
  total_reviews: number;
  completed_reviews: number;
  failed_reviews: number;
  total_findings: number;
  severity_breakdown: SeverityStats;
  category_breakdown: Record<string, number>;
  recent_reviews: ReviewListItem[];
}

export interface CreatePastedReviewPayload {
  code: string;
  language?: string;
  title?: string;
  categories?: FindingCategory[];
  depth?: 'standard' | 'deep';
}

export interface CreateGitHubReviewPayload {
  pull_request_url: string;
  title?: string;
  categories?: FindingCategory[];
  depth?: 'standard' | 'deep';
}
