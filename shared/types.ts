export type AppointmentStatus =
  | 'pending_info'
  | 'pending_entry'
  | 'entered'
  | 'exited'
  | 'cancelled'
  | 'expired'
  | 'detained'
  | 'extension_pending'
  | 'extension_approved'
  | 'extension_rejected';

export type RejectType = 'blacklist' | 'expired' | 'not_started' | 'duplicate_entry' | 'not_found' | 'already_exited' | 'not_entered' | 'detained';

export type ExtensionStatus = 'pending' | 'approved' | 'rejected';

export type UserRole = 'employee' | 'visitor' | 'guard' | 'security_supervisor';

export type TimelineAction =
  | 'appointment_created'
  | 'visitor_info_updated'
  | 'entered_park'
  | 'exited_park'
  | 'detained'
  | 'extension_requested'
  | 'extension_approved'
  | 'extension_rejected'
  | 'appointment_cancelled'
  | 'appointment_expired';

export interface ExtensionRequest {
  id: string;
  appointmentId: string;
  reason: string;
  newEndTime: string;
  departmentConfirm: string;
  requestedBy: string;
  requestedAt: string;
  status: ExtensionStatus;
  approver?: string;
  approvedAt?: string;
  rejectReason?: string;
  rejectedAt?: string;
}

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
  originalEndTime?: string;
  status: AppointmentStatus;
  isDetained: boolean;
  detainedAt?: string;
  entryTime?: string;
  exitTime?: string;
  entryGate?: string;
  exitGate?: string;
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
  entryGate?: string;
  exitGate?: string;
  status: 'entered' | 'exited';
}

export interface TimelineEvent {
  id: string;
  appointmentId: string;
  action: TimelineAction;
  operator: string;
  operatorRole: UserRole;
  remark?: string;
  createdAt: string;
}

export interface CreateExtensionRequest {
  appointmentId: string;
  reason: string;
  newEndTime: string;
  departmentConfirm: string;
  requestedBy: string;
}

export interface ApproveExtensionRequest {
  extensionId: string;
  approver: string;
  approve: boolean;
  rejectReason?: string;
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
  detained: '已滞留',
  extension_pending: '延期审批中',
  extension_approved: '延期已批准',
  extension_rejected: '延期已拒绝',
};

export const STATUS_COLORS: Record<AppointmentStatus, string> = {
  pending_info: 'bg-yellow-100 text-yellow-800',
  pending_entry: 'bg-blue-100 text-blue-800',
  entered: 'bg-green-100 text-green-800',
  exited: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
  expired: 'bg-gray-100 text-gray-500',
  detained: 'bg-red-100 text-red-800',
  extension_pending: 'bg-amber-100 text-amber-800',
  extension_approved: 'bg-emerald-100 text-emerald-800',
  extension_rejected: 'bg-rose-100 text-rose-800',
};

export const EXTENSION_STATUS_LABELS: Record<ExtensionStatus, string> = {
  pending: '待审批',
  approved: '已批准',
  rejected: '已拒绝',
};

export const EXTENSION_STATUS_COLORS: Record<ExtensionStatus, string> = {
  pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-rose-100 text-rose-800',
};

export const TIMELINE_ACTION_LABELS: Record<TimelineAction, string> = {
  appointment_created: '创建预约',
  visitor_info_updated: '补充访客信息',
  entered_park: '车辆入园',
  exited_park: '车辆离园',
  detained: '标记滞留',
  extension_requested: '提交延期申请',
  extension_approved: '延期申请已批准',
  extension_rejected: '延期申请已拒绝',
  appointment_cancelled: '取消预约',
  appointment_expired: '预约过期',
};
