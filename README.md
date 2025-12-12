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
- [ ] Firebase Authentication (web + bot)

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
│   ├── web/                    # Current React/Vite app
│   │   ├── public/words.json   # 3k Oxford words
│   │   └── src/
│   │       ├── components/
│   │       ├── hooks/
│   │       ├── store/
│   │       └── lib/
│   └── bot/                    # (planned) Fastify + grammy bot
├── packages/
│   ├── database/               # (planned) Drizzle ORM + SQLite
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

### Install & run

```bash
git clone https://github.com/<>/ai-workshop.git
cd ai-workshop
pnpm install        
pnpm dev            
```

Open `http://localhost:5173/` to use the quiz.

### Usage notes

- Drag cards or use:
  - **→ / “I know this”** – mark as known
  - **← / “Don’t know”** – mark for review
- Reset anytime to start over; progress is persisted locally (known/unknown lists).
- Export a PDF report any time (`Export results` button) and choose whether to include only today’s reviewed words or the entire history.
- Use `pnpm --filter web dev -- --host` to expose the dev server on your LAN.


