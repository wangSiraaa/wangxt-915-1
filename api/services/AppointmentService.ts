import { AppointmentDAO } from '../dao/AppointmentDAO.js';
import { AuditDAO } from '../dao/AuditDAO.js';
import { BlacklistDAO } from '../dao/BlacklistDAO.js';
import { VisitRecordDAO } from '../dao/VisitRecordDAO.js';
import { ExtensionDAO } from '../dao/ExtensionDAO.js';
import type {
  Appointment,
  CreateAppointmentRequest,
  UpdateVisitorInfoRequest,
  VerifyResult,
  UserRole,
} from '../../shared/types.js';

export const AppointmentService = {
  createAppointment(req: CreateAppointmentRequest): Appointment {
    return AppointmentDAO.create(req);
  },

  getAppointment(id: string): Appointment | null {
    return AppointmentDAO.getById(id);
  },

  listAppointments(options?: { status?: string; employeePhone?: string }): Appointment[] {
    return AppointmentDAO.list(options as any);
  },

  updateVisitorInfo(id: string, req: UpdateVisitorInfoRequest): Appointment | null {
    const appointment = AppointmentDAO.getById(id);
    if (!appointment) return null;

    const oldPlate = appointment.plateNumber;
    const newPlate = req.plateNumber.trim().toUpperCase();

    if (oldPlate && oldPlate !== newPlate) {
      AuditDAO.recordPlateChange(id, oldPlate, newPlate, 'visitor');
    } else if (!oldPlate) {
      AuditDAO.recordPlateChange(id, undefined, newPlate, 'visitor');
    }

    const isBlacklisted = BlacklistDAO.isBlacklisted(newPlate);
    if (isBlacklisted) {
      throw new Error('该车牌号已被列入黑名单，无法使用');
    }

    return AppointmentDAO.updateVisitorInfo(id, newPlate, req.companionCount);
  },

  cancelAppointment(id: string): Appointment | null {
    return AppointmentDAO.cancel(id);
  },

  verifyEntry(plateNumber: string, gate?: string): VerifyResult {
    const plate = plateNumber.trim().toUpperCase();

    if (BlacklistDAO.isBlacklisted(plate)) {
      const blackItem = BlacklistDAO.findByPlateNumber(plate);
      AuditDAO.recordReject(plate, 'blacklist', `黑名单车辆：${blackItem?.reason || '无原因'}`, undefined);
      return {
        success: false,
        rejectType: 'blacklist',
        rejectReason: `该车辆已被列入黑名单：${blackItem?.reason || '无具体原因'}`,
      };
    }

    const detainedAppt = AppointmentDAO.findEnteredByPlate(plate);
    if (detainedAppt?.isDetained) {
      AuditDAO.recordReject(plate, 'detained', '车辆处于滞留状态，禁止再次入园', detainedAppt.id);
      return {
        success: false,
        rejectType: 'detained',
        rejectReason: '该车辆处于滞留状态，需先处理滞留问题',
      };
    }

    const appointments = AppointmentDAO.findByPlateNumber(plate);
    if (appointments.length === 0) {
      AuditDAO.recordReject(plate, 'not_found', '未找到该车牌的有效预约', undefined);
      return {
        success: false,
        rejectType: 'not_found',
        rejectReason: '未找到该车牌的预约记录',
      };
    }

    const now = new Date();
    let validAppointment: Appointment | null = null;

    for (const apt of appointments) {
      if (apt.status === 'cancelled' || apt.status === 'expired') continue;
      if (apt.status === 'exited') continue;

      const startTime = new Date(apt.startTime);
      const endTime = new Date(apt.endTime);

      if (now > endTime && apt.status !== 'entered') {
        continue;
      }

      if (apt.status === 'entered' || apt.status === 'pending_entry' || apt.status === 'detained' || apt.status === 'extension_pending' || apt.status === 'extension_approved' || apt.status === 'extension_rejected') {
        validAppointment = apt;
        break;
      }
    }

    if (!validAppointment) {
      const expiredApt = appointments.find(a => {
        const endTime = new Date(a.endTime);
        return now > endTime && a.status !== 'exited';
      });
      if (expiredApt) {
        AuditDAO.recordReject(plate, 'expired', '预约已过期', expiredApt.id);
        return {
          success: false,
          rejectType: 'expired',
          rejectReason: '预约已过期，请重新预约',
        };
      }

      AuditDAO.recordReject(plate, 'not_found', '未找到有效预约', undefined);
      return {
        success: false,
        rejectType: 'not_found',
        rejectReason: '未找到该车牌的有效预约',
      };
    }

    const startTime = new Date(validAppointment.startTime);
    const endTime = new Date(validAppointment.endTime);

    if (validAppointment.status === 'entered' || validAppointment.status === 'detained' || validAppointment.status === 'extension_approved' || validAppointment.status === 'extension_pending' || validAppointment.status === 'extension_rejected') {
      AuditDAO.recordReject(plate, 'duplicate_entry', '车辆已在园区内，请勿重复入园', validAppointment.id);
      return {
        success: false,
        rejectType: 'duplicate_entry',
        rejectReason: '该车辆已在园区内，不能重复入园',
      };
    }

    if (now < startTime) {
      const minutesLeft = Math.ceil((startTime.getTime() - now.getTime()) / (1000 * 60));
      AuditDAO.recordReject(plate, 'not_started', `未到预约开始时间，还有 ${minutesLeft} 分钟`, validAppointment.id);
      return {
        success: false,
        rejectType: 'not_started',
        rejectReason: `未到预约开始时间，请在 ${startTime.toLocaleString()} 之后入园`,
      };
    }

    if (now > endTime && validAppointment.status === 'pending_entry') {
      AuditDAO.recordReject(plate, 'expired', '预约已过期', validAppointment.id);
      return {
        success: false,
        rejectType: 'expired',
        rejectReason: '预约已过期，请重新预约',
      };
    }

    return {
      success: true,
      appointment: validAppointment,
    };
  },

  confirmEntry(plateNumber: string, gate?: string): Appointment | null {
    const result = AppointmentService.verifyEntry(plateNumber, gate);
    if (!result.success || !result.appointment) {
      return null;
    }

    const now = new Date().toISOString();
    const updated = gate
      ? AppointmentDAO.setEntryTimeWithGate(result.appointment.id, now, gate)
      : AppointmentDAO.setEntryTime(result.appointment.id, now);

    if (updated) {
      VisitRecordDAO.createEntry(
        updated.id,
        updated.plateNumber!,
        updated.visitorName,
        updated.entryTime!,
        gate
      );

      ExtensionDAO.addTimelineEvent(
        updated.id,
        'entered_park',
        gate || '门岗',
        'guard',
        gate ? `从 ${gate} 入园` : '车辆入园'
      );
    }

    return updated;
  },

  verifyExit(plateNumber: string, gate?: string): VerifyResult {
    const plate = plateNumber.trim().toUpperCase();
    const appointments = AppointmentDAO.findByPlateNumber(plate);

    if (appointments.length === 0) {
      AuditDAO.recordReject(plate, 'not_found', '未找到该车牌的预约记录', undefined);
      return {
        success: false,
        rejectType: 'not_found',
        rejectReason: '未找到该车牌的预约记录',
      };
    }

    const enteredAppointment = appointments.find(a => 
      a.status === 'entered' || 
      a.status === 'detained' || 
      a.status === 'extension_approved' || 
      a.status === 'extension_rejected'
    );

    if (!enteredAppointment) {
      const exitedApt = appointments.find(a => a.status === 'exited');
      if (exitedApt) {
        AuditDAO.recordReject(plate, 'already_exited', '该车辆已离园，无需重复登记', exitedApt.id);
        return {
          success: false,
          rejectType: 'already_exited',
          rejectReason: '该车辆已离园，无需重复登记',
        };
      }

      AuditDAO.recordReject(plate, 'not_entered', '该车辆尚未入园，无法办理离园', undefined);
      return {
        success: false,
        rejectType: 'not_entered',
        rejectReason: '该车辆尚未入园，无法办理离园',
      };
    }

    return {
      success: true,
      appointment: enteredAppointment,
    };
  },

  confirmExit(plateNumber: string, gate?: string): Appointment | null {
    const result = AppointmentService.verifyExit(plateNumber, gate);
    if (!result.success || !result.appointment) {
      return null;
    }

    const now = new Date().toISOString();
    const appointmentId = result.appointment.id;
    const updated = gate
      ? AppointmentDAO.setExitTimeWithGate(appointmentId, now, gate)
      : AppointmentDAO.setExitTime(appointmentId, now);

    if (updated) {
      const activeRecord = VisitRecordDAO.findActiveByAppointmentId(appointmentId);
      if (activeRecord) {
        VisitRecordDAO.setExitTime(activeRecord.id, now, gate);
      }

      ExtensionDAO.addTimelineEvent(
        updated.id,
        'exited_park',
        gate || '门岗',
        'guard',
        gate ? `从 ${gate} 离园` : '车辆离园'
      );
    }

    return updated;
  },

  detectAndMarkDetained(): Appointment[] {
    const expiredAppointments = AppointmentDAO.listExpiredNotExited();
    const detained: Appointment[] = [];

    for (const apt of expiredAppointments) {
      if (apt.status === 'extension_pending') {
        continue;
      }

      const updated = AppointmentDAO.setDetained(apt.id);
      if (updated) {
        detained.push(updated);

        ExtensionDAO.addTimelineEvent(
          apt.id,
          'detained',
          'system',
          'guard',
          '车辆超过预约结束时间未离园，自动标记为滞留'
        );

        AuditDAO.recordReject(
          apt.plateNumber!,
          'detained',
          '车辆超过预约结束时间未离园，已标记为滞留',
          apt.id
        );
      }
    }

    return detained;
  },

  listDetainedAppointments(): Appointment[] {
    return AppointmentDAO.listDetained();
  },

  getAppointmentWithDetails(id: string): { appointment: Appointment | null; timeline: any[]; extensions: any[] } {
    const appointment = AppointmentDAO.getById(id);
    const timeline = appointment ? ExtensionDAO.getTimelineByAppointmentId(id) : [];
    const extensions = appointment ? ExtensionDAO.getByAppointmentId(id) : [];

    return { appointment, timeline, extensions };
  },
};
