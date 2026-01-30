#!/usr/bin/env npx tsx
/**
 * OpenClaw Integration Test Script
 *
 * Tests all OpenClaw utilities:
 * - Token-based authentication
 * - Message parsing (quoted replies, media placeholders)
 * - Text chunking for WhatsApp
 * - Command parsing
 * - Platform ID formatting
 * - Response formatting
 *
 * Run with: npx tsx scripts/test-openclaw.ts
 */

import {
  verifyWebhookAuth,
  verifyWebhookSignature,
  generateSignature,
  parseQuotedReply,
  parseMediaPlaceholder,
  parseIncomingMessage,
  formatPlatformId,
  parsePlatformId,
  chunkTextForWhatsApp,
  formatResponse,
  parseCommand,
  generateOpenClawConfig,
} from '../packages/openclaw/src/index';

// ANSI color codes for output
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

function log(message: string, color = RESET) {
  console.log(`${color}${message}${RESET}`);
}

function section(title: string) {
  console.log();
  log(`${'='.repeat(60)}`, CYAN);
  log(`${BOLD}${title}${RESET}`, CYAN);
  log(`${'='.repeat(60)}`, CYAN);
}

function test(name: string, fn: () => boolean | Promise<boolean>) {
  return { name, fn };
}

async function runTests() {
  const tests = [
    // Authentication Tests
    test('verifyWebhookAuth: Bearer token', () => {
      const mockHeaders = {
        get: (name: string) => {
          if (name === 'authorization') return 'Bearer my-secret-token';
          return null;
        },
      };
      return verifyWebhookAuth(mockHeaders, 'my-secret-token');
    }),

    test('verifyWebhookAuth: Custom header', () => {
      const mockHeaders = {
        get: (name: string) => {
          if (name === 'x-openclaw-token') return 'my-secret-token';
          return null;
        },
      };
      return verifyWebhookAuth(mockHeaders, 'my-secret-token');
    }),

    test('verifyWebhookAuth: Invalid token fails', () => {
      const mockHeaders = {
        get: (name: string) => {
          if (name === 'authorization') return 'Bearer wrong-token';
          return null;
        },
      };
      return !verifyWebhookAuth(mockHeaders, 'my-secret-token');
    }),

    test('verifyWebhookAuth: No token = dev mode (passes)', () => {
      const mockHeaders = { get: () => null };
      return verifyWebhookAuth(mockHeaders, '');
    }),

    test('verifyWebhookAuth: Missing header fails', () => {
      const mockHeaders = { get: () => null };
      return !verifyWebhookAuth(mockHeaders, 'my-secret-token');
    }),

    // Legacy HMAC Signature Tests
    test('generateSignature + verifyWebhookSignature', async () => {
      const body = '{"sender":"123","message":"hello"}';
      const secret = 'test-secret';
      const signature = await generateSignature(body, secret);
      return await verifyWebhookSignature(body, signature, secret);
    }),

    test('verifyWebhookSignature: Invalid signature fails', async () => {
      const body = '{"sender":"123","message":"hello"}';
      const secret = 'test-secret';
      return !(await verifyWebhookSignature(body, 'invalid-sig', secret));
    }),

    // Quoted Reply Parsing Tests
    test('parseQuotedReply: Extracts quoted reply', () => {
      const message = '[Replying to +15551234567 id:ABC123] Original message text [/Replying] My reply to that';
      const result = parseQuotedReply(message);
      return (
        result.quotedSender === '+15551234567' &&
        result.quotedMessageId === 'ABC123' &&
        result.quotedText === 'Original message text' &&
        result.cleanMessage === 'My reply to that'
      );
    }),

    test('parseQuotedReply: No quote returns clean message', () => {
      const message = 'Just a regular message';
      const result = parseQuotedReply(message);
      return (
        result.quotedSender === undefined &&
        result.cleanMessage === 'Just a regular message'
      );
    }),

    // Media Placeholder Parsing Tests
    test('parseMediaPlaceholder: Detects image', () => {
      const message = '<media:image> Check this out!';
      const result = parseMediaPlaceholder(message);
      return (
        result.hasMedia === true &&
        result.mediaType === 'image' &&
        result.cleanMessage === 'Check this out!'
      );
    }),

    test('parseMediaPlaceholder: Detects video', () => {
      const message = '<media:video>';
      const result = parseMediaPlaceholder(message);
      return result.hasMedia === true && result.mediaType === 'video';
    }),

    test('parseMediaPlaceholder: No media returns false', () => {
      const message = 'Regular text message';
      const result = parseMediaPlaceholder(message);
      return result.hasMedia === false && result.cleanMessage === 'Regular text message';
    }),

    // Combined Message Parsing Tests
    test('parseIncomingMessage: Combined quote + media', () => {
      const message = '[Replying to +123 id:XYZ] hey [/Replying] <media:image> look at this';
      const result = parseIncomingMessage(message);
      return (
        result.quotedReply?.sender === '+123' &&
        result.media?.type === 'image' &&
        result.cleanMessage === 'look at this'
      );
    }),

    // Platform ID Tests
    test('formatPlatformId: Creates correct format', () => {
      return formatPlatformId('whatsapp', '+15551234567') === 'whatsapp:+15551234567';
    }),

    test('parsePlatformId: Parses valid ID', () => {
      const result = parsePlatformId('telegram:user123');
      return result?.platform === 'telegram' && result?.sender === 'user123';
    }),

    test('parsePlatformId: Handles colons in sender', () => {
      const result = parsePlatformId('discord:user:with:colons');
      return result?.platform === 'discord' && result?.sender === 'user:with:colons';
    }),

    test('parsePlatformId: Invalid platform returns null', () => {
      return parsePlatformId('invalid:user123') === null;
    }),

    // Text Chunking Tests
    test('chunkTextForWhatsApp: Short text unchanged', () => {
      const text = 'Short message';
      const chunks = chunkTextForWhatsApp(text);
      return chunks.length === 1 && chunks[0] === text;
    }),

    test('chunkTextForWhatsApp: Long text chunked at sentences', () => {
      const text = 'A'.repeat(3000) + '. ' + 'B'.repeat(3000);
      const chunks = chunkTextForWhatsApp(text);
      return chunks.length === 2 && chunks[0].endsWith('.');
    }),

    test('chunkTextForWhatsApp: Respects custom limit', () => {
      const text = 'Hello world this is a test message';
      const chunks = chunkTextForWhatsApp(text, 20);
      return chunks.length > 1;
    }),

    // Response Formatting Tests
    test('formatResponse: Basic response', () => {
      const response = formatResponse('Hello!');
      return response.reply === 'Hello!' && response.media === undefined;
    }),

    test('formatResponse: With media', () => {
      const response = formatResponse('Check this!', {
        media: { type: 'image', url: 'https://example.com/img.jpg' },
      });
      return response.reply === 'Check this!' && response.media?.url === 'https://example.com/img.jpg';
    }),

    test('formatResponse: With replyTo', () => {
      const response = formatResponse('Reply', { replyTo: 'MSG123' });
      return response.replyTo === 'MSG123';
    }),

    // Command Parsing Tests
    test('parseCommand: /start command', () => {
      const result = parseCommand('/start');
      return result.isCommand && result.command === 'start';
    }),

    test('parseCommand: start without slash', () => {
      const result = parseCommand('start');
      return result.isCommand && result.command === 'start';
    }),

    test('parseCommand: /new with args', () => {
      const result = parseCommand('/new I chose tech over medicine');
      return (
        result.isCommand &&
        result.command === 'new' &&
        result.args === 'I chose tech over medicine'
      );
    }),

    test('parseCommand: Natural language "new fork"', () => {
      const result = parseCommand('create new fork about my career');
      return result.isCommand && result.command === 'new';
    }),

    test('parseCommand: "what if" triggers new fork', () => {
      const result = parseCommand('What if I had moved to Japan?');
      return result.isCommand && result.command === 'new';
    }),

    test('parseCommand: Regular message is not a command', () => {
      const result = parseCommand('Hello, how are you?');
      return result.isCommand === false;
    }),

    test('parseCommand: Case insensitive', () => {
      const result = parseCommand('/HELP');
      return result.isCommand && result.command === 'help';
    }),

    // Config Generation Tests
    test('generateOpenClawConfig: Generates valid JSON', () => {
      const config = generateOpenClawConfig({
        hooks: { enabled: true, token: 'secret123' },
        channels: {
          whatsapp: {
            webhook: 'https://example.com/webhook',
            allowFrom: ['*'],
          },
        },
      });
      const parsed = JSON.parse(config);
      return (
        parsed.hooks.enabled === true &&
        parsed.channels.whatsapp.webhook === 'https://example.com/webhook'
      );
    }),

    test('generateOpenClawConfig: Includes ackReaction when set', () => {
      const config = generateOpenClawConfig({
        channels: {
          whatsapp: {
            webhook: 'https://example.com/webhook',
            ackReaction: { emoji: '👀', direct: true, group: false },
          },
        },
      });
      const parsed = JSON.parse(config);
      return parsed.channels.whatsapp.ackReaction.emoji === '👀';
    }),
  ];

  section('OpenClaw Integration Tests');
  console.log();

  let passed = 0;
  let failed = 0;

  for (const { name, fn } of tests) {
    try {
      const result = await fn();
      if (result) {
        log(`  ✓ ${name}`, GREEN);
        passed++;
      } else {
        log(`  ✗ ${name}`, RED);
        failed++;
      }
    } catch (error) {
      log(`  ✗ ${name}`, RED);
      log(`    Error: ${error instanceof Error ? error.message : String(error)}`, RED);
      failed++;
    }
  }

  section('Test Summary');
  console.log();
  log(`  Passed: ${passed}`, GREEN);
  if (failed > 0) {
    log(`  Failed: ${failed}`, RED);
  }
  log(`  Total:  ${passed + failed}`, CYAN);
  console.log();

  // Demonstrate real-world usage
  section('Usage Examples');
  console.log();

  log('1. Webhook Authentication:', YELLOW);
  console.log(`   const mockHeaders = { get: (n) => n === 'authorization' ? 'Bearer secret' : null };`);
  console.log(`   verifyWebhookAuth(mockHeaders, 'secret') // true`);
  console.log();

  log('2. Message Parsing:', YELLOW);
  const exampleMessage = '[Replying to +123 id:ABC] old text [/Replying] <media:image> new reply';
  const parsed = parseIncomingMessage(exampleMessage);
  console.log(`   Input:  "${exampleMessage}"`);
  console.log(`   Output: ${JSON.stringify(parsed, null, 2).split('\n').join('\n           ')}`);
  console.log();

  log('3. WhatsApp Text Chunking:', YELLOW);
  const longText = 'Lorem ipsum '.repeat(400);
  const chunks = chunkTextForWhatsApp(longText);
  console.log(`   Input:  ${longText.length} chars`);
  console.log(`   Output: ${chunks.length} chunks (${chunks.map(c => c.length + ' chars').join(', ')})`);
  console.log();

  log('4. Command Parsing:', YELLOW);
  console.log(`   parseCommand('/start')           -> { isCommand: true, command: 'start' }`);
  console.log(`   parseCommand('What if I stayed') -> { isCommand: true, command: 'new', args: '...' }`);
  console.log(`   parseCommand('Hello!')           -> { isCommand: false }`);
  console.log();

  return failed === 0;
}

// Run tests
runTests()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });
