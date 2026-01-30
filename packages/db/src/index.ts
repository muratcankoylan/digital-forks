/**
 * @forks/db - Local SQLite database with Drizzle ORM
 *
 * Fast, type-safe database for development.
 * Same API structure - can migrate to PostgreSQL later.
 */

// Client functions
export {
  createClient,
  getClient,
  closeClient,
  resetDatabase,
  isConnected,
  schema,
} from './client';

// Repositories
export { users, forks, messages } from './repositories';

// Schema and types
export {
  users as usersTable,
  forks as forksTable,
  messages as messagesTable,
} from './schema';

export type {
  User,
  NewUser,
  Fork,
  NewFork,
  Message,
  NewMessage,
  ForkStatus,
  MessageRole,
  Platform,
} from './schema';
