/**
 * Drizzle ORM Schema for FORKS
 *
 * Local SQLite database with the same schema as the original Supabase design.
 * Can be migrated to PostgreSQL later if needed.
 */

import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

/**
 * Users table
 * Stores user information, linked via platform ID (whatsapp:+1234, telegram:123, etc.)
 */
export const users = sqliteTable('users', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
  platformId: text('platform_id').unique(),
  metadata: text('metadata', { mode: 'json' }).$type<Record<string, unknown>>().default({}),
});

/**
 * Forks table
 * Stores fork definitions and pipeline outputs
 */
export const forks = sqliteTable('forks', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),

  // Fork definition (user input)
  forkDescription: text('fork_description').notNull(),
  choiceMade: text('choice_made').notNull(),
  choiceNotMade: text('choice_not_made').notNull(),
  yearsElapsed: integer('years_elapsed').default(10),
  userContext: text('user_context'),

  // Pipeline outputs (stored as JSON)
  interviewOutput: text('interview_output', { mode: 'json' }).$type<Record<string, unknown>>(),
  researchOutput: text('research_output', { mode: 'json' }).$type<Record<string, unknown>>(),
  personaPrompt: text('persona_prompt'),

  // Generated character summary (for UI)
  alternateSelfName: text('alternate_self_name'),
  alternateSelfSummary: text('alternate_self_summary'),

  // State
  status: text('status', { enum: ['creating', 'active', 'archived'] })
    .notNull()
    .default('creating'),
  lastMessageAt: text('last_message_at'),
  messageCount: integer('message_count').notNull().default(0),
});

/**
 * Messages table
 * Stores conversation history
 */
export const messages = sqliteTable('messages', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  forkId: text('fork_id')
    .notNull()
    .references(() => forks.id, { onDelete: 'cascade' }),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),

  role: text('role', { enum: ['user', 'alternate_self'] }).notNull(),
  content: text('content').notNull(),

  // Metadata
  platform: text('platform', { enum: ['web', 'whatsapp', 'telegram', 'discord', 'imessage', 'mattermost'] }),
  tokensUsed: integer('tokens_used'),
  latencyMs: integer('latency_ms'),
});

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Fork = typeof forks.$inferSelect;
export type NewFork = typeof forks.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;

export type ForkStatus = 'creating' | 'active' | 'archived';
export type MessageRole = 'user' | 'alternate_self';
export type Platform = 'web' | 'whatsapp' | 'telegram' | 'discord' | 'imessage' | 'mattermost';
