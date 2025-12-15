# Telegram Review Bot

This package implements a Telegram bot that lets you review unknown words saved from the web app using the SM‑2 spaced repetition flow.

## Setup

1. Create a bot via **@BotFather** and grab the token.
2. Copy `env.example` to `.env` and fill in the values:
   - `TELEGRAM_BOT_TOKEN` – Bot token from BotFather (required)
   - `API_URL` – Base URL for the Fastify API (default: `http://localhost:3333`)
   - `WORDS_PATH` – Path to `words.json` dataset to display word details (default: `apps/web/public/words.json`)

3. Start the bot:

```bash
pnpm install
pnpm --filter telegram-bot dev
```

**Note:** The bot uses `words.json` to display word information (text, translation, level) alongside the review progress data from the API.

## How to connect

1. In the web app, click "Review in Telegram" button to get a link code.
2. Open the link in Telegram to automatically connect your account.
3. The bot will have access to your progress and show you words to review.

## Commands and buttons

- `/start` – Shows welcome message and setup instructions
- `/review` – Fetches the next due word with three action buttons:
  - **I know** – Mark word as known (increases review interval)
  - **Don't know** – Mark word as unknown (resets to 1 day interval)
  - **Learned** – Remove word from review queue permanently
- `/stats` – Shows your study statistics
- `/help` – Shows available commands

After each answer the bot records the result and immediately shows the next due word. When there are no due words left it will tell you to come back later.

## Testing checklist

1. Start the API (`pnpm --filter api dev`).
2. Launch the bot in watch mode (`pnpm --filter telegram-bot dev`).
3. In the web app, click "Review in Telegram" to link your account.
4. In Telegram, use `/review` to get the next word and test the action buttons.
5. Refresh the web app to confirm progress updates are reflected there.
