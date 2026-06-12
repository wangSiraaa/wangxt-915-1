import { ExtensionDAO } from '../dao/ExtensionDAO.js';
import { AppointmentDAO } from '../dao/AppointmentDAO.js';
import { BlacklistDAO } from '../dao/BlacklistDAO.js';
import type {
  ExtensionRequest,
  CreateExtensionRequest,
  Appointment,
  TimelineEvent,
  UserRole,
} from '../../shared/types.js';

const PARK_CLOSING_HOUR = 22;
const PARK_CLOSING_MINUTE = 0;

function getParkClosingTime(date: Date): Date {
  const closing = new Date(date);
  closing.setHours(PARK_CLOSING_HOUR, PARK_CLOSING_MINUTE, 0, 0);
  return closing;
}

export const ExtensionService = {
  createExtensionRequest(
    req: CreateExtensionRequest,
    operator: string,
    operatorRole: UserRole
  ): ExtensionRequest {
    const appointment = AppointmentDAO.getById(req.appointmentId);
    if (!appointment) {
      throw new Error('预约不存在');
    }

    if (appointment.status === 'exited') {
      throw new Error('车辆已离园，不能申请延期');
    }

    if (appointment.status === 'cancelled' || appointment.status === 'expired') {
      throw new Error('预约已取消或过期，不能申请延期');
    }

    if (appointment.plateNumber && BlacklistDAO.isBlacklisted(appointment.plateNumber)) {
      throw new Error('该车辆已被列入黑名单，不能申请延期');
    }

    const pendingExtension = ExtensionDAO.getPendingByAppointmentId(req.appointmentId);
    if (pendingExtension) {
      throw new Error('已有待审批的延期申请，请等待审批结果');
    }

    const newEndTime = new Date(req.newEndTime);
    const closingTime = getParkClosingTime(new Date(appointment.startTime));

    if (newEndTime > closingTime) {
      throw new Error(`延期时间不能超过园区闭园时间（${closingTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}）`);
    }

    if (newEndTime <= new Date(appointment.endTime)) {
      throw new Error('延期结束时间必须晚于当前结束时间');
    }

    const extension = ExtensionDAO.create(req);

    ExtensionDAO.addTimelineEvent(
      req.appointmentId,
      'extension_requested',
      operator,
      operatorRole,
      `延期至 ${newEndTime.toLocaleString('zh-CN')}，原因：${req.reason}`
    );

    AppointmentDAO.updateStatus(req.appointmentId, 'extension_pending');

    return extension;
  },

  approveExtension(
    extensionId: string,
    approver: string,
    approverRole: UserRole
  ): { extension: ExtensionRequest; appointment: Appointment | null } {
    const extension = ExtensionDAO.getById(extensionId);
    if (!extension) {
      throw new Error('延期申请不存在');
    }

    if (extension.status !== 'pending') {
      throw new Error('该延期申请已处理过，不能重复审批');
    }

    const appointment = AppointmentDAO.getById(extension.appointmentId);
    if (!appointment) {
      throw new Error('关联预约不存在');
    }

    if (appointment.status === 'exited') {
      throw new Error('车辆已离园，不能审批通过');
    }

    const approvedExtension = ExtensionDAO.approve(extensionId, approver);
    const updatedAppointment = AppointmentDAO.updateEndTime(
      extension.appointmentId,
      extension.newEndTime,
      'extension_approved'
    );

    ExtensionDAO.addTimelineEvent(
      extension.appointmentId,
      'extension_approved',
      approver,
      approverRole,
      `延期至 ${new Date(extension.newEndTime).toLocaleString('zh-CN')} 已批准`
    );

    return {
      extension: approvedExtension!,
      appointment: updatedAppointment,
    };
  },

  rejectExtension(
    extensionId: string,
    approver: string,
    rejectReason: string,
    approverRole: UserRole
  ): { extension: ExtensionRequest; appointment: Appointment | null } {
    const extension = ExtensionDAO.getById(extensionId);
    if (!extension) {
      throw new Error('延期申请不存在');
    }

    if (extension.status !== 'pending') {
      throw new Error('该延期申请已处理过，不能重复审批');
    }

    const rejectedExtension = ExtensionDAO.reject(extensionId, approver, rejectReason);
    const appointment = AppointmentDAO.getById(extension.appointmentId);

    let newStatus = appointment?.status || 'entered';
    if (appointment?.isDetained) {
      newStatus = 'detained';
    }

    const updatedAppointment = AppointmentDAO.updateStatus(extension.appointmentId, newStatus as any);

    ExtensionDAO.addTimelineEvent(
      extension.appointmentId,
      'extension_rejected',
      approver,
      approverRole,
      `延期申请被拒绝，原因：${rejectReason}`
    );

    return {
      extension: rejectedExtension!,
      appointment: updatedAppointment,
    };
  },

  getExtension(id: string): ExtensionRequest | null {
    return ExtensionDAO.getById(id);
  },

  getExtensionsByAppointment(appointmentId: string): ExtensionRequest[] {
    return ExtensionDAO.getByAppointmentId(appointmentId);
  },

  listExtensions(options?: { status?: string }): ExtensionRequest[] {
    return ExtensionDAO.list(options as any);
  },

  getTimeline(appointmentId: string): TimelineEvent[] {
    return ExtensionDAO.getTimelineByAppointmentId(appointmentId);
  },

  getParkClosingTime(): { hour: number; minute: number } {
    return { hour: PARK_CLOSING_HOUR, minute: PARK_CLOSING_MINUTE };
  },
};
