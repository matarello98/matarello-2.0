# matarello-2.0

Matarello 2.0 is a modular WhatsApp bot built with Node.js and Baileys. It includes automation, media tools, group utilities, games, and a local rule-based conversational assistant.

## Run on an always-on Node host

This bot is prepared for a VM-style host that keeps one Node.js process running:

```bash
npm install
npm start
```

Host requirements:

- Node.js 20 or newer
- `yt-dlp`, FFmpeg, and ImageMagick available on the host
- Persistent storage for the `auth/` directory and `src/data/db/`
- The process command must remain `node index.js` (or `npm start`)
- Set `BOT_NUMBER` to the WhatsApp number being paired, in international digits with no `+`
- Set `OWNER_NUMBER` or comma-separated `OWNER_NUMBERS` to the number(s) allowed to manage that installation; if omitted, the bot number is the owner
- For voice features on a non-Replit host, set `ELEVENLABS_API_KEY` in the host's secret manager; never commit it

The first run prints an 8-digit WhatsApp pairing code. On the target phone, open WhatsApp → Linked devices → Link a device → Link with phone number instead, and enter the code. Keep `auth/` between restarts so the bot does not need to be paired again. Each installation must set its own `BOT_NUMBER` and persistent `auth/` directory.

The source archive intentionally excludes WhatsApp sessions, local databases, and credentials. Copy `.env.example` as a reference, then configure values in the hosting provider's environment/secrets panel. Any Node host that supports a persistent Node.js process and storage can run it; native FFmpeg and `yt-dlp` availability determines which media features work.

Host Stian Tech currently advertises 24/7 WhatsApp bot runtimes and dashboard controls, but its public pages do not confirm arbitrary GitHub imports, native package availability, or persistent storage guarantees. Confirm those three items with the host before deploying this repository there; otherwise use a VM-style Node host.

## Prefix and chatbot

- The default command prefix is `.`, for example `.menu` and `.chatbot`.
- `!` remains accepted as a legacy alias.
- Use `.commands` to list implemented commands. Features marked as coming soon or requiring unavailable services in older menus are not presented as working.
- Chatbot replies are off by default. An owner or sudo user can enable them with `.chatbot`.
- The bot never sends chatbot replies to its own account's messages. In private chats it can answer other people; in groups it answers when mentioned or when someone replies to it.
- Incoming voice notes are transcribed through ElevenLabs and passed to the chatbot. `.chatbotvoice` toggles spoken chatbot replies; `.tts`, `.sendvn`, and `.sendvo` create voice notes from text.
- Favorite stickers are copied into the bot's own persistent sticker bank with `.savesticker <tag>` by replying to a sticker. The bot cannot read stickers saved only in the phone's WhatsApp keyboard; its situation-matched auto-stickers come from this bot-side bank.
