# Contributing to Forks

Thank you for your interest in contributing to Forks! This document provides guidelines for contributing to the project.

## Getting Started

### Prerequisites

- Node.js 22+
- pnpm 9+
- Git

### Setup

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/forks.git
   cd forks
   ```
3. Install dependencies:
   ```bash
   pnpm install
   ```
4. Create a branch for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Workflow

### Running the Development Server

```bash
pnpm dev
```

### Building

```bash
pnpm build
```

### Linting

```bash
pnpm lint
```

### Type Checking

```bash
pnpm typecheck
```

## Project Structure

```
forks/
├── apps/web/          # Next.js frontend and API routes
├── packages/
│   ├── agents/        # Context Engineering Pipeline
│   ├── db/            # Database layer (SQLite + Drizzle)
│   ├── m2her/         # MiniMax M2-Her client
│   ├── shared/        # Shared types and utilities
│   └── openclaw/      # OpenClaw integration
```

## Making Changes

### Code Style

- Use TypeScript for all code
- Follow the existing code style
- Run `pnpm lint` before committing
- Add types for all function parameters and return values

### Commit Messages

Use clear, descriptive commit messages:

- `feat: add new personality trait support`
- `fix: resolve streaming response issue`
- `docs: update README with new setup instructions`
- `refactor: simplify pipeline orchestration`

### Pull Requests

1. Ensure your branch is up to date with main
2. Run all tests and linting
3. Write a clear PR description explaining:
   - What changes you made
   - Why you made them
   - Any breaking changes
4. Link any related issues

## Areas for Contribution

### High Priority

- Unit tests for agents
- Integration tests for API routes
- UI components and improvements
- Documentation improvements

### Feature Ideas

- New platform adapters (Discord, Slack)
- Prompt templates for different fork types
- Voice message support
- Language translations
- Mobile app

### Bug Reports

When reporting bugs, please include:

- Steps to reproduce
- Expected behavior
- Actual behavior
- Environment details (OS, Node version, etc.)

## Questions?

Feel free to open an issue for any questions about contributing.

## License

By contributing to Forks, you agree that your contributions will be licensed under the MIT License.
