# Forks - AI Agent Documentation

## Project Overview

Forks is an AI-powered application that creates alternate versions of users ("alternate selves") based on life decisions they didn't make. Users can then have conversations with these AI-generated personas.

## Architecture

### Monorepo Structure (Turborepo + pnpm)

```
forks/
├── apps/web/          # Next.js 15 frontend + API routes
├── packages/
│   ├── agents/        # Context Engineering Pipeline (Claude via OpenRouter)
│   ├── m2her/         # MiniMax M2-Her client (via OpenRouter)
│   ├── db/            # SQLite + Drizzle ORM database layer
│   ├── shared/        # Shared types and utilities
│   └── openclaw/      # OpenClaw messaging integration
```

### Key Technologies

- **OpenRouter**: Unified API gateway for all LLM calls
- **MiniMax M2-Her**: Roleplay-optimized LLM with 7 message roles
- **Anthropic Claude**: Powers the Context Engineering Pipeline
- **SQLite + Drizzle ORM**: Local database with type-safe queries
- **Next.js 15**: App Router with streaming responses
- **OpenClaw**: WhatsApp/Telegram gateway

## OpenRouter Integration

All LLM calls go through OpenRouter for simplified API management:

### Models Used

| Purpose | OpenRouter Model ID | Description |
|---------|---------------------|-------------|
| Interview Agent | `anthropic/claude-opus-4.5` | Empathetic context extraction |
| Research Agent | `anthropic/claude-opus-4.5` | Factual grounding |
| Persona Architect | `anthropic/claude-opus-4.5` | Character synthesis |
| Chat (M2-Her) | `minimax/minimax-m2-her` | Roleplay conversations |

### Why OpenRouter?

- **Single API key** for all models (Claude + MiniMax)
- **Cost tracking** and usage analytics
- **Fallback providers** if one is unavailable
- **Rate limiting** and load balancing

## Context Engineering Pipeline

The core differentiator - three agents that create rich, researched personas:

### 1. Interview Agent (`packages/agents/src/interview/`)
- **Model**: Claude Opus 4.5 via OpenRouter (`anthropic/claude-opus-4.5`)
- **Purpose**: Extract emotional context, hidden motivations, unstated questions
- **Input**: User's fork description (free text)
- **Output**: Structured `InterviewOutput` with fork point, emotional context, user profile
- **Research-backed**: Uses psychological archetypes (RECKONING, ESCAPE_FANTASY, etc.)
- **Max Tokens**: 4,096

### 2. Research Agent (`packages/agents/src/research/`)
- **Model**: Claude Opus 4.5 via OpenRouter (`anthropic/claude-opus-4.5`)
- **Purpose**: Gather factual grounding for the alternate timeline using web search
- **Input**: Interview output + detected fork type
- **Output**: `ResearchOutput` with timeline events, voice cues, world details
- **Research-backed**: Uses authenticity anchors for believability
- **Max Tokens**: 4,096
- **Web Search**: Researches real companies, locations, industries for authentic details

### 3. Persona Architect (`packages/agents/src/architect/`)
- **Model**: Claude Opus 4.5 via OpenRouter (`anthropic/claude-opus-4.5`)
- **Purpose**: Synthesize into a 2000-3000 token character prompt
- **Input**: Interview + Research outputs
- **Output**: `PersonaOutput` with full M2-Her prompt, summary, questions
- **Research-backed**: Uses Big Five personality, drift prevention techniques
- **Max Tokens**: 16,384

### Context Engineering (`packages/agents/src/context-engineering.ts`)
Research-backed utilities from:
- PersonaLLM (MIT): Big Five personality simulation
- Anthropic Persona Vectors: Drift prevention
- LoCoMo: Long-term conversational memory

### Pipeline Orchestrator (`packages/agents/src/pipeline.ts`)
- Runs agents sequentially with progress callbacks
- Returns complete persona ready for M2-Her

### OpenRouter Client (`packages/agents/src/openrouter.ts`)
```typescript
import { chat, extractJson, MODELS } from './openrouter';

// Default model is Claude Opus 4.5
const response = await chat(
  [{ role: 'user', content: prompt }],
  { model: 'opus', maxTokens: 4096 }  // 'opus' = anthropic/claude-opus-4.5
);

const data = extractJson<MyType>(response.content);
```

### Available Models
```typescript
export const MODELS = {
  opus: 'anthropic/claude-opus-4.5',    // Default - highest quality
  sonnet: 'anthropic/claude-sonnet-4',  // Faster, cheaper
  haiku: 'anthropic/claude-haiku-4.5',  // Fastest
} as const;
```

## M2-Her Integration

### Message Roles

M2-Her supports 7 specialized roles for character conversations:

| Role | Usage in Forks |
|------|----------------|
| `system` | The alternate self's persona prompt |
| `user` | User's messages |
| `assistant` | Alternate self's responses |
| `user_system` | Context about the "real" user |
| `group` | Multi-party conversations (future: Council mode) |
| `sample_message_user` | Few-shot examples (user side) |
| `sample_message_ai` | Few-shot examples (AI side) |

### Client Usage

```typescript
import { createM2HerClient } from '@forks/m2her';

// Creates client using OPENROUTER_API_KEY by default
const client = createM2HerClient();

// Build messages for a fork conversation
const messages = client.buildForkMessages(
  fork.personaPrompt,    // system role
  fork.userContext,      // user_system role
  conversationHistory,   // user/assistant roles
  newUserMessage,        // user role
  {
    alternateSelfName: fork.alternateSelfName,  // Character name for consistency
    userName: 'User',                            // Optional user name
    sampleMessages: [                            // Few-shot examples
      { user: 'How are you?', ai: 'Living the Berlin dream!' }
    ]
  }
);

// Stream response
for await (const chunk of client.chatStream(messages)) {
  // Handle streaming text
}
```

### Direct MiniMax Access (Optional)

If you need to bypass OpenRouter:

```typescript
const client = createM2HerClient({
  useOpenRouter: false,
  apiKey: process.env.MINIMAX_API_KEY,
});
```

## Database (SQLite + Drizzle ORM)

Local SQLite database for fast development. Can migrate to PostgreSQL later.

### Schema (`packages/db/src/schema.ts`)

```typescript
// Tables: users, forks, messages
import { users, forks, messages } from '@forks/db';

// Type-safe queries
const user = await users.findOrCreate(platformId);
const fork = await forks.create({ userId, forkDescription, ... });
const history = await messages.getRecentHistory(forkId, 50);
```

### Key Fields in `forks`

- `personaPrompt`: The full M2-Her system prompt (2000-3000 tokens)
- `interviewOutput`: JSON from Interview Agent
- `researchOutput`: JSON from Research Agent
- `alternateSelfName`: Generated name (e.g., "Berlin You")

### Database Location

Default: `.data/forks.db` in project root
Override: Set `DATABASE_PATH` environment variable

## API Routes

### Fork Management

- `GET /api/forks` - List user's forks
- `POST /api/forks` - Create fork (streams pipeline progress)
- `GET /api/forks/[id]` - Get fork details
- `DELETE /api/forks/[id]` - Archive fork

### Chat

- `POST /api/chat` - Send message (streams M2-Her response)
  - Body: `{ forkId, message }`
  - Returns: Streaming text

### Webhook

- `POST /api/webhook/openclaw` - Handle WhatsApp/Telegram messages
  - Commands: `/start`, `/list`, `/new`, `/help`
  - **Security**: Uses HMAC-SHA256 signature verification
  - Header: `x-openclaw-signature` (hex-encoded HMAC-SHA256 of body)

### Webhook Security

The OpenClaw webhook uses cryptographic signature verification (Web Crypto API):

```typescript
import { verifyWebhookSignature, generateSignature } from '@forks/openclaw';

// Verification (done automatically in the webhook route)
const isValid = await verifyWebhookSignature(
  rawBody,                           // Raw request body
  request.headers.get('x-openclaw-signature'),
  process.env.OPENCLAW_WEBHOOK_SECRET
);

// Generate signature (for testing)
const signature = await generateSignature(body, secret);
```

## Environment Variables

```bash
# Required - OpenRouter (Recommended)
OPENROUTER_API_KEY=     # Get from https://openrouter.ai/keys
OPENROUTER_APP_NAME=    # Your app name for tracking

# Optional - Local SQLite Database
DATABASE_PATH=          # Default: .data/forks.db

# Optional
OPENCLAW_WEBHOOK_SECRET= # Webhook authentication
NEXT_PUBLIC_APP_URL=    # App URL for sharing

# Optional - Direct API Access (bypasses OpenRouter)
USE_MINIMAX_DIRECT=true # Set to use MiniMax directly
MINIMAX_API_KEY=        # MiniMax API key
ANTHROPIC_API_KEY=      # Anthropic API key
```

## Development Commands

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build all packages
pnpm build

# Type check
pnpm typecheck

# Database (Drizzle)
cd packages/db
pnpm db:studio    # Open Drizzle Studio GUI
```

## Code Patterns

### Streaming Responses

API routes use Web Streams API for real-time responses:

```typescript
const stream = new ReadableStream({
  async start(controller) {
    for await (const chunk of m2her.chatStream(messages)) {
      controller.enqueue(encoder.encode(chunk));
    }
    controller.close();
  },
});

return new Response(stream, {
  headers: { 'Content-Type': 'text/plain; charset=utf-8' },
});
```

### Progress Callbacks

Pipeline supports progress tracking:

```typescript
const result = await createPersona(description, (progress) => {
  // progress.stage: 'interview' | 'research' | 'architect'
  // progress.status: 'started' | 'completed' | 'error'
  // progress.message: Human-readable status
});
```

### Repository Pattern

Database operations use repositories for type safety:

```typescript
import { users, forks, messages } from '@forks/db';

const user = await users.findOrCreate(platformId);
const fork = await forks.create({ userId, forkDescription, ... });
const history = await messages.getRecentHistory(forkId, 50);
```
