import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../../data/app.db');

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

export function initDatabase(): void {
  const database = getDb();

  database.exec(`
    CREATE TABLE IF NOT EXISTS blacklist (
      id TEXT PRIMARY KEY,
      plate_number TEXT UNIQUE NOT NULL,
      reason TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id TEXT PRIMARY KEY,
      visitor_name TEXT NOT NULL,
      visitor_phone TEXT NOT NULL,
      visitor_company TEXT,
      purpose TEXT NOT NULL,
      department TEXT NOT NULL,
      employee_name TEXT NOT NULL,
      employee_phone TEXT NOT NULL,
      plate_number TEXT,
      companion_count INTEGER DEFAULT 0,
      start_time DATETIME NOT NULL,
      end_time DATETIME NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending_info',
      entry_time DATETIME,
      exit_time DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_appointments_plate ON appointments(plate_number);
    CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
    CREATE INDEX IF NOT EXISTS idx_appointments_start_time ON appointments(start_time);

    CREATE TABLE IF NOT EXISTS visit_records (
      id TEXT PRIMARY KEY,
      appointment_id TEXT NOT NULL,
      plate_number TEXT NOT NULL,
      visitor_name TEXT NOT NULL,
      entry_time DATETIME,
      exit_time DATETIME,
      status TEXT NOT NULL DEFAULT 'entered',
      FOREIGN KEY (appointment_id) REFERENCES appointments(id)
    );

    CREATE INDEX IF NOT EXISTS idx_records_plate ON visit_records(plate_number);
    CREATE INDEX IF NOT EXISTS idx_records_status ON visit_records(status);

    CREATE TABLE IF NOT EXISTS plate_change_audits (
      id TEXT PRIMARY KEY,
      appointment_id TEXT NOT NULL,
      old_plate_number TEXT,
      new_plate_number TEXT NOT NULL,
      changed_by TEXT NOT NULL,
      changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (appointment_id) REFERENCES appointments(id)
    );

    CREATE TABLE IF NOT EXISTS reject_records (
      id TEXT PRIMARY KEY,
      plate_number TEXT NOT NULL,
      reject_type TEXT NOT NULL,
      reject_reason TEXT NOT NULL,
      appointment_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_rejects_plate ON reject_records(plate_number);
    CREATE INDEX IF NOT EXISTS idx_rejects_type ON reject_records(reject_type);
  `);

  const blacklistCount = database.prepare('SELECT COUNT(*) as count FROM blacklist').get() as { count: number };
  if (blacklistCount.count === 0) {
    const insertBlacklist = database.prepare(
      'INSERT INTO blacklist (id, plate_number, reason) VALUES (?, ?, ?)'
    );
    insertBlacklist.run('bl_001', '京A88888', '被列入园区黑名单车辆');
    insertBlacklist.run('bl_002', '沪B66666', '多次违规闯岗');
  }

  const apptCount = database.prepare('SELECT COUNT(*) as count FROM appointments').get() as { count: number };
  if (apptCount.count === 0) {
    const now = new Date();
    const startTime = new Date(now.getTime() + 60 * 60 * 1000);
    const endTime = new Date(now.getTime() + 5 * 60 * 60 * 1000);
    const createdAt = new Date(now.getTime() - 30 * 60 * 1000);

    database.prepare(
      `INSERT INTO appointments (id, visitor_name, visitor_phone, visitor_company, purpose, department, employee_name, employee_phone, plate_number, companion_count, start_time, end_time, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      'apt_001',
      '张三',
      '13800138001',
      '科技有限公司',
      '项目对接',
      '技术部',
      '李工',
      '13900139001',
      '粤B12345',
      2,
      startTime.toISOString(),
      endTime.toISOString(),
      'pending_entry',
      createdAt.toISOString()
    );
  }
}
