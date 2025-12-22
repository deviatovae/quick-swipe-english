import { config as loadEnv } from 'dotenv';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Markup, Telegraf } from 'telegraf';
import type { Context } from 'telegraf';
import { z } from 'zod';

loadEnv();

const envToken = process.env.TELEGRAM_BOT_TOKEN;
if (!envToken) {
  throw new Error('TELEGRAM_BOT_TOKEN is not set');
}
const BOT_TOKEN = envToken;

const API_URL = process.env.API_URL ?? 'http://localhost:3333';
const DEFAULT_USER_TOKEN = process.env.DEFAULT_USER_TOKEN ?? null;

const wordSchema = z.object({
  id: z.number(),
  word: z.string(),
  pos: z.string(),
  level: z.string(),
  translation: z.string().optional(),
});
const wordsSchema = z.array(wordSchema);

type Word = z.infer<typeof wordSchema>;

interface WordProgress {
  id: string;
  userId: string;
  wordId: number;
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReviewDate: string | number | null;
  lastReviewDate: string | number | null;
}

interface DueWord {
  progress: WordProgress;
  word: Word;
}

interface SessionState {
  token: string;
}

const sessions = new Map<number, SessionState>();

async function loadWordsDataset(): Promise<Map<number, Word>> {
  const moduleDir = dirname(fileURLToPath(import.meta.url));
  const defaultWordsPath = resolve(moduleDir, '../../web/public/words.json');
  const wordsPath = process.env.WORDS_PATH
    ? resolve(process.cwd(), process.env.WORDS_PATH)
    : resolve(moduleDir, '../../../apps/web/public/words.json');

  const data = await readFile(wordsPath ?? defaultWordsPath, 'utf-8').catch(
    async (err) => {
      console.warn(
        `Failed to read words dataset at ${wordsPath}. Falling back to ${defaultWordsPath}`,
        err
      );
      return readFile(defaultWordsPath, 'utf-8');
    }
  );

  const parsed = wordsSchema.parse(JSON.parse(data));
  return new Map(parsed.map((word) => [word.id, word]));
}

async function apiRequest<T>(
  path: string,
  token: string,
  init: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    let message = response.statusText;
    try {
      const body = (await response.json()) as { error?: string };
      if (body?.error) {
        message = body.error;
      }
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

async function getDueWordsCount(token: string): Promise<number> {
  const dueWords = await apiRequest<WordProgress[]>('/progress/due', token, {
    method: 'GET',
  });
  return dueWords.length;
}

async function getNextDueWord(
  token: string,
  wordMap: Map<number, Word>
): Promise<{ dueWord: DueWord | null; totalDue: number }> {
  const dueWords = await apiRequest<WordProgress[]>('/progress/due', token, {
    method: 'GET',
  });

  for (const progress of dueWords) {
    const word = wordMap.get(progress.wordId);
    if (word) {
      return { dueWord: { progress, word }, totalDue: dueWords.length };
    }
  }

  return { dueWord: null, totalDue: 0 };
}

function formatWordCard(due: DueWord, remainingCount: number): string {
  const { word, progress } = due;

  const metadata = `${escapeMarkdown(word.pos)} · ${escapeMarkdown(word.level)}`;
  const wordLine = `✨ *${escapeMarkdown(word.word.toUpperCase())}* ✨ — _${metadata}_`;

  const translationLine = word.translation
    ? `\n💡 Hint: ||${escapeMarkdown(word.translation)}||`
    : '';
  const countLine = `\n📚 _${remainingCount} word\\(s\\) left to review_`;

  return [wordLine, translationLine, countLine].filter(Boolean).join('\n');
}

function escapeMarkdown(text: string): string {
  return text.replace(/([_*\[\]()~`>#+\-=|{}.!\\])/g, '\\$1');
}

function getTokenForUser(userId: number): string | null {
  const sessionToken = sessions.get(userId)?.token;
  if (sessionToken) return sessionToken;
  if (DEFAULT_USER_TOKEN) return DEFAULT_USER_TOKEN;
  return null;
}

async function requireToken(ctx: Context): Promise<string | null> {
  const userId = ctx.from?.id;
  if (!userId) {
    await ctx.reply('Could not detect Telegram user.');
    return null;
  }
  const token = getTokenForUser(userId);
  if (!token) {
    await ctx.reply(
      '🔗 Please connect your account first\\!\n\n' +
        'Go to the web app → *Review in Telegram*',
      { parse_mode: 'MarkdownV2' }
    );
    return null;
  }
  return token;
}

function buildReviewKeyboard(wordId: number) {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('✅ I know it', `review:${wordId}:known`),
      Markup.button.callback("❌ Don't know", `review:${wordId}:unknown`),
      Markup.button.callback('🏁 Learned', `finish:${wordId}`),
    ],
  ]);
}

async function sendNextWord(
  ctx: Context,
  token: string,
  wordMap: Map<number, Word>
) {
  try {
    const { dueWord, totalDue } = await getNextDueWord(token, wordMap);
    if (!dueWord) {
      await ctx.reply(
        '🎉 *Great job\\!*\n\n' +
          'No words to review right now\\.\n' +
          'Come back later or add more words in the web app\\!',
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }
    await ctx.reply(formatWordCard(dueWord, totalDue), {
      parse_mode: 'MarkdownV2',
      ...buildReviewKeyboard(dueWord.word.id),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown fetch error';
    await ctx.reply(`❌ Failed to fetch review words: ${message}`);
  }
}

const wordMapPromise = loadWordsDataset();

async function exchangeLinkCode(code: string): Promise<string | null> {
  try {
    const response = await fetch(`${API_URL}/telegram/exchange`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as { token?: string };
    return data.token ?? null;
  } catch {
    return null;
  }
}

const WELCOME_MESSAGE = `
🎓 *Welcome to Vocabulary Review Bot\\!*

This bot helps you learn words using _spaced repetition_:

📝 *How it works:*
1️⃣ Mark words as "unknown" in the web app
2️⃣ They appear here for review
3️⃣ Words you know get longer intervals
4️⃣ Words you struggle with come back sooner

📊 *Review schedule:*
• New words → review today
• If you know it → next review in 1\\-6\\-15\\-30\\+ days
• If you don't know → back to 1 day
• Tap the 🏁 "Learned" button to drop mastered words from the queue

🚀 Send /review to start practicing\\!
`.trim();

const COMMANDS_INFO = [
  { command: '/review', description: 'Start reviewing due words' },
  { command: '/stats', description: 'See your study statistics' },
  { command: '/help', description: 'Show this menu again' },
];

const commandKeyboard = Markup.keyboard(
  COMMANDS_INFO.map((info) => info.command)
);

function formatCommandsHelp(): string {
  return COMMANDS_INFO.map(
    (info) =>
      `• ${escapeMarkdown(info.command)} — ${escapeMarkdown(info.description)}`
  ).join('\n');
}

async function main() {
  const wordMap = await wordMapPromise;
  console.log(`Loaded ${wordMap.size} words for review bot.`);

  const bot = new Telegraf(BOT_TOKEN);

  bot.start(async (ctx) => {
    const userId = ctx.from?.id;
    const payload = ctx.startPayload;

    const sendWelcome = () =>
      ctx.reply(WELCOME_MESSAGE, { parse_mode: 'MarkdownV2' });

    // If there's a link code in the payload, try to exchange it
    if (payload && userId) {
      const token = await exchangeLinkCode(payload);
      if (token) {
        sessions.set(userId, { token });

        // Get word count for the user
        let wordCount = 0;
        try {
          wordCount = await getDueWordsCount(token);
        } catch {
          // ignore
        }

        const countText =
          wordCount > 0
            ? `\n\n📚 You have *${wordCount}* word\\(s\\) waiting for review\\!`
            : '\n\n📭 No words to review yet\\. Add some in the web app\\!';

        await sendWelcome();
        await ctx.reply(
          `✅ *Account linked successfully\\!*${countText}\n\nSend /review to start practicing\\.`,
          { parse_mode: 'MarkdownV2' }
        );
        return;
      }
      await sendWelcome();
      await ctx.reply(
        '⚠️ Link code expired or invalid\\. Please generate a new one from the web app\\.',
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }

    await sendWelcome();
  });

  bot.command('token', async (ctx) => {
    const userId = ctx.from?.id;
    const text = ctx.message?.text ?? '';
    const parts = text.trim().split(/\s+/);
    if (parts.length < 2) {
      await ctx.reply('Usage: /token <JWT>');
      return;
    }
    if (!userId) {
      await ctx.reply('Cannot save token — unknown user.');
      return;
    }
    const token = parts[1];
    sessions.set(userId, { token });
    await ctx.reply('✅ Token saved! Now you can run /review.');
  });

  bot.command('review', async (ctx) => {
    const token = await requireToken(ctx);
    if (!token) return;

    // Show count first
    try {
      const count = await getDueWordsCount(token);
      if (count === 0) {
        await ctx.reply(
          '📭 *No words to review\\!*\n\n' +
            'Add words in the web app by swiping them as "unknown"\\.',
          { parse_mode: 'MarkdownV2' }
        );
        return;
      }

      await ctx.reply(`📚 *${count}* word\\(s\\) to review today\\!`, {
        parse_mode: 'MarkdownV2',
      });
    } catch {
      // continue anyway
    }

    await sendNextWord(ctx, token, wordMap);
  });

  bot.command('stats', async (ctx) => {
    const token = await requireToken(ctx);
    if (!token) return;

    try {
      const allProgress = await apiRequest<WordProgress[]>('/progress', token, {
        method: 'GET',
      });
      const dueCount = await getDueWordsCount(token);

      await ctx.reply(
        `📊 *Your Statistics*\n\n` +
          `📚 Total words in review: *${allProgress.length}*\n` +
          `📝 Due today: *${dueCount}*`,
        { parse_mode: 'MarkdownV2' }
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      await ctx.reply(`❌ Failed to get stats: ${message}`);
    }
  });

  bot.command('help', async (ctx) => {
    await ctx.reply(
      `🤖 *Available Commands*\n\n${formatCommandsHelp()}\n\n` +
        '🏁 Tap the Learned button on each card to drop mastered words completely\\.',
      {
        parse_mode: 'MarkdownV2',
        ...commandKeyboard.reply_markup,
      }
    );
  });

  bot.action(/^review:(\d+):(known|unknown)$/, async (ctx) => {
    const token = await requireToken(ctx);
    if (!token) {
      await ctx.answerCbQuery('Valid token required.');
      return;
    }

    const match = ctx.match as RegExpMatchArray;
    const wordId = Number(match[1]);
    const decision = match[2] === 'known' ? 'known' : 'unknown';
    const quality = decision === 'known' ? 4 : 1;

    try {
      await apiRequest(`/progress/${wordId}`, token, {
        method: 'PUT',
        body: JSON.stringify({ quality }),
      });

      if (decision === 'known') {
        await ctx.answerCbQuery('✅ Great! Moving to longer interval');
      } else {
        await ctx.answerCbQuery("🔁 We'll review this again soon");
      }

      await sendNextWord(ctx, token, wordMap);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      await ctx.answerCbQuery('Error');
      await ctx.reply(`❌ Failed to update progress: ${message}`);
    }
  });

  bot.action(/^finish:(\d+)$/, async (ctx) => {
    const token = await requireToken(ctx);
    if (!token) {
      await ctx.answerCbQuery('Valid token required.');
      return;
    }

    const match = ctx.match as RegExpMatchArray;
    const wordId = Number(match[1]);

    try {
      await apiRequest(`/progress/${wordId}`, token, {
        method: 'DELETE',
        body: JSON.stringify({}),
      });
      await ctx.answerCbQuery('🏁 Word removed from review');
      await sendNextWord(ctx, token, wordMap);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      await ctx.answerCbQuery('Error');
      await ctx.reply(`❌ Failed to remove word: ${message}`);
    }
  });

  await bot.launch();
  console.log('Telegram bot is running. Press Ctrl+C to stop.');

  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
}

main().catch((error) => {
  console.error('Failed to start Telegram bot:', error);
  process.exit(1);
});
