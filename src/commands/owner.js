const db = require("../utils/database");
const { makeHeader, makeFooter, C, isOwner, getJidNumber } = require("../utils/helpers");

const ownerCommands = {
  // ── ADD SUDO ──
  addsudo: async (sock, msg, from, args, sender) => {
    if (!isOwner(sender)) return sock.sendMessage(from, { text: `❌ *Owner only command!*` });
    const mentions = msg?.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const target = mentions[0] || (args[0] ? `${args[0].replace(/[^0-9]/g, "")}@s.whatsapp.net` : null);
    if (!target) return sock.sendMessage(from, { text: `⚠️ Tag or mention a user to add as sudo.\nUsage: *!addsudo @user*` });
    db.addSudo(getJidNumber(target));
    await sock.sendMessage(from, { text: `✅ *${target.split("@")[0]}* has been added as a *Sudo User*! 👑` }, { quoted: msg });
  },

  // ── DELETE SUDO ──
  delsudo: async (sock, msg, from, args, sender) => {
    if (!isOwner(sender)) return sock.sendMessage(from, { text: `❌ Owner only!` });
    const mentions = msg?.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const target = mentions[0] || (args[0] ? `${args[0].replace(/[^0-9]/g, "")}@s.whatsapp.net` : null);
    if (!target) return sock.sendMessage(from, { text: `⚠️ Tag the sudo to remove.\nUsage: *!delsudo @user*` });
    db.removeSudo(getJidNumber(target));
    await sock.sendMessage(from, { text: `✅ *${target.split("@")[0]}* removed from Sudo Users.` }, { quoted: msg });
  },

  // ── LIST SUDOS ──
  listsudo: async (sock, msg, from, args, sender) => {
    if (!isOwner(sender)) return sock.sendMessage(from, { text: `❌ Owner only!` });
    const sudos = db.getSudos();
    if (!sudos.length) return sock.sendMessage(from, { text: `ℹ️ No sudo users found.` });
    const list = sudos.map((s, i) => `${i + 1}. +${s}`).join("\n");
    await sock.sendMessage(from, { text: `👑 *Sudo Users*\n${C.line}\n${list}${makeFooter()}` });
  },

  // ── BAN USER ──
  ban: async (sock, msg, from, args, sender) => {
    if (!isOwner(sender) && !db.getSudos().includes(getJidNumber(sender))) return sock.sendMessage(from, { text: `❌ No permission!` });
    const mentions = msg?.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const target = mentions[0] || (args[0] ? `${args[0].replace(/[^0-9]/g, "")}@s.whatsapp.net` : null);
    if (!target) return sock.sendMessage(from, { text: `⚠️ Usage: *!ban @user*` });
    db.banUser(getJidNumber(target));
    await sock.sendMessage(from, { text: `🚫 *${target.split("@")[0]}* has been *BANNED* from using the bot!` }, { quoted: msg });
  },

  // ── UNBAN USER ──
  unban: async (sock, msg, from, args, sender) => {
    if (!isOwner(sender) && !db.getSudos().includes(getJidNumber(sender))) return sock.sendMessage(from, { text: `❌ No permission!` });
    const mentions = msg?.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const target = mentions[0] || (args[0] ? `${args[0].replace(/[^0-9]/g, "")}@s.whatsapp.net` : null);
    if (!target) return sock.sendMessage(from, { text: `⚠️ Usage: *!unban @user*` });
    db.unbanUser(getJidNumber(target));
    await sock.sendMessage(from, { text: `✅ *${target.split("@")[0]}* has been *UNBANNED*!` }, { quoted: msg });
  },

  // ── LIST BANNED ──
  listbanned: async (sock, msg, from, args, sender) => {
    if (!isOwner(sender) && !db.getSudos().includes(getJidNumber(sender))) return sock.sendMessage(from, { text: `❌ No permission!` });
    const banned = db.getBanned();
    if (!banned.length) return sock.sendMessage(from, { text: `ℹ️ No banned users.` });
    const list = banned.map((n, i) => `${i + 1}. +${n}`).join("\n");
    await sock.sendMessage(from, { text: `🚫 *Banned Users*\n${C.line}\n${list}${makeFooter()}` });
  },

  // ── BROADCAST ──
  broadcast: async (sock, msg, from, args, sender) => {
    if (!isOwner(sender)) return sock.sendMessage(from, { text: `❌ Owner only!` });
    const text = args.join(" ");
    if (!text) return sock.sendMessage(from, { text: `⚠️ Usage: *!broadcast <message>*` });
    const chats = await sock.groupFetchAllParticipating();
    let count = 0;
    for (const id of Object.keys(chats)) {
      try {
        await sock.sendMessage(id, { text: `📢 *Broadcast from Matarello 2.0*\n${C.line}\n${text}${makeFooter()}` });
        count++;
      } catch {}
    }
    await sock.sendMessage(from, { text: `✅ Broadcast sent to *${count}* groups!` });
  },

  // ── BLOCK ──
  block: async (sock, msg, from, args, sender) => {
    if (!isOwner(sender)) return sock.sendMessage(from, { text: `❌ Owner only!` });
    const mentions = msg?.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const target = mentions[0] || (args[0] ? `${args[0].replace(/[^0-9]/g, "")}@s.whatsapp.net` : null);
    if (!target) return sock.sendMessage(from, { text: `⚠️ Usage: *!block @user*` });
    await sock.updateBlockStatus(target, "block");
    await sock.sendMessage(from, { text: `🚫 *${target.split("@")[0]}* has been blocked!` }, { quoted: msg });
  },

  // ── UNBLOCK ──
  unblock: async (sock, msg, from, args, sender) => {
    if (!isOwner(sender)) return sock.sendMessage(from, { text: `❌ Owner only!` });
    const mentions = msg?.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const target = mentions[0] || (args[0] ? `${args[0].replace(/[^0-9]/g, "")}@s.whatsapp.net` : null);
    if (!target) return sock.sendMessage(from, { text: `⚠️ Usage: *!unblock @user*` });
    await sock.updateBlockStatus(target, "unblock");
    await sock.sendMessage(from, { text: `✅ *${target.split("@")[0]}* has been unblocked!` }, { quoted: msg });
  },

  // ── SET BOT STATUS ──
  setstatus: async (sock, msg, from, args, sender) => {
    if (!isOwner(sender)) return sock.sendMessage(from, { text: `❌ Owner only!` });
    const text = args.join(" ");
    if (!text) return sock.sendMessage(from, { text: `⚠️ Usage: *!setstatus <text>*` });
    await sock.updateProfileStatus(text);
    await sock.sendMessage(from, { text: `✅ Bot status updated to: _${text}_` }, { quoted: msg });
  },

  // ── SET BOT NAME ──
  setbotname: async (sock, msg, from, args, sender) => {
    if (!isOwner(sender)) return sock.sendMessage(from, { text: `❌ Owner only!` });
    const name = args.join(" ");
    if (!name) return sock.sendMessage(from, { text: `⚠️ Usage: *!setbotname <name>*` });
    await sock.updateProfileName(name);
    await sock.sendMessage(from, { text: `✅ Bot name updated to: *${name}*` }, { quoted: msg });
  },

  // ── LEAVE GROUP ──
  leave: async (sock, msg, from, args, sender) => {
    if (!isOwner(sender)) return sock.sendMessage(from, { text: `❌ Owner only!` });
    await sock.sendMessage(from, { text: `👋 Leaving this group. Bye bye!` });
    await sock.groupLeave(from);
  },

  // ── JOIN GROUP ──
  join: async (sock, msg, from, args, sender) => {
    if (!isOwner(sender)) return sock.sendMessage(from, { text: `❌ Owner only!` });
    const link = args[0];
    if (!link) return sock.sendMessage(from, { text: `⚠️ Usage: *!join <invite link>*` });
    const code = link.split("chat.whatsapp.com/").pop();
    try {
      await sock.groupAcceptInvite(code);
      await sock.sendMessage(from, { text: `✅ Joined group successfully!` });
    } catch {
      await sock.sendMessage(from, { text: `❌ Failed to join. Invalid or expired link.` });
    }
  },

  // ── MUTE BOT IN GROUP ──
  mutebot: async (sock, msg, from, args, sender) => {
    if (!isOwner(sender) && !db.getSudos().includes(getJidNumber(sender))) return sock.sendMessage(from, { text: `❌ No permission!` });
    db.muteGroup(from);
    await sock.sendMessage(from, { text: `🔇 Bot has been *muted* in this group. Only admins/owner can unmute.` });
  },

  // ── UNMUTE BOT IN GROUP ──
  unmutebot: async (sock, msg, from, args, sender) => {
    if (!isOwner(sender) && !db.getSudos().includes(getJidNumber(sender))) return sock.sendMessage(from, { text: `❌ No permission!` });
    db.unmuteGroup(from);
    await sock.sendMessage(from, { text: `🔊 Bot has been *unmuted* in this group!` });
  },

  // ── BOT STATS ──
  botstats: async (sock, msg, from, args, sender) => {
    if (!isOwner(sender) && !db.getSudos().includes(getJidNumber(sender))) return sock.sendMessage(from, { text: `❌ No permission!` });
    const stats = db.getStats();
    const lines = Object.entries(stats).map(([k, v]) => `• ${k}: ${v}`).join("\n");
    await sock.sendMessage(from, { text: `📊 *Bot Stats*\n${C.line}\n${lines || "No stats yet."}${makeFooter()}` });
  },

  // ── ADD BAD WORD ──
  addbadword: async (sock, msg, from, args, sender) => {
    if (!isOwner(sender) && !db.getSudos().includes(getJidNumber(sender))) return sock.sendMessage(from, { text: `❌ No permission!` });
    const word = args[0];
    if (!word) return sock.sendMessage(from, { text: `⚠️ Usage: *!addbadword <word>*` });
    db.addBadWord(word);
    await sock.sendMessage(from, { text: `✅ Added *${word}* to bad words list!` });
  },

  // ── REMOVE BAD WORD ──
  rmbadword: async (sock, msg, from, args, sender) => {
    if (!isOwner(sender) && !db.getSudos().includes(getJidNumber(sender))) return sock.sendMessage(from, { text: `❌ No permission!` });
    const word = args[0];
    if (!word) return sock.sendMessage(from, { text: `⚠️ Usage: *!rmbadword <word>*` });
    db.removeBadWord(word);
    await sock.sendMessage(from, { text: `✅ Removed *${word}* from bad words list!` });
  },

  // ── LIST BAD WORDS ──
  listbadwords: async (sock, msg, from, args, sender) => {
    if (!isOwner(sender) && !db.getSudos().includes(getJidNumber(sender))) return sock.sendMessage(from, { text: `❌ No permission!` });
    const words = db.getBadWords();
    if (!words.length) return sock.sendMessage(from, { text: `ℹ️ No bad words configured.` });
    await sock.sendMessage(from, { text: `🚫 *Bad Words List*\n${C.line}\n${words.map((w, i) => `${i + 1}. ${w}`).join("\n")}` });
  },

  // ── GIVE COINS ──
  givecoins: async (sock, msg, from, args, sender) => {
    if (!isOwner(sender)) return sock.sendMessage(from, { text: `❌ Owner only!` });
    const mentions = msg?.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const target = mentions[0];
    const amount = parseInt(args[1] || args[0]);
    if (!target || isNaN(amount)) return sock.sendMessage(from, { text: `⚠️ Usage: *!givecoins @user <amount>*` });
    db.addBalance(getJidNumber(target), amount);
    await sock.sendMessage(from, { text: `💰 Given *${amount} coins* to *${target.split("@")[0]}*!` });
  },
};

module.exports = ownerCommands;
