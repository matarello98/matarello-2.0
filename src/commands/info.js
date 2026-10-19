const { makeHeader, makeSection, makeFooter, C, formatTime, isOwner, getJidNumber } = require("../utils/helpers");
const db = require("../utils/database");
const cfg = require("../config");
const { getSetting } = require("./settings");

const startTime = Date.now();

const infoCommands = {

  ping: async (sock, msg, from) => {
    const start = Date.now();
    await sock.sendMessage(from, { text: "🏓 Pong!" });
    const latency = Date.now() - start;
    await sock.sendMessage(from, { text: `🏓 *Pong!*\n⚡ Speed: *${latency}ms*\n✅ Bot is online and sharp sharp!` }, { quoted: msg });
  },

  uptime: async (sock, msg, from) => {
    const up = formatTime(Date.now() - startTime);
    await sock.sendMessage(from, { text: `⏱️ *Bot Uptime:*\n\n*${up}*\n\nRunning smooth like Afrobeats! 🎵` }, { quoted: msg });
  },

  botinfo: async (sock, msg, from) => {
    const sudos = db.getSudos().length;
    const banned = db.getBanned().length;
    const text = `${makeHeader("BOT INFO", "🤖")}\n\n` +
      `🏷️ *Name:* ${cfg.botName}\n` +
      `🔢 *Version:* ${cfg.version}\n` +
      `📱 *Number:* +${cfg.botNumber}\n` +
      `👑 *Owner:* ${cfg.ownerName}\n` +
      `⌨️ *Prefix:* ${cfg.prefix}\n` +
      `⏱️ *Uptime:* ${formatTime(Date.now() - startTime)}\n` +
      `👮 *Sudo Users:* ${sudos}\n` +
      `🚫 *Banned Users:* ${banned}\n` +
      `🇳🇬 *Origin:* Nigeria 🔥\n` +
      makeFooter();
    await sock.sendMessage(from, { text }, { quoted: msg });
  },

  myinfo: async (sock, msg, from, args, sender) => {
    const num = getJidNumber(sender);
    const isSudo = db.getSudos().includes(num);
    const isBanned = db.getBanned().includes(num);
    const bal = db.getBalance(num);
    await sock.sendMessage(from, {
      text: `${makeHeader("YOUR INFO", "👤")}\n\n📱 *Number:* +${num}\n👑 *Role:* ${isOwner(sender) ? "Owner 👑" : isSudo ? "Sudo ⭐" : "Member 👤"}\n🚫 *Banned:* ${isBanned ? "Yes ❌" : "No ✅"}\n💰 *Coins:* ${bal}\n${makeFooter()}`,
    }, { quoted: msg });
  },

  menu: async (sock, msg, from, args, sender) => {
    const isOwnerUser = isOwner(sender);
    const isSudo = db.getSudos().includes(getJidNumber(sender));
    const role = isOwnerUser ? "Owner 👑" : isSudo ? "Sudo ⭐" : "Member 👤";
    const time = new Date().toLocaleTimeString("en-NG", { timeZone: "Africa/Lagos" });

    const menu = `╭━━━━━━━━━━━━━━━━━━━━━━╮
┃   🌈 *MATARELLO 2.0* 🌈   ┃
╰━━━━━━━━━━━━━━━━━━━━━━╯

✨ *Your colourful command centre*
👤 Role: *${role}*  •  🕐 ${time}
⌨️ Use *${getSetting("prefix", cfg.prefix)}command* (legacy *!command* also works)

╭─「 🧭 START HERE 」
│ • .menu — Open this command centre
│ • .help <command> — Command help
│ • .ping  •  .uptime  •  .botinfo  •  .myinfo
│ • .commands — List implemented commands in this install
╰──────────────────────

╭─「 🎨 MEDIA STUDIO 」
│ • .sticker — Image/video → sticker
│ • .toimg — Sticker → image
│ • .imageedit — Picture editing guide
│ • .resize 800 800 — Resize an image
│ • .crop 800 600 — Center crop
│ • .grayscale  •  .sepia  •  .invert
│ • .blur 8  •  .sharpen  •  .brightness 1.3
│ • .compress 70  •  .round  •  .rotate 90
│ • .flip  •  .flop
╰──────────────────────

╭─「 📡 DOWNLOAD DECK 」
│ • .youtube <YouTube URL> — Video download
│ • .play <song + artist> — Search and send MP3
│ • .download <direct URL> — Public file/media URL
│ • .dl <direct URL> — Download alias
│ • .videodoc — Video as document
╰──────────────────────

╭─「 🔞 ADULT SEARCH 」
│ • .xnxx <search>  •  .xxx <search>
│ • .pornhub <search>
│ Owner/sudo only; returns search links and respects site access rules.
╰──────────────────────

╭─「 😂 VIBES & GAMES 」
│ • .joke  •  .roast @user  •  .compliment @user
│ • .rizz  •  .pickup  •  .ship @u1 @u2  •  .8ball
│ • .truth  •  .dare  •  .wouldyourather  •  .rate
│ • .trivia  •  .riddle  •  .wordle  •  .hangman  •  .guess
│ • .jollof  •  .afrobeat  •  .food  •  .naijafact
╰──────────────────────

╭─「 🛠️ EVERYDAY TOOLS 」
│ • .calc  •  .weather  •  .currency  •  .time  •  .date
│ • .reverse  •  .uppercase  •  .lowercase  •  .base64
│ • .note  •  .getnote  •  .listnotes  •  .delnote
│ • .afk  •  .balance  •  .daily  •  .transfer
│ • .editold <text> — Edit a bot message you reply to
╰──────────────────────

╭─「 👥 GROUP CONTROL 」
│ • .kick  •  .add  •  .promote  •  .demote
│ • .tagall  •  .hidetag  •  .warn  •  .warnlist
│ • .antilink  •  .setwelcome  •  .setgoodbye
│ • .opengroup  •  .closegroup  •  .grouplink  •  .groupinfo
╰──────────────────────

${isOwnerUser || isSudo ? `╭─「 👑 OWNER / SUDO 」
│ • .chatbot — Toggle chatbot (currently off by default)
│ • .chatbotvoice — Toggle spoken chatbot replies
│ • .chatbotstickers — Toggle context-matched saved stickers
│ • .adultdl <direct URL> — Restricted direct media download
│ • .rentclone <number> <duration> — Start a timed clone
│ • .rentlist  •  .stopclone <id or number>
│ • .addsudo  •  .delsudo  •  .listsudo
│ • .ban  •  .unban  •  .broadcast  •  .botstats
╰──────────────────────

` : ""}🌟 *Tip:* Try dot aliases for the media deck: *.youtube*, *.play*, *.xnxx*

⚡ *Matarello 2.0* • Made with 💚 by *${cfg.ownerName}*`;

    const activePrefix = getSetting("prefix", cfg.prefix);
    const formattedMenu = menu.replace(/\.([a-z][a-z0-9_]*)/gi, (_, command) => `${activePrefix}${command}`);
    await sock.sendMessage(from, { text: formattedMenu }, { quoted: msg });
  },

  help: async (sock, msg, from, args) => {
    const cmd = args[0]?.toLowerCase();
    const helps = {
      kick: ".kick @user — Kick a member from the group. Admin only.",
      ban: ".ban @user — Ban a user from using the bot.",
      warn: ".warn @user — Issue a warning. 3 warns = auto kick.",
      sticker: ".sticker — Reply to an image to convert it to a sticker.",
      tagall: ".tagall <message> — Tag all group members. Admin only.",
      ship: ".ship @person1 @person2 — Check relationship compatibility.",
      roast: ".roast @user — Roast someone (lovingly... maybe 😂).",
      download: ".download <direct URL> — Download a public direct media/file URL. Maximum 50 MB.",
      youtube: ".youtube <YouTube URL> — Download a public YouTube video under 50 MB.",
      play: ".play <song and artist> — Search YouTube and send the audio.",
      adultdl: ".adultdl <direct URL> — Owner/sudo only; direct media URLs only.",
      editold: ".editold <new text> — Reply to a message sent by the bot. WhatsApp may reject edits outside its server-side window.",
      rentclone: ".rentclone <number> <duration> — Owner-only clone session rental. Duration can be 30m, 12h, 7d, or 2w.",
    };
    const prefix = getSetting("prefix", cfg.prefix);
    if (cmd && helps[cmd]) {
      const details = helps[cmd].replace(/\.([a-z][a-z0-9_]*)/gi, (_, name) => `${prefix}${name}`);
      return sock.sendMessage(from, { text: `📖 *Help: ${prefix}${cmd}*\n\n${details}` }, { quoted: msg });
    }
    await sock.sendMessage(from, { text: `📖 Use *${prefix}menu* for full command list.\nFor specific help: *${prefix}help <command>*\nExample: ${prefix}help kick` }, { quoted: msg });
  },
};

module.exports = infoCommands;
