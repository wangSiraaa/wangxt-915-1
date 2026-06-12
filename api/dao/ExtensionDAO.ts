import { getDb } from '../db/database.js';
import type { ExtensionRequest, ExtensionStatus, CreateExtensionRequest, TimelineEvent, TimelineAction, UserRole } from '../../shared/types.js';
import { v4 as uuidv4 } from 'uuid';

function rowToExtensionRequest(row: any): ExtensionRequest {
  return {
    id: row.id,
    appointmentId: row.appointment_id,
    reason: row.reason,
    newEndTime: row.new_end_time,
    departmentConfirm: row.department_confirm,
    requestedBy: row.requested_by,
    requestedAt: row.requested_at,
    status: row.status as ExtensionStatus,
    approver: row.approver || undefined,
    approvedAt: row.approved_at || undefined,
    rejectReason: row.reject_reason || undefined,
    rejectedAt: row.rejected_at || undefined,
  };
}

function rowToTimelineEvent(row: any): TimelineEvent {
  return {
    id: row.id,
    appointmentId: row.appointment_id,
    action: row.action as TimelineAction,
    operator: row.operator,
    operatorRole: row.operator_role as UserRole,
    remark: row.remark || undefined,
    createdAt: row.created_at,
  };
}

export const ExtensionDAO = {
  create(req: CreateExtensionRequest): ExtensionRequest {
    const db = getDb();
    const id = `ext_${uuidv4().slice(0, 8)}`;

    db.prepare(
      `INSERT INTO extension_requests (id, appointment_id, reason, new_end_time, department_confirm, requested_by, status)
       VALUES (?, ?, ?, ?, ?, ?, 'pending')`
    ).run(id, req.appointmentId, req.reason, req.newEndTime, req.departmentConfirm, req.requestedBy);

    return ExtensionDAO.getById(id)!;
  },

  getById(id: string): ExtensionRequest | null {
    const db = getDb();
    const row = db.prepare('SELECT * FROM extension_requests WHERE id = ?').get(id);
    return row ? rowToExtensionRequest(row) : null;
  },

  getByAppointmentId(appointmentId: string): ExtensionRequest[] {
    const db = getDb();
    const rows = db.prepare(
      'SELECT * FROM extension_requests WHERE appointment_id = ? ORDER BY requested_at DESC'
    ).all(appointmentId);
    return rows.map(rowToExtensionRequest);
  },

  getPendingByAppointmentId(appointmentId: string): ExtensionRequest | null {
    const db = getDb();
    const row = db.prepare(
      "SELECT * FROM extension_requests WHERE appointment_id = ? AND status = 'pending' ORDER BY requested_at DESC LIMIT 1"
    ).get(appointmentId);
    return row ? rowToExtensionRequest(row) : null;
  },

  list(options?: { status?: ExtensionStatus }): ExtensionRequest[] {
    const db = getDb();
    let sql = 'SELECT * FROM extension_requests WHERE 1=1';
    const params: any[] = [];

    if (options?.status) {
      sql += ' AND status = ?';
      params.push(options.status);
    }

    sql += ' ORDER BY requested_at DESC';
    const rows = db.prepare(sql).all(params);
    return rows.map(rowToExtensionRequest);
  },

  approve(id: string, approver: string): ExtensionRequest | null {
    const db = getDb();
    const now = new Date().toISOString();

    db.prepare(
      "UPDATE extension_requests SET status = 'approved', approver = ?, approved_at = ? WHERE id = ?"
    ).run(approver, now, id);

    return ExtensionDAO.getById(id);
  },

  reject(id: string, approver: string, rejectReason: string): ExtensionRequest | null {
    const db = getDb();
    const now = new Date().toISOString();

    db.prepare(
      "UPDATE extension_requests SET status = 'rejected', approver = ?, rejected_at = ?, reject_reason = ? WHERE id = ?"
    ).run(approver, now, rejectReason, id);

    return ExtensionDAO.getById(id);
  },

  addTimelineEvent(
    appointmentId: string,
    action: TimelineAction,
    operator: string,
    operatorRole: UserRole,
    remark?: string
  ): TimelineEvent {
    const db = getDb();
    const id = `tl_${uuidv4().slice(0, 8)}`;

    db.prepare(
      `INSERT INTO timeline_events (id, appointment_id, action, operator, operator_role, remark)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(id, appointmentId, action, operator, operatorRole, remark || null);

    return ExtensionDAO.getTimelineEventById(id)!;
  },

  getTimelineEventById(id: string): TimelineEvent | null {
    const db = getDb();
    const row = db.prepare('SELECT * FROM timeline_events WHERE id = ?').get(id);
    return row ? rowToTimelineEvent(row) : null;
  },

  getTimelineByAppointmentId(appointmentId: string): TimelineEvent[] {
    const db = getDb();
    const rows = db.prepare(
      'SELECT * FROM timeline_events WHERE appointment_id = ? ORDER BY created_at ASC'
    ).all(appointmentId);
    return rows.map(rowToTimelineEvent);
  },
};
