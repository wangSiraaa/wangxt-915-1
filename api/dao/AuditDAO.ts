import { getDb } from '../db/database.js';
import type { PlateChangeAudit, RejectRecord, RejectType } from '../../shared/types.js';
import { v4 as uuidv4 } from 'uuid';

function rowToPlateChangeAudit(row: any): PlateChangeAudit {
  return {
    id: row.id,
    appointmentId: row.appointment_id,
    oldPlateNumber: row.old_plate_number || undefined,
    newPlateNumber: row.new_plate_number,
    changedBy: row.changed_by as 'visitor' | 'employee',
    changedAt: row.changed_at,
  };
}

function rowToRejectRecord(row: any): RejectRecord {
  return {
    id: row.id,
    plateNumber: row.plate_number,
    rejectType: row.reject_type as RejectType,
    rejectReason: row.reject_reason,
    appointmentId: row.appointment_id || undefined,
    createdAt: row.created_at,
  };
}

export const AuditDAO = {
  recordPlateChange(
    appointmentId: string,
    oldPlateNumber: string | undefined,
    newPlateNumber: string,
    changedBy: 'visitor' | 'employee'
  ): PlateChangeAudit {
    const db = getDb();
    const id = `pca_${uuidv4().slice(0, 8)}`;

    db.prepare(
      `INSERT INTO plate_change_audits (id, appointment_id, old_plate_number, new_plate_number, changed_by)
       VALUES (?, ?, ?, ?, ?)`
    ).run(id, appointmentId, oldPlateNumber || null, newPlateNumber, changedBy);

    return AuditDAO.getPlateChangeById(id)!;
  },

  getPlateChangeById(id: string): PlateChangeAudit | null {
    const db = getDb();
    const row = db.prepare('SELECT * FROM plate_change_audits WHERE id = ?').get(id);
    return row ? rowToPlateChangeAudit(row) : null;
  },

  getPlateChangesByAppointment(appointmentId: string): PlateChangeAudit[] {
    const db = getDb();
    const rows = db.prepare(
      'SELECT * FROM plate_change_audits WHERE appointment_id = ? ORDER BY changed_at DESC'
    ).all(appointmentId);
    return rows.map(rowToPlateChangeAudit);
  },

  listPlateChanges(): PlateChangeAudit[] {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM plate_change_audits ORDER BY changed_at DESC').all();
    return rows.map(rowToPlateChangeAudit);
  },

  recordReject(
    plateNumber: string,
    rejectType: RejectType,
    rejectReason: string,
    appointmentId?: string
  ): RejectRecord {
    const db = getDb();
    const id = `rej_${uuidv4().slice(0, 8)}`;

    db.prepare(
      `INSERT INTO reject_records (id, plate_number, reject_type, reject_reason, appointment_id)
       VALUES (?, ?, ?, ?, ?)`
    ).run(id, plateNumber, rejectType, rejectReason, appointmentId || null);

    return AuditDAO.getRejectById(id)!;
  },

  getRejectById(id: string): RejectRecord | null {
    const db = getDb();
    const row = db.prepare('SELECT * FROM reject_records WHERE id = ?').get(id);
    return row ? rowToRejectRecord(row) : null;
  },

  listRejects(options?: { plateNumber?: string; type?: RejectType }): RejectRecord[] {
    const db = getDb();
    let sql = 'SELECT * FROM reject_records WHERE 1=1';
    const params: any[] = [];

    if (options?.plateNumber) {
      sql += ' AND plate_number = ?';
      params.push(options.plateNumber);
    }
    if (options?.type) {
      sql += ' AND reject_type = ?';
      params.push(options.type);
    }

    sql += ' ORDER BY created_at DESC';
    const rows = db.prepare(sql).all(params);
    return rows.map(rowToRejectRecord);
  },
};
