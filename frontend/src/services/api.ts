import type {
  AuthResponse,
  CreateGitHubReviewPayload,
  CreatePastedReviewPayload,
  DashboardSummary,
  Review,
  ReviewListResponse,
  User,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

class ApiClient {
  private getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 204) {
      return {} as T;
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMessage =
        data?.detail?.message ||
        data?.detail ||
        (Array.isArray(data?.detail) ? data.detail.map((d: any) => d.msg).join(', ') : null) ||
        `Request failed with status ${response.status}`;
      throw new Error(errorMessage);
    }

    return data as T;
  }

  // Auth Endpoints
  async register(name: string, email: string, password: string): Promise<User> {
    return this.request<User>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    return this.request<AuthResponse>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async getMe(): Promise<User> {
    return this.request<User>('/api/v1/auth/me');
  }

  // Review Endpoints
  async createPastedReview(payload: CreatePastedReviewPayload): Promise<Review> {
    return this.request<Review>('/api/v1/reviews', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async createGitHubReview(payload: CreateGitHubReviewPayload): Promise<Review> {
    return this.request<Review>('/api/v1/reviews/github', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async listReviews(params?: {
    page?: number;
    pageSize?: number;
    sourceType?: string;
    status?: string;
  }): Promise<ReviewListResponse> {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', params.page.toString());
    if (params?.pageSize) query.set('page_size', params.pageSize.toString());
    if (params?.sourceType) query.set('source_type', params.sourceType);
    if (params?.status) query.set('status', params.status);

    const queryStr = query.toString() ? `?${query.toString()}` : '';
    return this.request<ReviewListResponse>(`/api/v1/reviews${queryStr}`);
  }

  async getReview(id: string): Promise<Review> {
    return this.request<Review>(`/api/v1/reviews/${id}`);
  }

  async deleteReview(id: string): Promise<void> {
    return this.request<void>(`/api/v1/reviews/${id}`, {
      method: 'DELETE',
    });
  }

  // Dashboard Endpoints
  async getDashboardSummary(): Promise<DashboardSummary> {
    return this.request<DashboardSummary>('/api/v1/dashboard/summary');
  }

  // Health Endpoint
  async getHealth(): Promise<{ status: string; database: string; ai_provider: string; version: string }> {
    return this.request('/health');
  }
}

export const api = new ApiClient();
