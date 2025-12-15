# AI Workshop – Vocabulary Trainer Monorepo

Swipe-first vocabulary quiz in a Turborepo: the React/Vite web client with shared database and Telegram bot.

## Feature status

- [x] Tinder-style card interface with mouse/touch/keyboard controls
- [x] Progress metrics with resettable sessions
- [x] Animated UI using shadcn/ui + Framer Motion
- [x] Local persistence via Zustand (persist) + PDF export (choose “today” or “all time”)
- [ ] Server-side persistence in SQLite/Drizzle (`packages/database`)
- [ ] Shared type package for web/bot (`packages/shared`)
- [ ] Telegram bot (Fastify + grammy, spaced repetition loop)
- [x] Email/password authentication via Fastify + SQLite

## Tech stack

| Layer | Choice |
|-------|--------|
| Monorepo | Turborepo + pnpm workspaces |
| Frontend | Vite + React 18 + TypeScript |
| State | Zustand + persist middleware |
| Styling/UI | Tailwind CSS, shadcn/ui, Framer Motion |
| Export | jsPDF for PDF result reports |
| Runtime | Node.js **20.19.0+** (required by Vite 7) |

## Repository layout

```
ai-workshop/
├── apps/
│   ├── web/                    # React/Vite app
│   │   ├── public/words.json   # 3k Oxford words
│   │   └── src/
│   │       ├── components/
│   │       ├── hooks/
│   │       ├── store/
│   │       └── lib/
│   ├── api/                    # Fastify REST API (auth)
│   └── bot/                    # (planned) Fastify + grammy bot
├── packages/
│   ├── database/               # Drizzle ORM + SQLite helpers
│   └── shared/                 # (planned) shared types/utilities
├── turbo.json
├── pnpm-workspace.yaml
└── README.md
```

## Getting started

### Prerequisites

- Node.js **20.19.0** or higher (Vite 7 refuses older runtimes)
- pnpm 8/9 (`corepack enable` recommended)
- Modern browser (Chrome, Firefox, Edge, Safari)

### Install & run all services

```bash
git clone https://github.com/<>/ai-workshop.git
cd ai-workshop
pnpm install        
pnpm dev            
```

This will start **all three services in parallel**:
- 🌐 **Web** (React/Vite): http://localhost:5173
- 🔧 **API** (Fastify): http://localhost:3333
- 🤖 **Telegram Bot**: Listens for Telegram events

Open `http://localhost:5173/` to use the quiz.

### Individual service startup (optional)

If you prefer to run services separately:

```bash
# Web only
pnpm --filter web dev

# API only
pnpm --filter api dev

# Telegram Bot only
pnpm --filter telegram-bot dev
```

### Usage notes

- Drag cards or use:
  - **→ / "I know this"** – mark as known
  - **← / "Don't know"** – mark for review
- Reset anytime to start over; progress is persisted locally (known/unknown lists).
- Export a PDF report any time (`Export results` button) and choose whether to include only today's reviewed words or the entire history.
- Use `pnpm --filter web dev -- --host` to expose the dev server on your LAN.

## Configuration

### API Setup (`apps/api`)

Required environment variables:
- `PORT=3333`
- `HOST=0.0.0.0`
- `DATABASE_PATH=./data/app.sqlite`
- `JWT_SECRET=replace-with-strong-secret`
- `CORS_ORIGIN=http://localhost:5173`

Run migrations once (before first start or after schema changes):
```bash
pnpm --filter @ai-workshop/database drizzle:push
```

### Web Setup (`apps/web`)

Create `apps/web/.env.local` with:
```
VITE_API_URL=http://localhost:3333
```

### Telegram Bot Setup (`apps/telegram-bot`)

Create `apps/telegram-bot/.env` (copy from `env.example`):
```
TELEGRAM_BOT_TOKEN=your_token_from_botfather
API_URL=http://localhost:3333
DEFAULT_USER_TOKEN=optional_jwt_token
WORDS_PATH=apps/web/public/words.json
```

See [Telegram Bot README](./apps/telegram-bot/README.md) for detailed setup instructions.

## Custom authentication stack

The web client talks to a local Fastify API that stores users in SQLite (via Drizzle). 

Sign up with any email/password combo (minimum 6 chars). The API hashes passwords with argon2, issues JWTs, and the web app stores the token locally so progress can sync with the Telegram bot.


