/**
 * OpenClaw Integration Package
 *
 * OpenClaw is a universal messaging gateway for AI agents supporting:
 * - WhatsApp (Baileys protocol)
 * - Telegram (grammY Bot API)
 * - Discord (discord.js)
 * - iMessage (macOS)
 * - Mattermost
 *
 * Gateway WebSocket: ws://127.0.0.1:18789
 * Dashboard: http://127.0.0.1:18789/
 *
 * Configuration (~/.openclaw/openclaw.json):
 * ```json
 * {
 *   "hooks": {
 *     "enabled": true,
 *     "token": "your-webhook-secret",
 *     "path": "/hooks"
 *   },
 *   "channels": {
 *     "whatsapp": {
 *       "allowFrom": ["*"],
 *       "webhook": "https://yourforks.app/api/webhook/openclaw"
 *     }
 *   }
 * }
 * ```
 */

// =============================================================================
// TYPES
// =============================================================================

export type Platform = 'whatsapp' | 'telegram' | 'discord' | 'imessage' | 'mattermost';

export type MediaType = 'image' | 'video' | 'audio' | 'document' | 'sticker';

/**
 * OpenClaw hooks configuration
 */
export interface OpenClawHooksConfig {
  enabled: boolean;
  token: string;
  path?: string; // defaults to '/hooks'
}

/**
 * Channel-specific configuration
 */
export interface ChannelConfig {
  enabled?: boolean;
  allowFrom?: string[];
  webhook?: string;
  requireMention?: boolean;
  // WhatsApp specific
  mediaMaxMb?: number;
  textChunkLimit?: number;
  ackReaction?: {
    emoji: string;
    direct?: boolean;
    group?: boolean;
  };
}

/**
 * Full OpenClaw configuration
 */
export interface OpenClawConfig {
  hooks?: OpenClawHooksConfig;
  channels: {
    whatsapp?: ChannelConfig;
    telegram?: ChannelConfig;
    discord?: ChannelConfig;
    imessage?: ChannelConfig;
    mattermost?: ChannelConfig;
  };
}

/**
 * Incoming message from OpenClaw webhook
 *
 * WhatsApp-specific features:
 * - Quoted replies: `[Replying to +1555 id:ABC123] <text> [/Replying]`
 * - Media placeholders: `<media:image|video|audio|document|sticker>`
 */
export interface IncomingMessage {
  /** Sender identifier (phone number for WhatsApp, username for others) */
  sender: string;
  /** Message content (may include quoted reply context) */
  message: string;
  /** Source platform */
  platform: Platform;
  /** Group/channel identifier if applicable */
  groupId?: string;
  /** ISO timestamp of the message */
  timestamp?: string;
  /** Platform-specific message ID */
  messageId?: string;
  /** ID of message being replied to */
  replyTo?: string;
  /** Media attachment info */
  media?: {
    type: MediaType;
    url?: string;
    mimeType?: string;
    filename?: string;
  };
  /** Whether this is a group message */
  isGroup?: boolean;
  /** Whether the bot was mentioned (for groups) */
  mentioned?: boolean;
}

/**
 * Outgoing response to OpenClaw
 */
export interface OutgoingResponse {
  /** Text reply (auto-chunked to 4000 chars for WhatsApp) */
  reply: string;
  /** Optional media attachment */
  media?: {
    type: MediaType;
    url: string;
    caption?: string;
    /** For GIFs, set to true with MP4 format */
    gifPlayback?: boolean;
  };
  /** Reply to a specific message */
  replyTo?: string;
}

/**
 * OpenClaw /hooks/agent request payload
 */
export interface AgentHookRequest {
  /** Agent prompt/message */
  message: string;
  /** Persistent conversation identifier */
  sessionKey?: string;
  /** Model override */
  model?: string;
  /** Target messaging platform */
  channel?: Platform;
  /** Recipient identifier */
  to?: string;
  /** Processing level override */
  thinking?: string;
  /** Execution timeout in seconds */
  timeoutSeconds?: number;
  /** Whether to deliver response to messaging channel */
  deliver?: boolean;
}

/**
 * OpenClaw /hooks/wake request payload
 */
export interface WakeHookRequest {
  /** Event description */
  text: string;
  /** Trigger mode */
  mode?: 'now' | 'next-heartbeat';
}

// =============================================================================
// AUTHENTICATION
// =============================================================================

/**
 * Verify webhook authentication token
 *
 * OpenClaw supports three authentication methods:
 * 1. Bearer token: `Authorization: Bearer <token>` (recommended)
 * 2. Custom header: `x-openclaw-token: <token>`
 * 3. Query parameter: `?token=<token>` (deprecated)
 *
 * @param request - The incoming request headers or token
 * @param expectedToken - The configured webhook token
 * @returns true if authenticated
 */
export function verifyWebhookAuth(
  headers: { get: (name: string) => string | null },
  expectedToken: string
): boolean {
  if (!expectedToken) return true; // No token configured = dev mode

  // Check Bearer token (recommended)
  const authHeader = headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7) === expectedToken;
  }

  // Check custom header
  const customToken = headers.get('x-openclaw-token');
  if (customToken) {
    return customToken === expectedToken;
  }

  return false;
}

/**
 * Legacy: Verify webhook signature using HMAC-SHA256
 * (Kept for backwards compatibility with custom setups)
 */
export async function verifyWebhookSignature(
  body: string,
  signature: string,
  secret: string
): Promise<boolean> {
  if (!secret) return true;
  if (!signature) return false;

  try {
    const expectedSignature = await generateSignature(body, secret);

    if (signature.length !== expectedSignature.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < signature.length; i++) {
      result |= signature.charCodeAt(i) ^ expectedSignature.charCodeAt(i);
    }
    return result === 0;
  } catch {
    return false;
  }
}

/**
 * Generate HMAC-SHA256 signature
 */
export async function generateSignature(body: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(body);

  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signatureBuffer = await crypto.subtle.sign('HMAC', key, messageData);
  const hashArray = Array.from(new Uint8Array(signatureBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// =============================================================================
// MESSAGE PARSING
// =============================================================================

/**
 * Parse quoted reply context from WhatsApp message
 *
 * WhatsApp messages include quoted replies in this format:
 * `[Replying to +1555 id:ABC123] quoted text [/Replying]`
 */
export function parseQuotedReply(message: string): {
  quotedSender?: string;
  quotedMessageId?: string;
  quotedText?: string;
  cleanMessage: string;
} {
  const replyPattern = /\[Replying to ([^\s]+) id:([^\]]+)\]\s*([\s\S]*?)\s*\[\/Replying\]/;
  const match = message.match(replyPattern);

  if (match) {
    return {
      quotedSender: match[1],
      quotedMessageId: match[2],
      quotedText: match[3].trim(),
      cleanMessage: message.replace(replyPattern, '').trim(),
    };
  }

  return { cleanMessage: message };
}

/**
 * Parse media placeholder from message
 *
 * OpenClaw represents media-only messages as: `<media:type>`
 */
export function parseMediaPlaceholder(message: string): {
  hasMedia: boolean;
  mediaType?: MediaType;
  cleanMessage: string;
} {
  const mediaPattern = /<media:(image|video|audio|document|sticker)>/g;
  const matches = [...message.matchAll(mediaPattern)];

  if (matches.length > 0) {
    return {
      hasMedia: true,
      mediaType: matches[0][1] as MediaType,
      cleanMessage: message.replace(mediaPattern, '').trim(),
    };
  }

  return { hasMedia: false, cleanMessage: message };
}

/**
 * Extract all context from an incoming message
 */
export function parseIncomingMessage(message: string): {
  cleanMessage: string;
  quotedReply?: {
    sender: string;
    messageId: string;
    text: string;
  };
  media?: {
    type: MediaType;
  };
} {
  const quoted = parseQuotedReply(message);
  const media = parseMediaPlaceholder(quoted.cleanMessage);

  return {
    cleanMessage: media.cleanMessage,
    quotedReply: quoted.quotedSender
      ? {
          sender: quoted.quotedSender,
          messageId: quoted.quotedMessageId!,
          text: quoted.quotedText!,
        }
      : undefined,
    media: media.hasMedia ? { type: media.mediaType! } : undefined,
  };
}

// =============================================================================
// PLATFORM ID UTILITIES
// =============================================================================

/**
 * Format a platform-specific user ID
 */
export function formatPlatformId(platform: Platform, sender: string): string {
  return `${platform}:${sender}`;
}

/**
 * Parse a platform ID into components
 */
export function parsePlatformId(platformId: string): {
  platform: Platform;
  sender: string;
} | null {
  const [platform, ...rest] = platformId.split(':');
  if (!platform || rest.length === 0) return null;

  const validPlatforms: Platform[] = ['whatsapp', 'telegram', 'discord', 'imessage', 'mattermost'];
  if (!validPlatforms.includes(platform as Platform)) return null;

  return { platform: platform as Platform, sender: rest.join(':') };
}

// =============================================================================
// RESPONSE UTILITIES
// =============================================================================

/**
 * Chunk text for WhatsApp (4000 char limit)
 */
export function chunkTextForWhatsApp(text: string, limit = 4000): string[] {
  if (text.length <= limit) return [text];

  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    if (remaining.length <= limit) {
      chunks.push(remaining);
      break;
    }

    // Try to break at a sentence or word boundary
    let breakPoint = remaining.lastIndexOf('. ', limit);
    if (breakPoint === -1 || breakPoint < limit * 0.5) {
      breakPoint = remaining.lastIndexOf(' ', limit);
    }
    if (breakPoint === -1 || breakPoint < limit * 0.5) {
      breakPoint = limit;
    }

    chunks.push(remaining.slice(0, breakPoint + 1).trim());
    remaining = remaining.slice(breakPoint + 1).trim();
  }

  return chunks;
}

/**
 * Format response for OpenClaw
 */
export function formatResponse(
  reply: string,
  options?: {
    media?: OutgoingResponse['media'];
    replyTo?: string;
    platform?: Platform;
  }
): OutgoingResponse {
  // Auto-chunk for WhatsApp if needed
  const chunks =
    options?.platform === 'whatsapp' ? chunkTextForWhatsApp(reply) : [reply];

  // For now, just return the first chunk (multi-chunk support would need webhook changes)
  return {
    reply: chunks[0],
    media: options?.media,
    replyTo: options?.replyTo,
  };
}

// =============================================================================
// CONFIGURATION GENERATION
// =============================================================================

/**
 * Generate OpenClaw configuration file content
 */
export function generateOpenClawConfig(config: OpenClawConfig): string {
  const output: Record<string, unknown> = {};

  if (config.hooks) {
    output.hooks = {
      enabled: config.hooks.enabled,
      token: config.hooks.token,
      ...(config.hooks.path && { path: config.hooks.path }),
    };
  }

  const channels: Record<string, unknown> = {};

  if (config.channels.whatsapp?.enabled !== false && config.channels.whatsapp?.webhook) {
    channels.whatsapp = {
      allowFrom: config.channels.whatsapp.allowFrom || ['*'],
      webhook: config.channels.whatsapp.webhook,
      ...(config.channels.whatsapp.mediaMaxMb && {
        mediaMaxMb: config.channels.whatsapp.mediaMaxMb,
      }),
      ...(config.channels.whatsapp.textChunkLimit && {
        textChunkLimit: config.channels.whatsapp.textChunkLimit,
      }),
      ...(config.channels.whatsapp.ackReaction && {
        ackReaction: config.channels.whatsapp.ackReaction,
      }),
    };
  }

  if (config.channels.telegram?.enabled !== false && config.channels.telegram?.webhook) {
    channels.telegram = {
      webhook: config.channels.telegram.webhook,
    };
  }

  if (config.channels.discord?.enabled !== false && config.channels.discord?.webhook) {
    channels.discord = {
      webhook: config.channels.discord.webhook,
      requireMention: config.channels.discord.requireMention ?? true,
    };
  }

  if (Object.keys(channels).length > 0) {
    output.channels = channels;
  }

  return JSON.stringify(output, null, 2);
}

// =============================================================================
// COMMAND PARSING
// =============================================================================

/**
 * Parse bot commands from message
 * Commands: /start, /help, /new, /list, /switch
 */
export function parseCommand(message: string): {
  isCommand: boolean;
  command?: string;
  args?: string;
} {
  const trimmed = message.trim().toLowerCase();

  const commands = ['start', 'help', 'new', 'list', 'switch'];
  for (const cmd of commands) {
    if (trimmed === `/${cmd}` || trimmed === cmd) {
      return { isCommand: true, command: cmd };
    }
    if (trimmed.startsWith(`/${cmd} `) || trimmed.startsWith(`${cmd} `)) {
      const prefix = trimmed.startsWith('/') ? `/${cmd} ` : `${cmd} `;
      return {
        isCommand: true,
        command: cmd,
        args: message.slice(prefix.length).trim(),
      };
    }
  }

  // Check for fork-like descriptions
  if (
    trimmed.includes('new fork') ||
    trimmed.includes('create fork') ||
    trimmed.includes('what if')
  ) {
    return { isCommand: true, command: 'new', args: message };
  }

  return { isCommand: false };
}
