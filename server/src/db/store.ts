import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'store.json');

interface DB {
  users: any[];
  drones: any[];
  events: any[];
  chatMessages: any[];
}

const EMPTY: DB = { users: [], drones: [], events: [], chatMessages: [] };

function read(): DB {
  try {
    if (!fs.existsSync(DATA_FILE)) return EMPTY;
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return EMPTY;
  }
}

function write(data: DB): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

export const store = {
  // Users
  findUserByUsername(username: string) {
    return read().users.find((u) => u.username === username) || null;
  },
  findUserById(id: string) {
    return read().users.find((u) => u.id === id) || null;
  },

  // Events
  getEvents() {
    return read().events.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },
  getEventById(id: string) {
    return read().events.find((e) => e.id === id) || null;
  },
  updateEvent(id: string, patch: Record<string, any>) {
    const db = read();
    const idx = db.events.findIndex((e) => e.id === id);
    if (idx === -1) return null;
    db.events[idx] = { ...db.events[idx], ...patch, updated_at: new Date().toISOString() };
    write(db);
    return db.events[idx];
  },
  createEvent(event: any) {
    const db = read();
    db.events.push(event);
    write(db);
    return event;
  },

  // Drones
  getDrones() {
    return read().drones;
  },
  getDroneById(id: string) {
    return read().drones.find((d) => d.id === id) || null;
  },
  updateDrone(id: string, patch: Record<string, any>) {
    const db = read();
    const idx = db.drones.findIndex((d) => d.id === id);
    if (idx === -1) return null;
    db.drones[idx] = { ...db.drones[idx], ...patch, updated_at: new Date().toISOString() };
    write(db);
    return db.drones[idx];
  },

  // Chat
  getChatMessages() {
    return read().chatMessages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  },
  addChatMessage(msg: any) {
    const db = read();
    db.chatMessages.push(msg);
    write(db);
    return msg;
  },

  // Seed
  seed(data: { users?: any[]; drones?: any[]; events?: any[]; chatMessages?: any[] }) {
    const db = read();
    if (data.users) db.users = data.users;
    if (data.drones) db.drones = data.drones;
    if (data.events) db.events = data.events;
    if (data.chatMessages) db.chatMessages = data.chatMessages;
    write(db);
  },
};
