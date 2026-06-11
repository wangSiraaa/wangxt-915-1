import { AppointmentDAO } from '../dao/AppointmentDAO.js';
import { AuditDAO } from '../dao/AuditDAO.js';
import { BlacklistDAO } from '../dao/BlacklistDAO.js';
import type {
  Appointment,
  CreateAppointmentRequest,
  UpdateVisitorInfoRequest,
  VerifyResult,
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

  verifyEntry(plateNumber: string): VerifyResult {
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

      if (apt.status === 'entered' || apt.status === 'pending_entry') {
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

    if (validAppointment.status === 'entered') {
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

    if (now > endTime) {
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

  confirmEntry(plateNumber: string): Appointment | null {
    const result = AppointmentService.verifyEntry(plateNumber);
    if (!result.success || !result.appointment) {
      return null;
    }

    const now = new Date().toISOString();
    return AppointmentDAO.setEntryTime(result.appointment.id, now);
  },

  verifyExit(plateNumber: string): VerifyResult {
    const plate = plateNumber.trim().toUpperCase();
    const appointments = AppointmentDAO.findByPlateNumber(plate);

    const enteredAppointment = appointments.find(a => a.status === 'entered');

    if (!enteredAppointment) {
      return {
        success: false,
        rejectType: 'not_found',
        rejectReason: '未找到该车辆的入园记录',
      };
    }

    return {
      success: true,
      appointment: enteredAppointment,
    };
  },

  confirmExit(plateNumber: string): Appointment | null {
    const result = AppointmentService.verifyExit(plateNumber);
    if (!result.success || !result.appointment) {
      return null;
    }

    const now = new Date().toISOString();
    return AppointmentDAO.setExitTime(result.appointment.id, now);
  },
};
