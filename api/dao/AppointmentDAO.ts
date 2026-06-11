import { getDb } from '../db/database.js';
import type { Appointment, AppointmentStatus, CreateAppointmentRequest } from '../../shared/types.js';
import { v4 as uuidv4 } from 'uuid';

function rowToAppointment(row: any): Appointment {
  return {
    id: row.id,
    visitorName: row.visitor_name,
    visitorPhone: row.visitor_phone,
    visitorCompany: row.visitor_company || undefined,
    purpose: row.purpose,
    department: row.department,
    employeeName: row.employee_name,
    employeePhone: row.employee_phone,
    plateNumber: row.plate_number || undefined,
    companionCount: row.companion_count,
    startTime: row.start_time,
    endTime: row.end_time,
    status: row.status as AppointmentStatus,
    entryTime: row.entry_time || undefined,
    exitTime: row.exit_time || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const AppointmentDAO = {
  create(req: CreateAppointmentRequest): Appointment {
    const db = getDb();
    const id = `apt_${uuidv4().slice(0, 8)}`;
    const now = new Date().toISOString();
    const hasPlate = req.plateNumber && req.plateNumber.trim().length > 0;
    const status = hasPlate ? 'pending_entry' : 'pending_info';

    const stmt = db.prepare(
      `INSERT INTO appointments (id, visitor_name, visitor_phone, visitor_company, purpose, department, employee_name, employee_phone, plate_number, companion_count, start_time, end_time, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );

    stmt.run(
      id,
      req.visitorName,
      req.visitorPhone,
      req.visitorCompany || null,
      req.purpose,
      req.department,
      req.employeeName,
      req.employeePhone,
      hasPlate ? req.plateNumber!.trim().toUpperCase() : null,
      req.companionCount || 0,
      req.startTime,
      req.endTime,
      status,
      now,
      now
    );

    return AppointmentDAO.getById(id)!;
  },

  getById(id: string): Appointment | null {
    const db = getDb();
    const row = db.prepare('SELECT * FROM appointments WHERE id = ?').get(id);
    return row ? rowToAppointment(row) : null;
  },

  list(options?: { status?: AppointmentStatus; employeePhone?: string }): Appointment[] {
    const db = getDb();
    let sql = 'SELECT * FROM appointments WHERE 1=1';
    const params: any[] = [];

    if (options?.status) {
      sql += ' AND status = ?';
      params.push(options.status);
    }
    if (options?.employeePhone) {
      sql += ' AND employee_phone = ?';
      params.push(options.employeePhone);
    }

    sql += ' ORDER BY created_at DESC';
    const rows = db.prepare(sql).all(params);
    return rows.map(rowToAppointment);
  },

  updateVisitorInfo(id: string, plateNumber: string, companionCount: number): Appointment | null {
    const db = getDb();
    const now = new Date().toISOString();
    const appointment = AppointmentDAO.getById(id);
    
    if (!appointment) return null;

    if (appointment.status === 'pending_info') {
      db.prepare(
        `UPDATE appointments 
         SET plate_number = ?, companion_count = ?, status = 'pending_entry', updated_at = ?
         WHERE id = ?`
      ).run(plateNumber, companionCount, now, id);
    } else {
      db.prepare(
        `UPDATE appointments 
         SET plate_number = ?, companion_count = ?, updated_at = ?
         WHERE id = ?`
      ).run(plateNumber, companionCount, now, id);
    }

    return AppointmentDAO.getById(id);
  },

  updateStatus(id: string, status: AppointmentStatus): Appointment | null {
    const db = getDb();
    const now = new Date().toISOString();

    db.prepare('UPDATE appointments SET status = ?, updated_at = ? WHERE id = ?').run(status, now, id);

    return AppointmentDAO.getById(id);
  },

  setEntryTime(id: string, entryTime: string): Appointment | null {
    const db = getDb();
    const now = new Date().toISOString();

    db.prepare(
      'UPDATE appointments SET entry_time = ?, status = ?, updated_at = ? WHERE id = ?'
    ).run(entryTime, 'entered', now, id);

    return AppointmentDAO.getById(id);
  },

  setExitTime(id: string, exitTime: string): Appointment | null {
    const db = getDb();
    const now = new Date().toISOString();

    db.prepare(
      'UPDATE appointments SET exit_time = ?, status = ?, updated_at = ? WHERE id = ?'
    ).run(exitTime, 'exited', now, id);

    return AppointmentDAO.getById(id);
  },

  findByPlateNumber(plateNumber: string): Appointment[] {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM appointments WHERE plate_number = ? ORDER BY created_at DESC').all(plateNumber);
    return rows.map(rowToAppointment);
  },

  hasActiveEntry(plateNumber: string): boolean {
    const db = getDb();
    const row = db.prepare(
      "SELECT COUNT(*) as count FROM appointments WHERE plate_number = ? AND status = 'entered'"
    ).get(plateNumber) as { count: number };
    return row.count > 0;
  },

  cancel(id: string): Appointment | null {
    return AppointmentDAO.updateStatus(id, 'cancelled');
  },
};
