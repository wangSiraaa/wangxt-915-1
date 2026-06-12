import type {
  Appointment,
  CreateAppointmentRequest,
  UpdateVisitorInfoRequest,
  VerifyResult,
  VisitRecord,
  BlacklistItem,
  PlateChangeAudit,
  RejectRecord,
  ExtensionRequest,
  TimelineEvent,
  CreateExtensionRequest,
} from '@shared/types';

const API_BASE = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.error || '请求失败');
  }

  return data.data as T;
}

export const appointmentApi = {
  list: (params?: { status?: string; employeePhone?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.employeePhone) searchParams.set('employeePhone', params.employeePhone);
    const query = searchParams.toString();
    return request<Appointment[]>(`/appointments${query ? `?${query}` : ''}`);
  },

  get: (id: string) => request<Appointment>(`/appointments/${id}`),

  create: (data: CreateAppointmentRequest) =>
    request<Appointment>('/appointments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateVisitorInfo: (id: string, data: UpdateVisitorInfoRequest) =>
    request<Appointment>(`/appointments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  cancel: (id: string) =>
    request<Appointment>(`/appointments/${id}/cancel`, {
      method: 'PUT',
    }),
};

export const verifyApi = {
  entry: (plateNumber: string, confirm = false, gate?: string) =>
    request<VerifyResult>('/verify/entry', {
      method: 'POST',
      body: JSON.stringify({ plateNumber, confirm, gate }),
    }),

  exit: (plateNumber: string, confirm = false, gate?: string) =>
    request<VerifyResult>('/verify/exit', {
      method: 'POST',
      body: JSON.stringify({ plateNumber, confirm, gate }),
    }),
};

export const blacklistApi = {
  list: () => request<BlacklistItem[]>('/blacklist'),

  add: (plateNumber: string, reason: string) =>
    request<BlacklistItem>('/blacklist', {
      method: 'POST',
      body: JSON.stringify({ plateNumber, reason }),
    }),

  remove: (id: string) =>
    request<void>(`/blacklist/${id}`, {
      method: 'DELETE',
    }),

  check: (plateNumber: string) =>
    request<{ isBlacklisted: boolean; item: BlacklistItem | null }>(`/blacklist/check/${plateNumber}`),
};

export const recordApi = {
  list: (params?: { date?: string; status?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.date) searchParams.set('date', params.date);
    if (params?.status) searchParams.set('status', params.status);
    const query = searchParams.toString();
    return request<VisitRecord[]>(`/records${query ? `?${query}` : ''}`);
  },

  listToday: () => request<VisitRecord[]>('/records/today'),

  getTodayStats: () =>
    request<{ total: number; entered: number; exited: number; inPark: number }>('/stats/today'),

  getPlateChangeAudits: (appointmentId?: string) => {
    const query = appointmentId ? `?appointmentId=${appointmentId}` : '';
    return request<PlateChangeAudit[]>(`/audit/plate-changes${query}`);
  },

  getRejectRecords: (params?: { plateNumber?: string; type?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.plateNumber) searchParams.set('plateNumber', params.plateNumber);
    if (params?.type) searchParams.set('type', params.type);
    const query = searchParams.toString();
    return request<RejectRecord[]>(`/reject-records${query ? `?${query}` : ''}`);
  },
};

export const extensionApi = {
  list: (params?: { status?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    const query = searchParams.toString();
    return request<ExtensionRequest[]>(`/extensions${query ? `?${query}` : ''}`);
  },

  get: (id: string) => request<ExtensionRequest>(`/extensions/${id}`),

  create: (data: CreateExtensionRequest & { operator?: string; operatorRole?: string }) =>
    request<ExtensionRequest>('/extensions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  approve: (id: string, approver?: string) =>
    request<{ extension: ExtensionRequest; appointment: Appointment }>(`/extensions/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ approver }),
    }),

  reject: (id: string, rejectReason: string, approver?: string) =>
    request<{ extension: ExtensionRequest; appointment: Appointment }>(`/extensions/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ approver, rejectReason }),
    }),

  getByAppointment: (appointmentId: string) =>
    request<ExtensionRequest[]>(`/extensions/appointment/${appointmentId}`),

  getTimeline: (appointmentId: string) =>
    request<TimelineEvent[]>(`/extensions/timeline/${appointmentId}`),

  getParkClosingTime: () =>
    request<{ hour: number; minute: number }>('/extensions/park-closing-time'),

  detectDetained: () =>
    request<{ count: number; appointments: Appointment[] }>('/extensions/detect-detained', {
      method: 'POST',
    }),

  listDetained: () =>
    request<Appointment[]>('/extensions/detained/list'),

  getAppointmentDetails: (id: string) =>
    request<{ appointment: Appointment; timeline: TimelineEvent[]; extensions: ExtensionRequest[] }>(
      `/extensions/appointment/${id}/details`
    ),
};
