export type AppointmentStatus =
  | 'pending_info'
  | 'pending_entry'
  | 'entered'
  | 'exited'
  | 'cancelled'
  | 'expired';

export type RejectType = 'blacklist' | 'expired' | 'not_started' | 'duplicate_entry' | 'not_found';

export interface Appointment {
  id: string;
  visitorName: string;
  visitorPhone: string;
  visitorCompany?: string;
  purpose: string;
  department: string;
  employeeName: string;
  employeePhone: string;
  plateNumber?: string;
  companionCount: number;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  entryTime?: string;
  exitTime?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAppointmentRequest {
  visitorName: string;
  visitorPhone: string;
  visitorCompany?: string;
  purpose: string;
  department: string;
  employeeName: string;
  employeePhone: string;
  plateNumber?: string;
  companionCount?: number;
  startTime: string;
  endTime: string;
}

export interface UpdateVisitorInfoRequest {
  plateNumber: string;
  companionCount: number;
}

export interface VerifyResult {
  success: boolean;
  appointment?: Appointment;
  rejectReason?: string;
  rejectType?: RejectType;
}

export interface VisitRecord {
  id: string;
  appointmentId: string;
  plateNumber: string;
  visitorName: string;
  entryTime?: string;
  exitTime?: string;
  status: 'entered' | 'exited';
}

export interface BlacklistItem {
  id: string;
  plateNumber: string;
  reason: string;
  createdAt: string;
}

export interface PlateChangeAudit {
  id: string;
  appointmentId: string;
  oldPlateNumber?: string;
  newPlateNumber: string;
  changedBy: 'visitor' | 'employee';
  changedAt: string;
}

export interface RejectRecord {
  id: string;
  plateNumber: string;
  rejectType: RejectType;
  rejectReason: string;
  appointmentId?: string;
  createdAt: string;
}

export const STATUS_LABELS: Record<AppointmentStatus, string> = {
  pending_info: '待补全信息',
  pending_entry: '待入园',
  entered: '已入园',
  exited: '已离园',
  cancelled: '已取消',
  expired: '已过期',
};

export const STATUS_COLORS: Record<AppointmentStatus, string> = {
  pending_info: 'bg-yellow-100 text-yellow-800',
  pending_entry: 'bg-blue-100 text-blue-800',
  entered: 'bg-green-100 text-green-800',
  exited: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
  expired: 'bg-gray-100 text-gray-500',
};
