# Forks

### *"What if you could meet the you who made the other choice?"*

---

Everyone carries "what ifs." *What if I'd taken that job? Moved to that city? Stayed with them?*

**Forks** lets you have real conversations with AI-powered alternate versions of yourself — the you who took the other path. Not a chatbot. Not a simulation. An emotionally authentic dialogue with who you might have become.

**The difference:** Three AI agents research and construct a deeply calibrated persona before you ever start talking. Your alternate self has a consistent personality, realistic memories, and authentic emotional responses — even across 100+ turn conversations.

Built with [MiniMax M2-Her](https://www.minimax.io/news/a-deep-dive-into-the-minimax-m2-her-2) for character consistency, [Claude](https://anthropic.com) for context engineering, and [OpenClaw](https://openclaw.ai).

## Demo

```
You: "Do you regret it? Was leaving worth everything you sacrificed?"

Startup You: "Regret is complicated. I missed dad's 60th birthday
because we were closing a funding round. I have $4.2 million in the
bank and I still feel like I'm chasing something.

But you... you were there. You held his hand. Some things you can't
put a price on. Do I regret it? Ask me on my bad days, and yes."
```

## Features

- **Context Engineering Pipeline**: Three-agent system (Interview → Research → Architect) creates deeply researched personas in ~30 seconds
- **Research-Backed Psychology**: Big Five personality traits, drift prevention, psychological archetypes
- **100+ Turn Stability**: MiniMax M2-Her maintains character consistency across long conversations
- **7 Message Roles**: System, user, assistant, user_system, group, sample_message_user, sample_message_ai
- **Multi-Platform**: Web app + WhatsApp/Telegram/Discord via OpenClaw
- **Zero Setup Database**: Local SQLite with Drizzle ORM (auto-migrates on first run)
- **Production Ready**: Streaming responses, error handling, type-safe queries
- **Open Source**: MIT licensed, community contributions welcome

## Quick Start

### Prerequisites

- Node.js 22+
- pnpm 9+
- OpenRouter API key (for Claude + M2-Her access)

### Installation

```bash
# Clone the repo
git clone https://github.com/yourusername/forks.git
cd forks

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env

# Edit .env with your API keys
```

### Environment Variables

```bash
# Required - OpenRouter (single key for all models)
OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_APP_NAME=Forks

# Optional - Local SQLite Database
DATABASE_PATH=.data/forks.db  # Default location

# Optional - OpenClaw webhook authentication
OPENCLAW_WEBHOOK_SECRET=your_webhook_secret

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Development

```bash
# Start the development server
pnpm dev

# Open http://localhost:3000
```

The SQLite database will be automatically created at `.data/forks.db` on first run.

## Architecture

```
forks/
├── apps/
│   └── web/                    # Next.js 15 frontend
│       ├── app/
│       │   ├── page.tsx        # Landing page
│       │   ├── fork/
│       │   │   ├── new/        # Fork creation wizard
│       │   │   └── [id]/       # Conversation view
│       │   └── api/
│       │       ├── forks/      # Fork CRUD
│       │       ├── chat/       # M2-Her streaming
│       │       └── webhook/    # OpenClaw integration
│
├── packages/
│   ├── agents/                 # Context Engineering Pipeline
│   │   ├── interview/          # Extracts emotional context
│   │   ├── research/           # Gathers factual grounding
│   │   └── architect/          # Synthesizes persona prompt
│   ├── m2her/                  # MiniMax M2-Her client
│   ├── db/                     # SQLite + Drizzle ORM
│   ├── shared/                 # Types, schemas, utilities
│   └── openclaw/               # OpenClaw integration
```

## How It Works

### 1. Fork Creation

User describes a life decision and the path not taken:

> "10 years ago, I chose to stay in my hometown instead of moving to Berlin for a startup job."

### 2. Context Engineering Pipeline

Three agents work together to create a rich, researched persona:

1. **Interview Agent**: Extracts emotional context, hidden motivations, and psychological patterns
2. **Research Agent**: Gathers factual grounding with web search — real companies, industries, locations for authentic details
3. **Persona Architect**: Synthesizes into a 2000-3000 token character prompt with Big Five personality traits and drift prevention

### 3. Conversation

M2-Her embodies the alternate self with:
- 100+ turn consistency
- Emotional calibration
- World-coherent responses

## M2-Her Message Roles

M2-Her supports 7 message roles for rich character interactions:

| Role | Purpose |
|------|---------|
| `system` | The alternate self's persona prompt |
| `user` | User messages |
| `assistant` | Previous alternate self responses |
| `user_system` | Context about the "real" user |
| `group` | Multi-party conversation identifier |
| `sample_message_user` | Few-shot example (user) |
| `sample_message_ai` | Few-shot example (AI) |

## OpenClaw Integration

For WhatsApp/Telegram support:

1. Install OpenClaw: `npm install -g openclaw@latest`
2. Configure webhook in `~/.openclaw/openclaw.json`:

```json
{
  "channels": {
    "whatsapp": {
      "allowFrom": ["*"],
      "webhook": "https://yourforks.app/api/webhook/openclaw"
    },
    "telegram": {
      "webhook": "https://yourforks.app/api/webhook/openclaw"
    }
  }
}
```

3. Start the gateway: `openclaw gateway`
4. Pair WhatsApp: `openclaw channels login`

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd apps/web
vercel
```

Note: For production with high traffic, consider migrating to PostgreSQL.
The Drizzle schema can be easily migrated.

### Docker

```bash
docker build -t forks .
docker run -p 3000:3000 --env-file .env forks
```

## Development Commands

```bash
pnpm install       # Install dependencies
pnpm dev           # Start development server
pnpm build         # Build all packages
pnpm lint          # Lint code
pnpm typecheck     # Type check
pnpm clean         # Clean build artifacts
```

## License

MIT — see [LICENSE](LICENSE) for details. 

## Acknowledgments

- [MiniMax](https://minimax.io) for M2-Her
- [OpenClaw](https://openclaw.ai) for the messaging gateway
- [Anthropic](https://anthropic.com) for Claude
- [OpenRouter](https://openrouter.ai) for unified API access

