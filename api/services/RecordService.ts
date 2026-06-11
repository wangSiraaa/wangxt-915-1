import { VisitRecordDAO } from '../dao/VisitRecordDAO.js';
import { AuditDAO } from '../dao/AuditDAO.js';
import type { VisitRecord, PlateChangeAudit, RejectRecord } from '../../shared/types.js';

export const RecordService = {
  listRecords(options?: { date?: string; status?: 'entered' | 'exited' }): VisitRecord[] {
    return VisitRecordDAO.list(options);
  },

  listTodayRecords(): VisitRecord[] {
    return VisitRecordDAO.listToday();
  },

  getTodayStats() {
    const todayRecords = VisitRecordDAO.listToday();
    const entered = todayRecords.filter(r => r.status === 'entered').length;
    const exited = todayRecords.filter(r => r.status === 'exited').length;
    return {
      total: todayRecords.length,
      entered,
      exited,
      inPark: entered - exited,
    };
  },

  getPlateChangeAudits(appointmentId?: string): PlateChangeAudit[] {
    if (appointmentId) {
      return AuditDAO.getPlateChangesByAppointment(appointmentId);
    }
    return AuditDAO.listPlateChanges();
  },

  getRejectRecords(options?: { plateNumber?: string; type?: string }): RejectRecord[] {
    return AuditDAO.listRejects(options as any);
  },
};
