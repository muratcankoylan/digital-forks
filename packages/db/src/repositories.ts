/**
 * Repositories for FORKS
 *
 * Type-safe database operations using Drizzle ORM.
 * Same API as the previous Supabase implementation.
 */

import { eq, desc, and, sql } from 'drizzle-orm';
import { getClient } from './client';
import * as schema from './schema';
import type { User, Fork, Message, ForkStatus, Platform, MessageRole } from './schema';
import type { InterviewOutput, ResearchOutput } from '@forks/shared';

/**
 * User repository
 */
export const users = {
  async findById(id: string): Promise<User | null> {
    const db = getClient();
    const result = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, id))
      .limit(1);

    return result[0] || null;
  },

  async findByPlatformId(platformId: string): Promise<User | null> {
    const db = getClient();
    const result = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.platformId, platformId))
      .limit(1);

    return result[0] || null;
  },

  async create(platformId?: string, metadata?: Record<string, unknown>): Promise<User> {
    const db = getClient();
    const id = crypto.randomUUID();

    const result = await db
      .insert(schema.users)
      .values({
        id,
        platformId: platformId || null,
        metadata: metadata || {},
      })
      .returning();

    return result[0];
  },

  async findOrCreate(platformId: string): Promise<User> {
    const existing = await this.findByPlatformId(platformId);
    if (existing) return existing;
    return this.create(platformId);
  },
};

/**
 * Fork repository
 */
export const forks = {
  async findById(id: string): Promise<Fork | null> {
    const db = getClient();
    const result = await db
      .select()
      .from(schema.forks)
      .where(eq(schema.forks.id, id))
      .limit(1);

    return result[0] || null;
  },

  async findByUserId(userId: string): Promise<Fork[]> {
    const db = getClient();
    const result = await db
      .select()
      .from(schema.forks)
      .where(eq(schema.forks.userId, userId))
      .orderBy(desc(schema.forks.lastMessageAt));

    return result;
  },

  async findActiveByUserId(userId: string): Promise<Fork | null> {
    const db = getClient();
    const result = await db
      .select()
      .from(schema.forks)
      .where(
        and(
          eq(schema.forks.userId, userId),
          eq(schema.forks.status, 'active')
        )
      )
      .orderBy(desc(schema.forks.lastMessageAt))
      .limit(1);

    return result[0] || null;
  },

  async create(data: {
    userId: string;
    forkDescription: string;
    choiceMade: string;
    choiceNotMade: string;
    yearsElapsed?: number;
    userContext?: string;
  }): Promise<Fork> {
    const db = getClient();
    const id = crypto.randomUUID();

    const result = await db
      .insert(schema.forks)
      .values({
        id,
        userId: data.userId,
        forkDescription: data.forkDescription,
        choiceMade: data.choiceMade,
        choiceNotMade: data.choiceNotMade,
        yearsElapsed: data.yearsElapsed || 10,
        userContext: data.userContext || null,
        status: 'creating',
      })
      .returning();

    return result[0];
  },

  async updatePipelineOutputs(
    id: string,
    data: {
      interviewOutput: InterviewOutput;
      researchOutput: ResearchOutput;
      personaPrompt: string;
      alternateSelfName: string;
      alternateSelfSummary: string;
    }
  ): Promise<Fork> {
    const db = getClient();

    const result = await db
      .update(schema.forks)
      .set({
        interviewOutput: data.interviewOutput as unknown as Record<string, unknown>,
        researchOutput: data.researchOutput as unknown as Record<string, unknown>,
        personaPrompt: data.personaPrompt,
        alternateSelfName: data.alternateSelfName,
        alternateSelfSummary: data.alternateSelfSummary,
        status: 'active',
      })
      .where(eq(schema.forks.id, id))
      .returning();

    return result[0];
  },

  async updateStatus(id: string, status: ForkStatus): Promise<Fork> {
    const db = getClient();

    const result = await db
      .update(schema.forks)
      .set({ status })
      .where(eq(schema.forks.id, id))
      .returning();

    return result[0];
  },

  async incrementMessageCount(id: string): Promise<void> {
    const db = getClient();

    await db
      .update(schema.forks)
      .set({
        messageCount: sql`${schema.forks.messageCount} + 1`,
        lastMessageAt: new Date().toISOString(),
      })
      .where(eq(schema.forks.id, id));
  },

  async archive(id: string): Promise<void> {
    await this.updateStatus(id, 'archived');
  },
};

/**
 * Message repository
 */
export const messages = {
  async findByForkId(
    forkId: string,
    options?: { limit?: number; offset?: number }
  ): Promise<Message[]> {
    const db = getClient();

    let query = db
      .select()
      .from(schema.messages)
      .where(eq(schema.messages.forkId, forkId))
      .orderBy(schema.messages.createdAt);

    if (options?.limit) {
      query = query.limit(options.limit) as typeof query;
    }
    if (options?.offset) {
      query = query.offset(options.offset) as typeof query;
    }

    return query;
  },

  async getRecentHistory(forkId: string, limit = 50): Promise<Message[]> {
    const db = getClient();

    const result = await db
      .select()
      .from(schema.messages)
      .where(eq(schema.messages.forkId, forkId))
      .orderBy(desc(schema.messages.createdAt))
      .limit(limit);

    // Reverse to get chronological order
    return result.reverse();
  },

  async create(data: {
    forkId: string;
    role: MessageRole;
    content: string;
    platform?: Platform | null;
    tokensUsed?: number;
    latencyMs?: number;
  }): Promise<Message> {
    const db = getClient();
    const id = crypto.randomUUID();

    const result = await db
      .insert(schema.messages)
      .values({
        id,
        forkId: data.forkId,
        role: data.role,
        content: data.content,
        platform: data.platform || null,
        tokensUsed: data.tokensUsed || null,
        latencyMs: data.latencyMs || null,
      })
      .returning();

    // Update fork message count
    await forks.incrementMessageCount(data.forkId);

    return result[0];
  },

  async createPair(
    forkId: string,
    userMessage: string,
    assistantMessage: string,
    metadata?: {
      platform?: Platform | null;
      tokensUsed?: number;
      latencyMs?: number;
    }
  ): Promise<[Message, Message]> {
    const userMsg = await this.create({
      forkId,
      role: 'user',
      content: userMessage,
      platform: metadata?.platform,
    });

    const assistantMsg = await this.create({
      forkId,
      role: 'alternate_self',
      content: assistantMessage,
      platform: metadata?.platform,
      tokensUsed: metadata?.tokensUsed,
      latencyMs: metadata?.latencyMs,
    });

    return [userMsg, assistantMsg];
  },
};
