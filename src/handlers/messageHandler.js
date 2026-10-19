const cfg = require("../config");
const db = require("../utils/database");
const { isOwner, getJidNumber, isGroup, hasMedia, getMediaType } = require("../utils/helpers");
const { getChatbotResponse } = require("../chatbot/index");
const { transcribeVoiceNote } = require("../services/transcriptionService");

// Command registries
const ownerCmds = require("../commands/owner");
const groupCmds = require("../commands/group");
const funCmds = require("../commands/fun");
const utilityCmds = require("../commands/utility");
const infoCmds = require("../commands/info");
const mediaCmds = require("../commands/media");
const gameCmds = require("../commands/games");
const { settingsCommands, getSetting } = require("../commands/settings");
const extraCmds = require("../commands/extra");
const groupExtraCmds = require("../commands/groupextra");
const sportsCmds = require("../commands/sports");
const advancedCmds = require("../commands/advanced");
const stickerCmds = require("../commands/stickers");
const audioCmds = require("../commands/audio");
const extraUserCmds = require("../commands/userRequested");
const stickerService = require("../services/stickerService");

// Merge all commands into one registry
const ALL_COMMANDS = {
  ...infoCmds,
  ...funCmds,
  ...utilityCmds,
  ...mediaCmds,
  ...groupCmds,
  ...ownerCmds,
  ...settingsCommands,
  ...extraCmds,
  ...groupExtraCmds,
  ...sportsCmds,
  ...advancedCmds,
  ...stickerCmds,
  ...audioCmds,
  ...extraUserCmds,
};

function getCommandPrefixes() {
  // "!" remains accepted as a legacy alias for existing chats.
  return [...new Set([getSetting("prefix", cfg.prefix), "!"])];
}
const chatbotReplyAt = new Map();
const CHATBOT_COOLDOWN_MS = 2500;

function getBody(msg) {
  const m = msg.message;
  if (!m) return "";
  return (
    m.conversation ||
    m.extendedTextMessage?.text ||
    m.imageMessage?.caption ||
    m.videoMessage?.caption ||
    m.buttonsResponseMessage?.selectedButtonId ||
    m.listResponseMessage?.singleSelectReply?.selectedRowId ||
    ""
  );
}

function isBotMentioned(msg, botJid) {
  const mentions = msg?.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
  return mentions.includes(botJid);
}

function isReplyToBot(msg, botJid) {
  const participant = msg?.message?.extendedTextMessage?.contextInfo?.participant;
  return participant === botJid;
}

async function handleMessage(sock, msg) {
  try {
    if (!msg.message) return;

    const from = msg.key.remoteJid;
    const fromMe = Boolean(msg.key.fromMe);
    const botJid = sock.user?.id?.replace(/:.*@/, "@") || `${cfg.botNumber}@s.whatsapp.net`;
    const sender = fromMe ? botJid : (msg.key.participant || msg.key.remoteJid);
    const isBotSender = getJidNumber(sender) === getJidNumber(botJid);
    const senderNum = getJidNumber(sender);
    const body = getBody(msg);
    const inGroup = isGroup(from);
    const commandPrefix = getCommandPrefixes().find((candidate) => body && body.startsWith(candidate));

    // Messages authored by the linked account may run commands, but must never
    // enter chatbot or automated-reply handling.
    if ((fromMe || isBotSender) && !commandPrefix) return;

    // ── BOT MODE CHECK ──
    const mode = getSetting("mode", "public");
    if (mode === "self" && !isOwner(sender) && !db.getSudos().includes(senderNum)) return;
    if (mode === "group" && !inGroup) return;

    // ── IGNORE LIST ──
    const s = (() => { try { return JSON.parse(require("fs").readFileSync(require("path").join(__dirname, "../data/db/botsettings.json"), "utf8")); } catch { return {}; } })();
    if ((s.ignorelist || []).includes(senderNum)) return;

    // ── BANNED CHECK ──
    if (db.getBanned().includes(senderNum) && !isOwner(sender)) return;

    // ── MUTED CHECK ──
    if (inGroup && db.isGroupMuted(from) && !isOwner(sender) && !db.getSudos().includes(senderNum)) return;

    // ── AUTO READ ──
    if (getSetting("autoread")) {
      try { await sock.readMessages([msg.key]); } catch {}
    }

    // ── AUTO TYPING PRESENCE ──
    if (getSetting("autotype")) {
      try { await sock.sendPresenceUpdate("composing", from); } catch {}
    }

    // ── AUTO RECORDING PRESENCE ──
    if (getSetting("autorecord") || getSetting("autorecordtyping")) {
      try { await sock.sendPresenceUpdate("recording", from); } catch {}
    }

    // ── ANTI VIEW ONCE ──
    if (getSetting("antiviewonce") && msg.message?.viewOnceMessage) {
      try {
        const inner = msg.message.viewOnceMessage.message;
        const type = Object.keys(inner)[0];
        if (type === "imageMessage" || type === "videoMessage" || type === "audioMessage") {
          const { downloadMediaMessage } = require("@whiskeysockets/baileys");
          const buf = await downloadMediaMessage({ message: inner, key: msg.key }, "buffer", {});
          const mediaKey = type === "imageMessage" ? "image" : type === "videoMessage" ? "video" : "audio";
          await sock.sendMessage(cfg.ownerNumber + "@s.whatsapp.net", {
            [mediaKey]: buf,
            caption: `👁️ View-once bypass from ${sender.split("@")[0]} in ${from}`,
          });
        }
      } catch {}
    }

    // ── BAD WORD FILTER ──
    if (body) {
      const badWords = db.getBadWords();
      const low = body.toLowerCase();
      if (badWords.some((w) => low.includes(w))) {
        if (inGroup) {
          try { await sock.sendMessage(from, { delete: msg.key }); } catch {}
          await sock.sendMessage(from, { text: `🚫 That word is not allowed here!`, mentions: [sender] });
        }
        return;
      }
    }

    // ── ANTILINK ──
    if (inGroup && body) {
      const linkRegex = /(https?:\/\/|chat\.whatsapp\.com\/)/i;
      if ((db.getAntilink(from) || getSetting(`antilinkgc_${from}`)) && linkRegex.test(body)) {
        const isAdmin = await (async () => {
          try {
            const meta = await sock.groupMetadata(from);
            return meta.participants.filter((p) => p.admin).map((p) => p.id).includes(sender);
          } catch { return false; }
        })();
        if (!isAdmin && !isOwner(sender)) {
          try { await sock.sendMessage(from, { delete: msg.key }); } catch {}
          await sock.sendMessage(from, { text: `🔗 No links allowed here! @${senderNum}`, mentions: [sender] });
          return;
        }
      }
    }

    // ── AFK CHECK ──
    const mentions = msg?.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    for (const mentionedJid of mentions) {
      const afkList = db.getAfk();
      const mNum = getJidNumber(mentionedJid);
      if (afkList[mNum]) {
        const { reason, time } = afkList[mNum];
        const elapsed = Math.floor((Date.now() - time) / 60000);
        await sock.sendMessage(from, { text: `😴 *@${mNum} is currently AFK*\nReason: ${reason}\nSince: ${elapsed} min ago`, mentions: [mentionedJid] });
      }
    }
    if (body && db.getAfk()[senderNum]) {
      db.clearAfk(senderNum);
      await sock.sendMessage(from, { text: `✅ Welcome back *@${senderNum}*! AFK mode cleared.`, mentions: [sender] });
    }

    // ── AUTO REACT ──
    if (!fromMe && getSetting(`autoreact_${from}`) && !commandPrefix) {
      const emojis = ["❤️", "🔥", "😂", "👏", "🙌", "💯", "😍", "🎉"];
      try {
        await sock.sendMessage(from, { react: { text: require("../utils/helpers").getRandom(emojis), key: msg.key } });
      } catch {}
    }

    // ── COMMAND HANDLING ──
    if (body && commandPrefix) {
      const [rawCmd, ...args] = body.slice(commandPrefix.length).trim().split(/\s+/);
      const cmd = rawCmd.toLowerCase();

      db.incrementStat("commands_used");

      // ── AUTO TYPING for commands ──
      if (getSetting("autotype")) {
        try { await sock.sendPresenceUpdate("composing", from); } catch {}
      }

      // Check game commands first
      if (gameCmds[cmd] && typeof gameCmds[cmd] === "function") {
        return await gameCmds[cmd](sock, msg, from, args, sender);
      }

      if (ALL_COMMANDS[cmd]) {
        return await ALL_COMMANDS[cmd](sock, msg, from, args, sender);
      }

      // Unknown command
      if (!inGroup) {
        await sock.sendMessage(from, { text: `❓ Unknown command: *${commandPrefix}${cmd}*\nType *${commandPrefix}menu* for all commands!` }, { quoted: msg });
      }
      return;
    }

    // ── ACTIVE GAME HANDLER ──
    if (body) {
      const handled = await gameCmds.checkgame(sock, msg, from, body.trim());
      if (handled) return;
    }

    // ── CHATBOT ──
    if (fromMe || isBotSender) return;
    if (!getSetting("chatbot", false)) return; // chatbot disabled by default

    const shouldRespond = (() => {
      if (!inGroup) return true; // Always respond in DM
      if ((msg?.message?.extendedTextMessage?.contextInfo?.mentionedJid || [])
        .some((jid) => getJidNumber(jid) === getJidNumber(botJid))) return true;
      if (isReplyToBot(msg, botJid)) return true;
      return false;
    })();

    if (shouldRespond) {
      const responseKey = `${from}:${senderNum}`;
      const now = Date.now();
      const lastReplyAt = chatbotReplyAt.get(responseKey);
      if (lastReplyAt && now - lastReplyAt < CHATBOT_COOLDOWN_MS) return;
      chatbotReplyAt.set(responseKey, now);
      if (chatbotReplyAt.size > 1000) {
        for (const [key, timestamp] of chatbotReplyAt) {
          if (now - timestamp > 60_000) chatbotReplyAt.delete(key);
        }
        while (chatbotReplyAt.size > 1000) chatbotReplyAt.delete(chatbotReplyAt.keys().next().value);
      }
      const hasMedia_ = hasMedia(msg);
      if (body || hasMedia_) {
        const chatId = `${from}:${senderNum}`;
        db.incrementStat("chatbot_responses");
        let transcribedText = "";
        if (getMediaType(msg) === "audio") {
          try {
            transcribedText = await transcribeVoiceNote(msg) || "";
          } catch (err) {
            console.error("Voice transcription error:", err.message);
            await sock.sendMessage(
              from,
              { text: "🎤 I received your voice note, but I couldn't transcribe it right now. Please try again or send it as text." },
              { quoted: msg },
            );
            return;
          }
        }

        const response = await getChatbotResponse(msg, transcribedText, chatId);
        if (response) {
          if (getSetting("autotype")) {
            try { await sock.sendPresenceUpdate("composing", from); } catch {}
            await require("../utils/helpers").sleep(800);
          }
          const transcriptNotice = transcribedText
            ? `📝 *I heard:*\n_${transcribedText.slice(0, 1200)}_\n\n`
            : "";
          await sock.sendMessage(from, { text: `${transcriptNotice}${response}` }, { quoted: msg });

          const sticker = stickerService.chooseSticker(`${body} ${transcribedText}`);
          if (sticker && getSetting("chatbotstickers", true)) {
            const stickerBuffer = stickerService.getStickerBuffer(sticker);
            if (stickerBuffer) await sock.sendMessage(from, { sticker: stickerBuffer }, { quoted: msg });
          }

          const explicitlyAskedForVoice = /\b(?:send|reply|say|record|speak|make)\b[\s\S]{0,50}\b(?:voice\s?note|voice\s?message|audio)\b/i.test(body);
          const replyWithVoice = getSetting("chatbotvoice", false)
            || (getMediaType(msg) === "audio" && Boolean(transcribedText))
            || explicitlyAskedForVoice;
          if (replyWithVoice) {
            try {
              const { generateVoiceNote } = require("../services/elevenlabs");
              const audio = await generateVoiceNote(response);
              await sock.sendMessage(from, {
                audio,
                mimetype: "audio/ogg; codecs=opus",
                ptt: true,
              }, { quoted: msg });
            } catch (err) {
              console.error("Voice reply error:", err.message);
              await sock.sendMessage(from, {
                text: `I replied in text, but couldn't generate the voice note: ${err.message}`,
              }, { quoted: msg });
            }
          }
        }
      }
    }

  } catch (err) {
    console.error("Handler error:", err.message);
  }
}

async function handleGroupUpdate(sock, update) {
  try {
    const { id, participants, action } = update;

    if (action === "add") {
      const welcomeMsg = db.getWelcome(id);
      const tos = (() => { try { return JSON.parse(require("fs").readFileSync(require("path").join(__dirname, "../data/db/botsettings.json"), "utf8"))[`tos_${id}`]; } catch { return null; } })();
      for (const participant of participants) {
        const num = participant.split("@")[0];
        let text = welcomeMsg
          ? welcomeMsg.replace("{name}", `@${num}`)
          : `🎉 *Welcome to the group, @${num}!*\n\nWe're glad to have you here! 🙌\nPlease read the group rules and enjoy your stay! 😊`;
        if (tos) text += `\n\n📋 *Group Rules:*\n${tos}`;
        await sock.sendMessage(id, { text, mentions: [participant] });
      }
    }

    if (action === "remove") {
      const goodbyeMsg = db.getGoodbye(id);
      for (const participant of participants) {
        const num = participant.split("@")[0];
        const text = goodbyeMsg
          ? goodbyeMsg.replace("{name}", `@${num}`)
          : `👋 *@${num} has left the group.*\nSafe travels! 🙏`;
        await sock.sendMessage(id, { text, mentions: [participant] });
      }
    }

    if (action === "promote" && (() => { try { return JSON.parse(require("fs").readFileSync(require("path").join(__dirname, "../data/db/botsettings.json"), "utf8"))[`antidemote_${id}`]; } catch { return false; } })()) {
      // Anti-demote: if someone was demoted, re-promote them
    }

  } catch (err) {
    console.error("Group update error:", err.message);
  }
}

async function handleCallUpdate(sock, calls) {
  for (const call of calls) {
    if (call.status === "offer" && getSetting("anticall")) {
      try {
        await sock.rejectCall(call.id, call.from);
        const msg = getSetting("anticallmsg") || "Sorry, I don't accept calls. Please send a message instead.";
        await sock.sendMessage(call.from, { text: `📵 ${msg}` });
      } catch {}
    }
  }
}

module.exports = { handleMessage, handleGroupUpdate, handleCallUpdate };
