# AI Workshop – Vocabulary Trainer Monorepo

Swipe-first vocabulary quiz in a Turborepo: the React/Vite web client with Fastify API, SQLite database, and Telegram bot for spaced repetition learning.

## Feature status

- [x] Tinder-style card interface with mouse/touch/keyboard controls
- [x] Progress metrics with resettable sessions
- [x] Animated UI using Framer Motion + Tailwind CSS
- [x] Local persistence via Zustand (persist) + PDF export
- [x] Server-side persistence in SQLite/Drizzle (`packages/database`)
- [x] Email/password authentication via Fastify + SQLite
- [x] Telegram bot with spaced repetition (SM-2 algorithm)
- [x] Mobile-optimized UI

## Tech stack

| Layer | Choice |
| --- | --- |
| Monorepo | Turborepo + pnpm workspaces |
| Frontend | Vite + React 19 + TypeScript |
| State | Zustand + persist middleware |
| Styling/UI | Tailwind CSS + Framer Motion |
| Backend | Fastify + Drizzle ORM |
| Database | SQLite with SM-2 spaced repetition |
| Bot | Telegraf (Telegram API) |
| Export | jsPDF for PDF reports |
| Runtime | Node.js **20.19.0+** (required by Vite 7) |

## Repository layout

```
ai-workshop/
├── apps/
│   ├── web/                    # React/Vite app
│   │   ├── public/words.json   # 3000 Oxford English words
│   │   └── src/
│   │       ├── components/
│   │       ├── hooks/
│   │       ├── store/
│   │       └── lib/
│   ├── api/                    # Fastify REST API (auth + progress)
│   └── telegram-bot/           # Telegram bot for word review
├── packages/
│   ├── database/               # Drizzle ORM + SQLite schema
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
- Telegram bot token (from @BotFather) for bot features

### Install & run all services

```bash
git clone https://github.com/deviatovae/quick-swipe-english.git
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

- Drag cards or use keyboard:
  - **→ / "I know"** – mark word as known (increases review interval)
  - **← / "Don't know"** – mark for review (resets to 1 day)
  - **↑ / "Skip"** – skip to next word
- Progress is synced between web and Telegram bot
- Export a PDF report with progress statistics
- Reset anytime to start over

## Configuration

### API Setup (`apps/api`)

Required environment variables in `.env`:
```
PORT=3333
HOST=0.0.0.0
DATABASE_PATH=/path/to/app.sqlite
CORS_ORIGIN=http://localhost:5173
```

Run migrations once (before first start or after schema changes):
```bash
pnpm --filter @ai-workshop/database drizzle:push
```

### Web Setup (`apps/web`)

Create `apps/web/.env.local`:
```
VITE_API_URL=http://localhost:3333
```

### Telegram Bot Setup (`apps/telegram-bot`)

Create `apps/telegram-bot/.env`:
```
TELEGRAM_BOT_TOKEN=your_token_from_botfather
API_URL=http://localhost:3333
WORDS_PATH=apps/web/public/words.json
```

See [Telegram Bot README](./apps/telegram-bot/README.md) for detailed setup.

## How it works

1. **Web App**: Users swipe cards to mark words as known/unknown
2. **API**: Stores progress using SM-2 spaced repetition algorithm
3. **Telegram Bot**: Reviews due words, syncs progress with API
4. **Mobile**: Optimized for on-the-go learning

## Authentication

The web client uses email/password authentication via Fastify API:
- Passwords are hashed with argon2
- JWTs are issued for authenticated requests
- Tokens are stored locally and used to sync with Telegram bot
- All communication is secured with HTTPS in production

## Database

- Uses SQLite with Drizzle ORM
- Implements SM-2 spaced repetition algorithm for optimal learning intervals
- Tracks: user accounts, word progress, learning metrics
- Auto-generates review schedules based on user performance
