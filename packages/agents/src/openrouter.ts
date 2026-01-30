/**
 * OpenRouter Client for Agents
 *
 * Provides a unified interface for calling Claude models via OpenRouter.
 * Falls back to Anthropic SDK if ANTHROPIC_API_KEY is set and USE_OPENROUTER is false.
 */

// OpenRouter model mappings
export const MODELS = {
  // Claude models via OpenRouter
  sonnet: 'anthropic/claude-sonnet-4',
  opus: 'anthropic/claude-opus-4.5',
  haiku: 'anthropic/claude-haiku-4.5',

  // Default for agents is Opus 4.5
  default: 'anthropic/claude-opus-4.5',
} as const;

export type ModelName = keyof typeof MODELS;

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatOptions {
  model?: ModelName | string;
  maxTokens?: number;
  temperature?: number;
  jsonMode?: boolean;  // Force valid JSON output
}

interface ChatResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

interface OpenRouterConfig {
  apiKey?: string;
  appName?: string;
  appUrl?: string;
}

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

/**
 * Create a chat completion via OpenRouter
 */
export async function chat(
  messages: Message[],
  options: ChatOptions = {},
  config: OpenRouterConfig = {}
): Promise<ChatResponse> {
  const apiKey = config.apiKey || process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is required');
  }

  // Resolve model name - default to Opus 4.5
  let model = options.model || 'opus';
  if (model in MODELS) {
    model = MODELS[model as ModelName];
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  };

  // OpenRouter specific headers
  const appName = config.appName || process.env.OPENROUTER_APP_NAME || 'Forks';
  const appUrl = config.appUrl || process.env.NEXT_PUBLIC_APP_URL;

  if (appName) {
    headers['X-Title'] = appName;
  }
  if (appUrl) {
    headers['HTTP-Referer'] = appUrl;
  }

  const requestBody: Record<string, unknown> = {
    model,
    messages,
    max_tokens: options.maxTokens || 4096,
    temperature: options.temperature ?? 0.7,
  };

  // Add JSON mode if requested - forces valid JSON output
  if (options.jsonMode) {
    requestBody.response_format = { type: 'json_object' };
    console.log('[OpenRouter] JSON mode enabled for request');
  }

  console.log('[OpenRouter] Request model:', model, 'maxTokens:', options.maxTokens);

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();

  if (!data.choices?.[0]?.message?.content) {
    throw new Error('No content in OpenRouter response');
  }

  return {
    content: data.choices[0].message.content,
    usage: data.usage
      ? {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens,
        }
      : undefined,
  };
}

/**
 * Simple wrapper for single-turn completions
 */
export async function complete(
  prompt: string,
  options: ChatOptions = {},
  config: OpenRouterConfig = {}
): Promise<string> {
  const response = await chat(
    [{ role: 'user', content: prompt }],
    options,
    config
  );
  return response.content;
}

/**
 * Extract JSON from a response that might contain other text
 * Handles nested objects and common LLM formatting issues
 */
export function extractJson<T>(text: string): T {
  // Pre-sanitize: replace problematic Unicode characters
  let sanitized = text
    .replace(/[\u2018\u2019]/g, "'")  // Smart single quotes
    .replace(/[\u201C\u201D]/g, '"')  // Smart double quotes
    .replace(/\u2014/g, '-')          // Em dash
    .replace(/\u2013/g, '-')          // En dash
    .replace(/\u2026/g, '...')        // Ellipsis
    .replace(/[\u0000-\u001F]/g, (c) => {  // Control characters
      if (c === '\n' || c === '\r' || c === '\t') return c;
      return '';
    });

  // Strategy 1: Try direct parse (if response is clean JSON)
  try {
    return JSON.parse(sanitized.trim());
  } catch {
    // Continue to other strategies
  }

  // Strategy 2: Strip markdown code blocks and try again
  const jsonBlockMatch = sanitized.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonBlockMatch) {
    try {
      return JSON.parse(jsonBlockMatch[1].trim());
    } catch {
      // Continue
    }
  }

  // Strategy 3: Find JSON by locating first { and last }
  const firstBrace = sanitized.indexOf('{');
  const lastBrace = sanitized.lastIndexOf('}');

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error(`No valid JSON object found. Text preview: ${text.slice(0, 300)}`);
  }

  let jsonStr = sanitized.slice(firstBrace, lastBrace + 1);

  // Strategy 4: Try parsing the extracted JSON
  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    console.log('[extractJson] Initial extraction failed:', (e as Error).message);
  }

  // Strategy 5: Fix common LLM JSON issues
  jsonStr = fixCommonJsonIssues(jsonStr);

  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    console.log('[extractJson] After fixes still failing:', (e as Error).message);
  }

  // Strategy 6: Aggressive cleanup - escape unescaped quotes in string values
  jsonStr = aggressiveJsonFix(sanitized.slice(firstBrace, lastBrace + 1));

  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    const errorMsg = (e as Error).message;
    const posMatch = errorMsg.match(/position (\d+)/);
    const pos = posMatch ? parseInt(posMatch[1]) : 0;

    throw new Error(
      `Failed to parse JSON after all strategies: ${errorMsg}\n` +
      `Context around error:\n${jsonStr.slice(Math.max(0, pos - 100), pos + 100)}\n\n` +
      `First 500 chars:\n${jsonStr.slice(0, 500)}`
    );
  }
}

/**
 * Fix common JSON issues from LLM outputs
 */
function fixCommonJsonIssues(json: string): string {
  let fixed = json;

  // Remove trailing commas before } or ]
  fixed = fixed.replace(/,(\s*[}\]])/g, '$1');

  // Remove any BOM or zero-width characters
  fixed = fixed.replace(/[\uFEFF\u200B-\u200D\u2028\u2029]/g, '');

  // Fix single quotes used as string delimiters (careful not to break apostrophes)
  // This is tricky - only do it for obvious cases like {'key': 'value'}
  fixed = fixed.replace(/:\s*'([^']*)'/g, ': "$1"');
  fixed = fixed.replace(/\[\s*'([^']*)'/g, '["$1"');
  fixed = fixed.replace(/',\s*'/g, '", "');
  fixed = fixed.replace(/'\s*\]/g, '"]');

  return fixed;
}

/**
 * Aggressive JSON fix - handles unescaped quotes and other issues
 */
function aggressiveJsonFix(json: string): string {
  // This approach: rebuild the JSON string by string, properly escaping
  const result: string[] = [];
  let i = 0;
  let inString = false;
  let stringStart = -1;

  while (i < json.length) {
    const char = json[i];

    if (!inString) {
      result.push(char);
      if (char === '"') {
        inString = true;
        stringStart = i;
      }
    } else {
      // We're inside a string
      if (char === '\\' && i + 1 < json.length) {
        // Escape sequence - keep as is
        result.push(char);
        result.push(json[i + 1]);
        i += 2;
        continue;
      }

      if (char === '"') {
        // Is this the end of the string or an unescaped quote?
        // Look ahead to see if this looks like end of string
        const afterQuote = json.slice(i + 1).trimStart();
        if (
          afterQuote.startsWith(',') ||
          afterQuote.startsWith('}') ||
          afterQuote.startsWith(']') ||
          afterQuote.startsWith(':') ||
          afterQuote.length === 0
        ) {
          // This is the end of the string
          result.push(char);
          inString = false;
        } else {
          // This is an unescaped quote inside the string - escape it
          result.push('\\');
          result.push(char);
        }
      } else if (char === '\n') {
        // Newlines in strings should be escaped
        result.push('\\n');
      } else if (char === '\r') {
        result.push('\\r');
      } else if (char === '\t') {
        result.push('\\t');
      } else {
        result.push(char);
      }
    }
    i++;
  }

  return result.join('');
}
