import { getDb } from '../db/database.js';
import type { VisitRecord } from '../../shared/types.js';
import { v4 as uuidv4 } from 'uuid';

function rowToVisitRecord(row: any): VisitRecord {
  return {
    id: row.id,
    appointmentId: row.appointment_id,
    plateNumber: row.plate_number,
    visitorName: row.visitor_name,
    entryTime: row.entry_time || undefined,
    exitTime: row.exit_time || undefined,
    entryGate: row.entry_gate || undefined,
    exitGate: row.exit_gate || undefined,
    status: row.status as 'entered' | 'exited',
  };
}

export const VisitRecordDAO = {
  createEntry(appointmentId: string, plateNumber: string, visitorName: string, entryTime: string, entryGate?: string): VisitRecord {
    const db = getDb();
    const id = `rec_${uuidv4().slice(0, 8)}`;

    db.prepare(
      `INSERT INTO visit_records (id, appointment_id, plate_number, visitor_name, entry_time, entry_gate, status)
       VALUES (?, ?, ?, ?, ?, ?, 'entered')`
    ).run(id, appointmentId, plateNumber, visitorName, entryTime, entryGate || null);

    return VisitRecordDAO.getById(id)!;
  },

  setExitTime(id: string, exitTime: string, exitGate?: string): VisitRecord | null {
    const db = getDb();

    db.prepare(
      "UPDATE visit_records SET exit_time = ?, exit_gate = ?, status = 'exited' WHERE id = ?"
    ).run(exitTime, exitGate || null, id);

    return VisitRecordDAO.getById(id);
  },

  setExitTimeByAppointment(appointmentId: string, exitTime: string, exitGate?: string): VisitRecord | null {
    const db = getDb();
    const activeRecord = VisitRecordDAO.findActiveByAppointmentId(appointmentId);
    if (!activeRecord) return null;

    db.prepare(
      "UPDATE visit_records SET exit_time = ?, exit_gate = ?, status = 'exited' WHERE id = ?"
    ).run(exitTime, exitGate || null, activeRecord.id);

    return VisitRecordDAO.getById(activeRecord.id);
  },

  findActiveByPlate(plateNumber: string): VisitRecord | null {
    const db = getDb();
    const row = db.prepare(
      "SELECT * FROM visit_records WHERE plate_number = ? AND status = 'entered' ORDER BY entry_time DESC LIMIT 1"
    ).get(plateNumber);
    return row ? rowToVisitRecord(row) : null;
  },

  findActiveByAppointmentId(appointmentId: string): VisitRecord | null {
    const db = getDb();
    const row = db.prepare(
      "SELECT * FROM visit_records WHERE appointment_id = ? AND status = 'entered' ORDER BY entry_time DESC LIMIT 1"
    ).get(appointmentId);
    return row ? rowToVisitRecord(row) : null;
  },

  getById(id: string): VisitRecord | null {
    const db = getDb();
    const row = db.prepare('SELECT * FROM visit_records WHERE id = ?').get(id);
    return row ? rowToVisitRecord(row) : null;
  },

  list(options?: { date?: string; status?: 'entered' | 'exited' }): VisitRecord[] {
    const db = getDb();
    let sql = 'SELECT * FROM visit_records WHERE 1=1';
    const params: any[] = [];

    if (options?.date) {
      sql += " AND DATE(entry_time) = DATE(?)";
      params.push(options.date);
    }
    if (options?.status) {
      sql += ' AND status = ?';
      params.push(options.status);
    }

    sql += ' ORDER BY entry_time DESC';
    const rows = db.prepare(sql).all(params);
    return rows.map(rowToVisitRecord);
  },

  listToday(): VisitRecord[] {
    const today = new Date().toISOString().split('T')[0];
    return VisitRecordDAO.list({ date: today });
  },
};
