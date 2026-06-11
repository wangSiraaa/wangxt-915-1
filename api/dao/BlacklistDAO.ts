import { getDb } from '../db/database.js';
import type { BlacklistItem } from '../../shared/types.js';
import { v4 as uuidv4 } from 'uuid';

function rowToBlacklistItem(row: any): BlacklistItem {
  return {
    id: row.id,
    plateNumber: row.plate_number,
    reason: row.reason,
    createdAt: row.created_at,
  };
}

export const BlacklistDAO = {
  add(plateNumber: string, reason: string): BlacklistItem {
    const db = getDb();
    const id = `bl_${uuidv4().slice(0, 8)}`;

    db.prepare(
      'INSERT INTO blacklist (id, plate_number, reason) VALUES (?, ?, ?)'
    ).run(id, plateNumber, reason);

    return BlacklistDAO.getById(id)!;
  },

  getById(id: string): BlacklistItem | null {
    const db = getDb();
    const row = db.prepare('SELECT * FROM blacklist WHERE id = ?').get(id);
    return row ? rowToBlacklistItem(row) : null;
  },

  findByPlateNumber(plateNumber: string): BlacklistItem | null {
    const db = getDb();
    const row = db.prepare('SELECT * FROM blacklist WHERE plate_number = ?').get(plateNumber);
    return row ? rowToBlacklistItem(row) : null;
  },

  isBlacklisted(plateNumber: string): boolean {
    return BlacklistDAO.findByPlateNumber(plateNumber) !== null;
  },

  list(): BlacklistItem[] {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM blacklist ORDER BY created_at DESC').all();
    return rows.map(rowToBlacklistItem);
  },

  remove(id: string): boolean {
    const db = getDb();
    const result = db.prepare('DELETE FROM blacklist WHERE id = ?').run(id);
    return result.changes > 0;
  },
};
