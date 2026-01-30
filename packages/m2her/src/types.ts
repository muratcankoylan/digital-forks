/**
 * MiniMax M2-Her API Types
 *
 * M2-Her is designed for role-playing and multi-turn conversations.
 * It supports 7 different message roles for rich character interactions.
 */

/**
 * Message roles supported by M2-Her
 *
 * - system: Define model's role and behavior (the persona prompt)
 * - user: User input
 * - assistant: Model's prior responses
 * - user_system: Define user's persona/character (the "real you" context)
 * - group: Conversation identifier for multi-party chats
 * - sample_message_user: Example user input for few-shot learning
 * - sample_message_ai: Example model output for few-shot learning
 */
export type M2HerRole =
  | 'system'
  | 'user'
  | 'assistant'
  | 'user_system'
  | 'group'
  | 'sample_message_user'
  | 'sample_message_ai';

export interface M2HerMessage {
  role: M2HerRole;
  content: string;
  /** Optional name for distinguishing multiple instances of same role */
  name?: string;
}

export interface M2HerOptions {
  /** Model ID, defaults to 'M2-her' */
  model?: string;
  /** Enable streaming, defaults to false */
  stream?: boolean;
  /** Temperature (0, 1], defaults to 1.0 */
  temperature?: number;
  /** Top-p sampling (0, 1], defaults to 0.95 */
  topP?: number;
  /** Maximum output tokens (1-2048) */
  maxTokens?: number;
}

export interface M2HerResponse {
  id: string;
  object: 'chat.completion';
  created: number;
  choices: Array<{
    index: number;
    message: {
      role: 'assistant';
      content: string;
    };
    finish_reason: 'stop' | 'length' | 'content_filter';
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  input_sensitive?: boolean;
  output_sensitive?: boolean;
}

export interface M2HerStreamChunk {
  id: string;
  object: 'chat.completion.chunk';
  created: number;
  choices: Array<{
    index: number;
    delta: {
      role?: 'assistant';
      content?: string;
    };
    finish_reason: 'stop' | 'length' | 'content_filter' | null;
  }>;
}

export interface M2HerClientConfig {
  apiKey: string;
  apiHost?: string;
  defaultModel?: string;
  defaultTemperature?: number;
  defaultMaxTokens?: number;
  /** Use OpenRouter instead of MiniMax direct API (default: true) */
  useOpenRouter?: boolean;
  /** App name for OpenRouter tracking */
  appName?: string;
  /** App URL for OpenRouter tracking */
  appUrl?: string;
}

export class M2HerError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public responseBody?: unknown
  ) {
    super(message);
    this.name = 'M2HerError';
  }
}
