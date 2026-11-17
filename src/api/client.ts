import type {
  ActivityLog,
  BorrowingRecord,
  ChatMessage,
  DisputeReport,
  ExchangeRequest,
  ItemCondition,
  ItemListing,
  PlatformStats,
  PublicUser,
  ReportIssueType,
  ReportStatus,
  RequestStatus,
} from '../types';

const TOKEN_KEY = 'reva_swap_token';

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // ignore storage failures
  }
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || 'Request failed') as Error & {
      status?: number;
      data?: Record<string, unknown>;
    };
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data as T;
}

export async function uploadImageFile(file: File): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsDataURL(file);
  });

  const res = await request<{ url: string }>('/api/uploads', {
    method: 'POST',
    body: JSON.stringify({ dataUrl, filename: file.name }),
  });
  return res.url;
}

export const api = {
  getStats: () => request<PlatformStats>('/api/stats'),

  // Auth
  register: (payload: {
    fullName: string;
    email: string;
    studentId: string;
    department: string;
    yearOfStudy: string;
    password: string;
    confirmPassword: string;
  }) =>
    request<{
      message: string;
      email: string;
      demoVerificationCode: string;
    }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  verifyEmail: (email: string, code: string) =>
    request<{ user: PublicUser; token: string }>('/api/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    }),

  resendVerification: (email: string) =>
    request<{ message: string; demoVerificationCode: string }>(
      '/api/auth/resend-verification',
      {
        method: 'POST',
        body: JSON.stringify({ email }),
      }
    ),

  login: (email: string, password: string) =>
    request<{ user: PublicUser; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  logout: () => request<{ ok: boolean }>('/api/auth/logout', { method: 'POST' }),

  forgotPassword: (email: string) =>
    request<{ message: string; demoResetCode: string }>(
      '/api/auth/forgot-password',
      {
        method: 'POST',
        body: JSON.stringify({ email }),
      }
    ),

  resetPassword: (email: string, code: string, newPassword: string) =>
    request<{ message: string }>('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, code, newPassword }),
    }),

  me: () => request<{ user: PublicUser }>('/api/auth/me'),

  updateProfile: (payload: Partial<PublicUser>) =>
    request<{ user: PublicUser }>('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  // Items
  getItems: (params?: Record<string, string>) => {
    const qs = params ? new URLSearchParams(params).toString() : '';
    return request<{ items: ItemListing[] }>(`/api/items${qs ? `?${qs}` : ''}`);
  },

  getItem: (id: string) => request<{ item: ItemListing }>(`/api/items/${id}`),

  createItem: (payload: Partial<ItemListing>) =>
    request<{ item: ItemListing }>('/api/items', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateItem: (id: string, payload: Partial<ItemListing>) =>
    request<{ item: ItemListing }>(`/api/items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  deleteItem: (id: string) =>
    request<{ ok: boolean }>(`/api/items/${id}`, { method: 'DELETE' }),

  // Requests
  getRequests: () => request<{ requests: ExchangeRequest[] }>('/api/requests'),

  createRequest: (payload: {
    itemId: string;
    proposedDuration?: string;
    swapOffer?: string;
    message: string;
  }) =>
    request<{ request: ExchangeRequest }>('/api/requests', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateRequestStatus: (id: string, status: RequestStatus) =>
    request<{ request: ExchangeRequest }>(`/api/requests/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  // Borrowings
  getBorrowings: () =>
    request<{ borrowings: BorrowingRecord[] }>('/api/borrowings'),

  addConditionLog: (
    borrowingId: string,
    payload: {
      stage: 'Before Handover' | 'After Return';
      condition: ItemCondition;
      notes: string;
      photos: string[];
    }
  ) =>
    request<{ borrowing: BorrowingRecord }>(
      `/api/borrowings/${borrowingId}/condition`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    ),

  confirmReturn: (borrowingId: string) =>
    request<{ borrowing: BorrowingRecord }>(
      `/api/borrowings/${borrowingId}/confirm-return`,
      { method: 'POST' }
    ),

  // Messages
  getMessages: () => request<{ messages: ChatMessage[] }>('/api/messages'),

  sendMessage: (payload: {
    recipientId: string;
    itemId?: string | null;
    body: string;
  }) =>
    request<{ message: ChatMessage }>('/api/messages', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  markThreadRead: (threadId: string) =>
    request<{ ok: boolean }>('/api/messages/read', {
      method: 'POST',
      body: JSON.stringify({ threadId }),
    }),

  // Reports
  getReports: () => request<{ reports: DisputeReport[] }>('/api/reports'),

  createReport: (payload: {
    itemId: string;
    againstUserId?: string;
    borrowingId?: string | null;
    issueType: ReportIssueType;
    description: string;
    evidencePhotos: string[];
  }) =>
    request<{ report: DisputeReport }>('/api/reports', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // User summary
  getUserSummary: (userId: string) =>
    request<{
      user: PublicUser;
      listedItems: ItemListing[];
      exchangeHistory: ExchangeRequest[];
      completedCount: number;
    }>(`/api/users/${userId}/summary`),

  // Admin
  getAdminOverview: () =>
    request<{
      metrics: {
        totalStudents: number;
        activeListings: number;
        totalExchanges: number;
        pendingReports: number;
      };
      students: PublicUser[];
      listings: ItemListing[];
      reports: DisputeReport[];
      requests: ExchangeRequest[];
      activityLogs: ActivityLog[];
    }>('/api/admin/overview'),

  adminUpdateUser: (
    userId: string,
    payload: { accountStatus?: 'Active' | 'Suspended'; verified?: boolean }
  ) =>
    request<{ user: PublicUser }>(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  adminDeleteListing: (listingId: string) =>
    request<{ ok: boolean }>(`/api/admin/listings/${listingId}`, {
      method: 'DELETE',
    }),

  adminUpdateReport: (
    reportId: string,
    payload: { status: ReportStatus; adminDecision: string }
  ) =>
    request<{ report: DisputeReport }>(`/api/admin/reports/${reportId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
};
