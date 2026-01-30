import type {
  M2HerClientConfig,
  M2HerMessage,
  M2HerOptions,
  M2HerResponse,
  M2HerStreamChunk,
} from './types';
import { M2HerError } from './types';

// OpenRouter configuration
const OPENROUTER_API_HOST = 'https://openrouter.ai/api/v1';
const OPENROUTER_MODEL = 'minimax/minimax-m2-her';

// Legacy MiniMax direct API (fallback)
const MINIMAX_API_HOST = 'https://api.minimax.io';
const MINIMAX_MODEL = 'M2-her';
const MINIMAX_ENDPOINT = '/v1/text/chatcompletion_v2';

export class M2HerClient {
  private apiKey: string;
  private apiHost: string;
  private defaultModel: string;
  private defaultTemperature: number;
  private defaultMaxTokens: number;
  private useOpenRouter: boolean;
  private appName?: string;
  private appUrl?: string;

  constructor(config: M2HerClientConfig) {
    this.apiKey = config.apiKey;
    this.useOpenRouter = config.useOpenRouter ?? true;

    if (this.useOpenRouter) {
      this.apiHost = config.apiHost || OPENROUTER_API_HOST;
      this.defaultModel = config.defaultModel || OPENROUTER_MODEL;
    } else {
      this.apiHost = config.apiHost || MINIMAX_API_HOST;
      this.defaultModel = config.defaultModel || MINIMAX_MODEL;
    }

    this.defaultTemperature = config.defaultTemperature || 1.0;
    this.defaultMaxTokens = config.defaultMaxTokens || 2048;
    this.appName = config.appName;
    this.appUrl = config.appUrl;
  }

  /**
   * Send a chat completion request (non-streaming)
   */
  async chat(
    messages: M2HerMessage[],
    options?: M2HerOptions
  ): Promise<string> {
    const response = await this.request(messages, { ...options, stream: false });
    const data = (await response.json()) as M2HerResponse;

    if (!data.choices?.[0]?.message?.content) {
      throw new M2HerError('No content in response', undefined, data);
    }

    return data.choices[0].message.content;
  }

  /**
   * Send a chat completion request with streaming
   */
  async *chatStream(
    messages: M2HerMessage[],
    options?: M2HerOptions
  ): AsyncGenerator<string, void, unknown> {
    const response = await this.request(messages, { ...options, stream: true });

    if (!response.body) {
      throw new M2HerError('No response body for streaming');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim() || !line.startsWith('data: ')) continue;

          const data = line.slice(6).trim();
          if (data === '[DONE]') return;

          try {
            const chunk = JSON.parse(data) as M2HerStreamChunk;
            const content = chunk.choices?.[0]?.delta?.content;
            if (content) {
              yield content;
            }
          } catch {
            // Skip malformed chunks
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Send a chat completion request and return the full response object
   */
  async chatWithMetadata(
    messages: M2HerMessage[],
    options?: M2HerOptions
  ): Promise<M2HerResponse> {
    const response = await this.request(messages, { ...options, stream: false });
    return response.json() as Promise<M2HerResponse>;
  }

  /**
   * Build messages for a fork conversation
   *
   * @param personaPrompt - The alternate self persona (system role)
   * @param userContext - Context about the "real" user (user_system role)
   * @param history - Previous messages in the conversation
   * @param newMessage - The new user message
   * @param options - Additional options including alternate self name and sample messages
   */
  buildForkMessages(
    personaPrompt: string,
    userContext: string | null,
    history: Array<{ role: 'user' | 'alternate_self'; content: string }>,
    newMessage: string,
    options?: {
      /** Name of the alternate self (e.g., "Berlin You", "Dr. Sarah") */
      alternateSelfName?: string;
      /** Name of the user for personalization */
      userName?: string;
      /** Few-shot examples for voice calibration */
      sampleMessages?: Array<{ user: string; ai: string }>;
    }
  ): M2HerMessage[] {
    const messages: M2HerMessage[] = [];

    // System prompt (alternate self persona) with optional name
    messages.push({
      role: 'system',
      content: personaPrompt,
      ...(options?.alternateSelfName && { name: options.alternateSelfName }),
    });

    // User context (the "real you") with optional name
    if (userContext) {
      messages.push({
        role: 'user_system',
        content: userContext,
        ...(options?.userName && { name: options.userName }),
      });
    }

    // Few-shot examples (if provided)
    if (options?.sampleMessages) {
      for (const sample of options.sampleMessages) {
        messages.push({
          role: 'sample_message_user',
          content: sample.user,
          ...(options?.userName && { name: options.userName }),
        });
        messages.push({
          role: 'sample_message_ai',
          content: sample.ai,
          ...(options?.alternateSelfName && { name: options.alternateSelfName }),
        });
      }
    }

    // Conversation history
    for (const msg of history) {
      messages.push({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content,
        // Add name to assistant messages for better character consistency
        ...(msg.role === 'alternate_self' && options?.alternateSelfName && {
          name: options.alternateSelfName,
        }),
      });
    }

    // New user message
    messages.push({ role: 'user', content: newMessage });

    return messages;
  }

  /**
   * Convert M2-Her special roles to standard OpenAI roles for OpenRouter compatibility.
   *
   * OpenRouter doesn't support M2-Her's special roles (user_system, sample_message_*, group),
   * so we need to convert them:
   * - user_system -> merged into system message
   * - sample_message_user -> user
   * - sample_message_ai -> assistant
   * - group -> ignored (not supported via OpenRouter)
   */
  private convertMessagesForOpenRouter(messages: M2HerMessage[]): Array<{
    role: string;
    content: string;
    name?: string;
  }> {
    const result: Array<{ role: string; content: string; name?: string }> = [];

    // Find system and user_system messages to merge
    const systemMsg = messages.find((m) => m.role === 'system');
    const userSystemMsg = messages.find((m) => m.role === 'user_system');

    // Create combined system message
    if (systemMsg || userSystemMsg) {
      let systemContent = '';

      if (systemMsg) {
        systemContent = systemMsg.content;
      }

      if (userSystemMsg) {
        systemContent += `\n\n[User Context: ${userSystemMsg.content}]`;
      }

      result.push({
        role: 'system',
        content: systemContent.trim(),
        ...(systemMsg?.name && { name: systemMsg.name }),
      });
    }

    // Convert remaining messages
    for (const msg of messages) {
      // Skip already processed messages
      if (msg.role === 'system' || msg.role === 'user_system') {
        continue;
      }

      // Skip group messages (not supported via OpenRouter)
      if (msg.role === 'group') {
        continue;
      }

      // Convert sample messages to standard roles
      let convertedRole: string;
      switch (msg.role) {
        case 'sample_message_user':
          convertedRole = 'user';
          break;
        case 'sample_message_ai':
          convertedRole = 'assistant';
          break;
        default:
          convertedRole = msg.role;
      }

      result.push({
        role: convertedRole,
        content: msg.content,
        ...(msg.name && { name: msg.name }),
      });
    }

    return result;
  }

  private async request(
    messages: M2HerMessage[],
    options?: M2HerOptions
  ): Promise<Response> {
    const model = options?.model || this.defaultModel;

    // OpenRouter uses OpenAI-compatible API
    const url = this.useOpenRouter
      ? `${this.apiHost}/chat/completions`
      : `${this.apiHost}${MINIMAX_ENDPOINT}`;

    // Convert messages for OpenRouter (special roles not supported)
    const processedMessages = this.useOpenRouter
      ? this.convertMessagesForOpenRouter(messages)
      : messages.map((m) => ({
          role: m.role,
          content: m.content,
          ...(m.name && { name: m.name }),
        }));

    const body: Record<string, unknown> = {
      model,
      messages: processedMessages,
      stream: options?.stream ?? false,
      temperature: options?.temperature ?? this.defaultTemperature,
      top_p: options?.topP ?? 0.95,
      max_tokens: options?.maxTokens ?? this.defaultMaxTokens,
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.apiKey}`,
    };

    // OpenRouter specific headers
    if (this.useOpenRouter) {
      if (this.appName) {
        headers['X-Title'] = this.appName;
      }
      if (this.appUrl) {
        headers['HTTP-Referer'] = this.appUrl;
      }
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new M2HerError(
        `API error: ${response.status} ${response.statusText}`,
        response.status,
        errorBody
      );
    }

    return response;
  }
}

/**
 * Create an M2-Her client from environment variables
 *
 * By default, uses OpenRouter. Set MINIMAX_API_KEY and USE_MINIMAX_DIRECT=true
 * to use MiniMax API directly.
 */
export function createM2HerClient(config?: Partial<M2HerClientConfig>): M2HerClient {
  const useOpenRouter = config?.useOpenRouter ??
    (process.env.USE_MINIMAX_DIRECT !== 'true');

  const apiKey = config?.apiKey ||
    (useOpenRouter ? process.env.OPENROUTER_API_KEY : process.env.MINIMAX_API_KEY);

  if (!apiKey) {
    const keyName = useOpenRouter ? 'OPENROUTER_API_KEY' : 'MINIMAX_API_KEY';
    throw new Error(`${keyName} is required`);
  }

  return new M2HerClient({
    apiKey,
    apiHost: config?.apiHost,
    defaultModel: config?.defaultModel,
    defaultTemperature: config?.defaultTemperature,
    defaultMaxTokens: config?.defaultMaxTokens,
    useOpenRouter,
    appName: config?.appName || process.env.OPENROUTER_APP_NAME || 'Forks',
    appUrl: config?.appUrl || process.env.NEXT_PUBLIC_APP_URL,
  });
}
