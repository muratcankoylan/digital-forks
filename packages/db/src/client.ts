/**
 * SQLite + Drizzle ORM Client for FORKS
 *
 * Local database for fast development iteration.
 * Can be migrated to PostgreSQL/Supabase for production.
 */

import Database from 'better-sqlite3';
import { drizzle, BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import { sql } from 'drizzle-orm';
import { existsSync, mkdirSync } from 'fs';
import { dirname, resolve } from 'path';

// Database connection singleton
let db: BetterSQLite3Database<typeof schema> | null = null;
let sqliteDb: Database.Database | null = null;

/**
 * Get the database file path
 * Uses DATABASE_PATH env var or defaults to local .data/forks.db
 */
function getDatabasePath(): string {
  if (process.env.DATABASE_PATH) {
    return process.env.DATABASE_PATH;
  }

  // Default: .data/forks.db in the project root
  const projectRoot = process.env.PROJECT_ROOT || process.cwd();
  return resolve(projectRoot, '.data', 'forks.db');
}

/**
 * Initialize the database schema
 * Creates tables if they don't exist
 */
function initializeSchema(sqlite: Database.Database): void {
  sqlite.exec(`
    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      platform_id TEXT UNIQUE,
      metadata TEXT DEFAULT '{}'
    );

    -- Forks table
    CREATE TABLE IF NOT EXISTS forks (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),

      fork_description TEXT NOT NULL,
      choice_made TEXT NOT NULL,
      choice_not_made TEXT NOT NULL,
      years_elapsed INTEGER DEFAULT 10,
      user_context TEXT,

      interview_output TEXT,
      research_output TEXT,
      persona_prompt TEXT,

      alternate_self_name TEXT,
      alternate_self_summary TEXT,

      status TEXT NOT NULL DEFAULT 'creating' CHECK(status IN ('creating', 'active', 'archived')),
      last_message_at TEXT,
      message_count INTEGER NOT NULL DEFAULT 0
    );

    -- Messages table
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      fork_id TEXT NOT NULL REFERENCES forks(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),

      role TEXT NOT NULL CHECK(role IN ('user', 'alternate_self')),
      content TEXT NOT NULL,

      platform TEXT CHECK(platform IN ('web', 'whatsapp', 'telegram', 'discord')),
      tokens_used INTEGER,
      latency_ms INTEGER
    );

    -- Indexes
    CREATE INDEX IF NOT EXISTS idx_forks_user ON forks(user_id);
    CREATE INDEX IF NOT EXISTS idx_messages_fork ON messages(fork_id);
    CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at);
    CREATE INDEX IF NOT EXISTS idx_users_platform ON users(platform_id);
  `);
}

/**
 * Create a new database connection
 */
export function createClient(dbPath?: string): BetterSQLite3Database<typeof schema> {
  const path = dbPath || getDatabasePath();

  // Ensure directory exists
  const dir = dirname(path);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  // Create SQLite connection
  const sqlite = new Database(path);

  // Enable WAL mode for better performance
  sqlite.pragma('journal_mode = WAL');

  // Enable foreign keys
  sqlite.pragma('foreign_keys = ON');

  // Initialize schema
  initializeSchema(sqlite);

  // Create Drizzle instance
  return drizzle(sqlite, { schema });
}

/**
 * Get or create a singleton database client
 */
export function getClient(): BetterSQLite3Database<typeof schema> {
  if (!db) {
    const path = getDatabasePath();
    console.log('[DB] Database path:', path);

    if (!path || typeof path !== 'string') {
      throw new Error(`Invalid database path: ${path}. Set DATABASE_PATH env var.`);
    }

    const dir = dirname(path);

    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    sqliteDb = new Database(path);
    sqliteDb.pragma('journal_mode = WAL');
    sqliteDb.pragma('foreign_keys = ON');
    initializeSchema(sqliteDb);

    db = drizzle(sqliteDb, { schema });
  }

  return db;
}

/**
 * Close the database connection
 * Call this when shutting down the app
 */
export function closeClient(): void {
  if (sqliteDb) {
    sqliteDb.close();
    sqliteDb = null;
    db = null;
  }
}

/**
 * Get raw SQLite database for advanced operations
 */
export function getRawClient(): Database.Database | null {
  return sqliteDb;
}

/**
 * Check if database is connected
 */
export function isConnected(): boolean {
  return db !== null && sqliteDb !== null;
}

/**
 * Reset database (for testing)
 * WARNING: This deletes all data!
 */
export function resetDatabase(): void {
  if (!sqliteDb) {
    getClient(); // Initialize if not already
  }

  sqliteDb!.exec(`
    DELETE FROM messages;
    DELETE FROM forks;
    DELETE FROM users;
  `);
}

// Export schema for direct access
export { schema };
