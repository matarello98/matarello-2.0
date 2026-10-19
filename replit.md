# Matarello 2.0 — WhatsApp Bot

## Overview
A fully custom WhatsApp bot built with Node.js and the Baileys library.
- **Bot Name:** Matarello 2.0
- **Owner:** Set `OWNER_NUMBER` or `OWNER_NUMBERS` in the host environment
- **Bot Number:** Set `BOT_NUMBER` in the host environment for first pairing
- **Prefix:** `.`, with `!` accepted as a legacy alias
- **Version:** 2.0.0

## Architecture
- **Runtime:** Node.js 20
- **Library:** @whiskeysockets/baileys (WhatsApp Web API)
- **Auth:** Pairing code (8-digit phone number login, no QR)
- **Entry:** `index.js`
- **Commands:** `src/commands/` (owner, group, fun, utility, games, media, info)
- **Chatbot:** `src/chatbot/` (Nigerian human personality, rule-based)
- **Database:** `src/data/db/` (local JSON runtime state; excluded from source archives)
- **Auth State:** `auth/` (gitignored)

## Features
- 8-digit pairing code login (no QR)
- Modular command registry with a `.commands` listing
- Nigerian human chatbot personality
- Responds to text, images, stickers, voice notes
- Savage clapbacks when insulted
- Group management (kick, ban, warn, antilink, welcome, etc.)
- Economy system (balance, daily, transfer)
- Games (hangman, wordle, guess, trivia, truth/dare, etc.)
- Media processing (sticker, toimg, blur, grayscale, flip, rotate)
- Owner/Sudo permission system
- Anti-link, bad word filter, AFK mode
- Welcome/goodbye messages
- Colorful terminal output

## Pairing Process
1. Start the bot — pairing code appears in the terminal/console
2. Open WhatsApp on the number configured as `BOT_NUMBER`
3. Menu → Linked Devices → Link a Device → Link with phone number
4. Enter the 8-digit code shown in the console

## Key Commands
- `!menu` — Full command list with welcome note
- `!addsudo @user` — Give sudo privileges (owner only)
- `!ban @user` / `!unban @user` — Ban management
- `!sticker` — Reply to image to create sticker
- `!tagall` — Tag all group members (admin)
- `!trivia`, `!wordle`, `!hangman`, `!guess` — Games

## Dependencies
- `@whiskeysockets/baileys` — WhatsApp Web API
- `pino` — Logger (silent in production)
- `sharp` — Image processing
- `qrcode-terminal` — Unused (pairing code used instead)
