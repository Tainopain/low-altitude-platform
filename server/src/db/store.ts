import fs from 'fs';
import path from 'path';
import initSqlJs, { type Database, type SqlJsStatic } from 'sql.js';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'store.db');
const JSON_FILE = path.join(DATA_DIR, 'store.json');

let SQL: SqlJsStatic | null = null;
let db: Database | null = null;

// ============================================================
// Database initialization
// ============================================================

export async function initStore(): Promise<void> {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  SQL = await initSqlJs();

  if (fs.existsSync(DB_FILE)) {
    const buffer = fs.readFileSync(DB_FILE);
    db = new SQL.Database(buffer);
    console.log(`SQLite loaded: ${DB_FILE}`);
  } else {
    db = new SQL.Database();
    console.log('SQLite created');
  }

  // Create tables
  db.run(`CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, username TEXT UNIQUE NOT NULL, password TEXT NOT NULL, role TEXT NOT NULL)`);
  db.run(`CREATE TABLE IF NOT EXISTS drones (id TEXT PRIMARY KEY, name TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'standby', lng REAL NOT NULL, lat REAL NOT NULL, home_lng REAL NOT NULL, home_lat REAL NOT NULL, heading REAL NOT NULL DEFAULT 0, battery INTEGER NOT NULL DEFAULT 100, task TEXT NOT NULL DEFAULT '待命', speed INTEGER NOT NULL DEFAULT 0, updated_at TEXT)`);
  db.run(`CREATE TABLE IF NOT EXISTS events (id TEXT PRIMARY KEY, type TEXT NOT NULL, level TEXT NOT NULL, confidence INTEGER NOT NULL DEFAULT 0, road_name TEXT NOT NULL, stake_number TEXT NOT NULL, direction TEXT NOT NULL, lng REAL NOT NULL, lat REAL NOT NULL, source TEXT NOT NULL DEFAULT 'camera', source_detail TEXT, screenshot TEXT, ai_description TEXT, status TEXT NOT NULL DEFAULT 'pending', drone_id TEXT, confirmed_by TEXT, created_at TEXT NOT NULL, updated_at TEXT)`);
  db.run(`CREATE TABLE IF NOT EXISTS chat_messages (id TEXT PRIMARY KEY, role TEXT NOT NULL, content TEXT NOT NULL, created_at TEXT NOT NULL)`);

  // Migrate: add new columns for existing databases
  try { db.run('ALTER TABLE events ADD COLUMN screenshot TEXT'); } catch { /* ok */ }
  try { db.run('ALTER TABLE events ADD COLUMN ai_description TEXT'); } catch { /* ok */ }

  // Indexes
  db.run(`CREATE INDEX IF NOT EXISTS idx_events_status ON events(status)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_events_level ON events(level)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_events_created ON events(created_at)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_drones_status ON drones(status)`);

  // Migrate from old JSON store if DB is empty
  const cnt = queryOne('SELECT COUNT(*) as cnt FROM events');
  if (Number(cnt?.cnt ?? 0) === 0 && fs.existsSync(JSON_FILE)) {
    console.log('Migrating data from JSON → SQLite...');
    migrateFromJSON();
    console.log('Migration complete');
  }

  persist();
}

// ============================================================
// sql.js helpers — wrap step/getAsObject/step patterns
// ============================================================

function ensureDB(): Database {
  if (!db) throw new Error('Database not initialized. Call initStore() first.');
  return db;
}

function persist(): void {
  if (!db) return;
  const data = db.export();
  fs.writeFileSync(DB_FILE, Buffer.from(data));
}

/** Run a SELECT and return all rows as objects */
function queryAll(sql: string, params?: any[]): any[] {
  const d = ensureDB();
  const stmt = d.prepare(sql);
  if (params) stmt.bind(params);
  const rows: any[] = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

/** Run a SELECT and return the first row as an object, or null */
function queryOne(sql: string, params?: any[]): any | null {
  const d = ensureDB();
  const stmt = d.prepare(sql);
  if (params) stmt.bind(params);
  const row = stmt.step() ? stmt.getAsObject() : null;
  stmt.free();
  return row;
}

/** Execute a write statement (INSERT/UPDATE/DELETE) */
function execute(sql: string, params?: any[]): void {
  const d = ensureDB();
  const stmt = d.prepare(sql);
  if (params) stmt.bind(params);
  stmt.step();
  stmt.free();
}

/** Execute a write and get number of modified rows */
function executeAndCount(sql: string, params?: any[]): number {
  const d = ensureDB();
  const stmt = d.prepare(sql);
  if (params) stmt.bind(params);
  stmt.step();
  stmt.free();
  return d.getRowsModified();
}

// ============================================================
// JSON migration
// ============================================================

function migrateFromJSON(): void {
  try {
    const raw = fs.readFileSync(JSON_FILE, 'utf-8');
    const json: any = JSON.parse(raw);
    const now = new Date().toISOString();

    for (const u of (json.users || [])) {
      execute('INSERT OR IGNORE INTO users (id, username, password, role) VALUES (?, ?, ?, ?)',
        [u.id, u.username, u.password, u.role]);
    }
    for (const dr of (json.drones || [])) {
      execute('INSERT OR IGNORE INTO drones (id, name, status, lng, lat, home_lng, home_lat, heading, battery, task, speed, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [dr.id, dr.name, dr.status, dr.lng, dr.lat, dr.home_lng ?? dr.homeLng, dr.home_lat ?? dr.homeLat, dr.heading ?? 0, dr.battery ?? 100, dr.task ?? '待命', dr.speed ?? 0, dr.updated_at ?? now]);
    }
    for (const e of (json.events || [])) {
      execute('INSERT OR IGNORE INTO events (id, type, level, confidence, road_name, stake_number, direction, lng, lat, source, source_detail, status, drone_id, confirmed_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [e.id, e.type, e.level, e.confidence, e.road_name ?? e.roadName, e.stake_number ?? e.stakeNumber, e.direction, e.lng, e.lat, e.source, e.source_detail ?? e.sourceDetail, e.status, e.drone_id ?? e.droneId ?? null, e.confirmed_by ?? e.confirmedBy ?? null, e.created_at ?? e.createdAt, e.updated_at ?? now]);
    }
    for (const m of (json.chatMessages || [])) {
      execute('INSERT OR IGNORE INTO chat_messages (id, role, content, created_at) VALUES (?, ?, ?, ?)',
        [m.id, m.role, m.content, m.created_at ?? m.createdAt]);
    }
    persist();
    console.log('JSON data migrated to SQLite successfully');
  } catch (err) {
    console.warn('JSON migration skipped:', (err as Error).message);
  }
}

// ============================================================
// Store API
// ============================================================

export const store = {
  // ---- Users ----
  findUserByUsername(username: string) {
    return queryOne('SELECT * FROM users WHERE username = ?', [username]);
  },
  findUserById(id: string) {
    return queryOne('SELECT * FROM users WHERE id = ?', [id]);
  },

  // ---- Events ----
  getEvents() {
    return queryAll('SELECT * FROM events ORDER BY created_at DESC');
  },
  getEventById(id: string) {
    return queryOne('SELECT * FROM events WHERE id = ?', [id]);
  },
  updateEvent(id: string, patch: Record<string, any>) {
    const existing = queryOne('SELECT * FROM events WHERE id = ?', [id]);
    if (!existing) return null;

    const keys = Object.keys(patch);
    const setClauses = [...keys.map((k) => `${snakeCase(k)} = ?`), 'updated_at = ?'];
    const values = [...keys.map((k) => patch[k]), new Date().toISOString(), id];
    execute(`UPDATE events SET ${setClauses.join(', ')} WHERE id = ?`, values);
    persist();
    return queryOne('SELECT * FROM events WHERE id = ?', [id]);
  },
  createEvent(event: any) {
    execute(
      'INSERT INTO events (id, type, level, confidence, road_name, stake_number, direction, lng, lat, source, source_detail, screenshot, ai_description, status, drone_id, confirmed_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        event.id, event.type, event.level, event.confidence,
        event.road_name ?? event.roadName, event.stake_number ?? event.stakeNumber,
        event.direction, event.lng, event.lat,
        event.source, event.source_detail ?? event.sourceDetail,
        event.screenshot ?? null,
        event.ai_description ?? event.aiDescription ?? null,
        event.status, event.drone_id ?? event.droneId ?? null,
        event.confirmed_by ?? event.confirmedBy ?? null,
        event.created_at ?? new Date().toISOString(),
        event.updated_at ?? new Date().toISOString(),
      ]
    );
    persist();
    return event;
  },
  resetEvents(level?: string, status?: string, keep?: number) {
    let sql = 'SELECT id FROM events WHERE 1=1';
    const params: any[] = [];
    if (level) { sql += ' AND level = ?'; params.push(level); }
    if (status) { sql += ' AND status = ?'; params.push(status); }
    sql += ' ORDER BY created_at DESC';
    if (keep !== undefined && keep > 0) { sql += ' LIMIT -1 OFFSET ?'; params.push(keep); }

    const rows = queryAll(sql, params);
    const ids = rows.map((r: any) => r.id);
    if (ids.length === 0) return 0;

    const placeholders = ids.map(() => '?').join(',');
    execute(`DELETE FROM events WHERE id IN (${placeholders})`, ids);
    persist();
    return ids.length;
  },

  // ---- Drones ----
  getDrones() {
    return queryAll('SELECT * FROM drones');
  },
  getDroneById(id: string) {
    return queryOne('SELECT * FROM drones WHERE id = ?', [id]);
  },
  updateDrone(id: string, patch: Record<string, any>) {
    const existing = queryOne('SELECT * FROM drones WHERE id = ?', [id]);
    if (!existing) return null;

    const keys = Object.keys(patch);
    const setClauses = [...keys.map((k) => `${snakeCase(k)} = ?`), 'updated_at = ?'];
    const values = [...keys.map((k) => patch[k]), new Date().toISOString(), id];
    execute(`UPDATE drones SET ${setClauses.join(', ')} WHERE id = ?`, values);
    persist();
    return queryOne('SELECT * FROM drones WHERE id = ?', [id]);
  },
  resetDrones(deleteAll = false) {
    const n = deleteAll
      ? executeAndCount('DELETE FROM drones')
      : executeAndCount(
          "UPDATE drones SET status = 'standby', lng = home_lng, lat = home_lat, heading = 0, speed = 0, task = '待命', updated_at = ? WHERE status != 'flying'",
          [new Date().toISOString()]
        );
    persist();
    return n;
  },

  // ---- Chat ----
  getChatMessages() {
    return queryAll('SELECT * FROM chat_messages ORDER BY created_at ASC');
  },
  addChatMessage(msg: any) {
    execute('INSERT INTO chat_messages (id, role, content, created_at) VALUES (?, ?, ?, ?)',
      [msg.id, msg.role, msg.content, msg.created_at ?? new Date().toISOString()]);
    persist();
    return msg;
  },

  // ---- Seed / Reset ----
  seed(data: { users?: any[]; drones?: any[]; events?: any[]; chatMessages?: any[] }) {
    const now = new Date().toISOString();
    if (data.users?.length) {
      for (const u of data.users) {
        execute('INSERT OR REPLACE INTO users (id, username, password, role) VALUES (?, ?, ?, ?)',
          [u.id, u.username, u.password, u.role]);
      }
    }
    if (data.drones?.length) {
      for (const dr of data.drones) {
        execute('INSERT OR REPLACE INTO drones (id, name, status, lng, lat, home_lng, home_lat, heading, battery, task, speed, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [dr.id, dr.name, dr.status, dr.lng, dr.lat, dr.home_lng, dr.home_lat, dr.heading ?? 0, dr.battery ?? 100, dr.task ?? '待命', dr.speed ?? 0, dr.updated_at ?? now]);
      }
    }
    if (data.events?.length) {
      for (const e of data.events) {
        execute('INSERT OR REPLACE INTO events (id, type, level, confidence, road_name, stake_number, direction, lng, lat, source, source_detail, screenshot, ai_description, status, drone_id, confirmed_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [e.id, e.type, e.level, e.confidence, e.road_name, e.stake_number, e.direction, e.lng, e.lat, e.source, e.source_detail, e.screenshot ?? null, e.ai_description ?? null, e.status, e.drone_id ?? null, e.confirmed_by ?? null, e.created_at, e.updated_at ?? now]);
      }
    }
    if (data.chatMessages?.length) {
      for (const m of data.chatMessages) {
        execute('INSERT OR REPLACE INTO chat_messages (id, role, content, created_at) VALUES (?, ?, ?, ?)',
          [m.id, m.role, m.content, m.created_at]);
      }
    }
    persist();
  },
};

// ============================================================
// Utility
// ============================================================

function snakeCase(key: string): string {
  return key.replace(/[A-Z]/g, (m) => '_' + m.toLowerCase());
}
