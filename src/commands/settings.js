const db = require("../utils/database");
const { makeHeader, makeFooter, C, isOwner, getJidNumber } = require("../utils/helpers");
const cfg = require("../config");
const fs = require("fs");
const path = require("path");

const SETTINGS_FILE = path.join(__dirname, "../data/db/botsettings.json");

function getSettings() {
  try { return JSON.parse(fs.readFileSync(SETTINGS_FILE, "utf8")); } catch { return {}; }
}
function saveSettings(data) {
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(data, null, 2));
}
function getSetting(key, def = false) {
  return getSettings()[key] ?? def;
}
function setSetting(key, val) {
  const s = getSettings(); s[key] = val; saveSettings(s);
}

const settingsCommands = {

  // ── PAIRING CODE ──
  pair: async (sock, msg, from, args, sender) => {
    if (!isOwner(sender)) return sock.sendMessage(from, { text: `❌ Owner only!` });
    await sock.sendMessage(from, { text: `🔑 Restart the bot to get a fresh pairing code. The code appears in the console/terminal tab.` }, { quoted: msg });
  },

  // ── BOT MODE ──
  mode: async (sock, msg, from, args, sender) => {
    if (!isOwner(sender) && !db.getSudos().includes(getJidNumber(sender))) return sock.sendMessage(from, { text: `❌ No permission!` });
    const m = args[0]?.toLowerCase();
    if (!["public", "self", "group"].includes(m)) return sock.sendMessage(from, { text: `⚠️ Usage: *!mode public/self/group*\n• *public* - Everyone can use commands\n• *self* - Only owner can use commands\n• *group* - Commands work in groups only` });
    setSetting("mode", m);
    await sock.sendMessage(from, { text: `✅ Bot mode set to *${m.toUpperCase()}*!` }, { quoted: msg });
  },

  setprefix: async (sock, msg, from, args, sender) => {
    if (!isOwner(sender) && !db.getSudos().includes(getJidNumber(sender))) {
      return sock.sendMessage(from, { text: "❌ No permission!" }, { quoted: msg });
    }
    const prefix = String(args[0] || "");
    if (!/^[^\sA-Za-z0-9]{1,3}$/u.test(prefix)) {
      return sock.sendMessage(from, { text: "Usage: *.setprefix <1-3 punctuation characters>*\nExample: *.setprefix ?" }, { quoted: msg });
    }
    setSetting("prefix", prefix);
    await sock.sendMessage(from, { text: `✅ Prefix changed to *${prefix}*. The legacy *!* prefix still works.` }, { quoted: msg });
  },

  // ── CHATBOT TOGGLE ──
  chatbot: async (sock, msg, from, args, sender) => {
    if (!isOwner(sender) && !db.getSudos().includes(getJidNumber(sender))) return sock.sendMessage(from, { text: `❌ No permission!` });
    const current = getSetting("chatbot", false);
    setSetting("chatbot", !current);
    await sock.sendMessage(from, { text: `🤖 Chatbot is now *${!current ? "ON 🟢" : "OFF 🔴"}*!` }, { quoted: msg });
  },

  chatbotvoice: async (sock, msg, from, args, sender) => {
    if (!isOwner(sender) && !db.getSudos().includes(getJidNumber(sender))) return sock.sendMessage(from, { text: "❌ No permission!" }, { quoted: msg });
    const enabled = !getSetting("chatbotvoice", false);
    setSetting("chatbotvoice", enabled);
    await sock.sendMessage(from, {
      text: `🎙️ Chatbot voice replies are now *${enabled ? "ON" : "OFF"}*. ${enabled ? "ElevenLabs access is required to generate speech." : ""}`.trim(),
    }, { quoted: msg });
  },

  chatbotstickers: async (sock, msg, from, args, sender) => {
    if (!isOwner(sender) && !db.getSudos().includes(getJidNumber(sender))) return sock.sendMessage(from, { text: "❌ No permission!" }, { quoted: msg });
    const enabled = !getSetting("chatbotstickers", true);
    setSetting("chatbotstickers", enabled);
    await sock.sendMessage(from, { text: `⭐ Situation-matched favorite stickers are now *${enabled ? "ON" : "OFF"}*.` }, { quoted: msg });
  },

  // ── AUTO READ ──
  autoread: async (sock, msg, from, args, sender) => {
    if (!isOwner(sender)) return sock.sendMessage(from, { text: `❌ Owner only!` });
    const val = getSetting("autoread");
    setSetting("autoread", !val);
    await sock.sendMessage(from, { text: `👁️ Auto-read is now *${!val ? "ON 🟢" : "OFF 🔴"}*!` });
  },

  // ── AUTO TYPING ──
  autotype: async (sock, msg, from, args, sender) => {
    if (!isOwner(sender)) return sock.sendMessage(from, { text: `❌ Owner only!` });
    const val = getSetting("autotype");
    setSetting("autotype", !val);
    await sock.sendMessage(from, { text: `⌨️ Auto-typing indicator is now *${!val ? "ON 🟢" : "OFF 🔴"}*!` });
  },

  // ── AUTO RECORD ──
  autorecord: async (sock, msg, from, args, sender) => {
    if (!isOwner(sender)) return sock.sendMessage(from, { text: `❌ Owner only!` });
    const val = getSetting("autorecord");
    setSetting("autorecord", !val);
    await sock.sendMessage(from, { text: `🎤 Auto-recording indicator is now *${!val ? "ON 🟢" : "OFF 🔴"}*!` });
  },

  // ── AUTO RECORDING + TYPING (combined) ──
  autorecordtyping: async (sock, msg, from, args, sender) => {
    if (!isOwner(sender)) return sock.sendMessage(from, { text: `❌ Owner only!` });
    const val = getSetting("autorecordtyping");
    setSetting("autorecordtyping", !val);
    await sock.sendMessage(from, { text: `🎤⌨️ Auto record+typing is now *${!val ? "ON 🟢" : "OFF 🔴"}*!` });
  },

  // ── ANTI CALL ──
  anticall: async (sock, msg, from, args, sender) => {
    if (!isOwner(sender)) return sock.sendMessage(from, { text: `❌ Owner only!` });
    const val = getSetting("anticall");
    setSetting("anticall", !val);
    await sock.sendMessage(from, { text: `📵 Anti-call is now *${!val ? "ON 🟢" : "OFF 🔴"}*!\n${!val ? "All incoming calls will be automatically rejected." : "Calls will no longer be blocked."}` });
  },

  // ── ANTI DELETE ──
  antidelete: async (sock, msg, from, args, sender) => {
    if (!isOwner(sender) && !db.getSudos().includes(getJidNumber(sender))) return sock.sendMessage(from, { text: `❌ No permission!` });
    const val = getSetting(`antidelete_${from}`);
    setSetting(`antidelete_${from}`, !val);
    await sock.sendMessage(from, { text: `🛡️ Anti-delete is now *${!val ? "ON 🟢" : "OFF 🔴"}*!` });
  },

  // ── ANTI DELETE STATUS ──
  antideletestatus: async (sock, msg, from, args, sender) => {
    if (!isOwner(sender)) return sock.sendMessage(from, { text: `❌ Owner only!` });
    const val = getSetting("antideletestatus");
    setSetting("antideletestatus", !val);
    await sock.sendMessage(from, { text: `🛡️ Anti-delete status is now *${!val ? "ON 🟢" : "OFF 🔴"}*!` });
  },

  // ── ANTI EDIT ──
  antiedit: async (sock, msg, from, args, sender) => {
    if (!isOwner(sender) && !db.getSudos().includes(getJidNumber(sender))) return sock.sendMessage(from, { text: `❌ No permission!` });
    const val = getSetting(`antiedit_${from}`);
    setSetting(`antiedit_${from}`, !val);
    await sock.sendMessage(from, { text: `✏️ Anti-edit detection is now *${!val ? "ON 🟢" : "OFF 🔴"}*!` });
  },

  // ── ANTI VIEW ONCE ──
  antiviewonce: async (sock, msg, from, args, sender) => {
    if (!isOwner(sender) && !db.getSudos().includes(getJidNumber(sender))) return sock.sendMessage(from, { text: `❌ No permission!` });
    const val = getSetting("antiviewonce");
    setSetting("antiviewonce", !val);
    await sock.sendMessage(from, { text: `👁️ Anti-view-once is now *${!val ? "ON 🟢" : "OFF 🔴"}*!\n${!val ? "View-once media will be re-sent to you." : "Disabled."}` });
  },

  // ── AUTO REACT ──
  autoreact: async (sock, msg, from, args, sender) => {
    if (!isOwner(sender) && !db.getSudos().includes(getJidNumber(sender))) return sock.sendMessage(from, { text: `❌ No permission!` });
    const val = getSetting(`autoreact_${from}`);
    setSetting(`autoreact_${from}`, !val);
    await sock.sendMessage(from, { text: `💖 Auto-react is now *${!val ? "ON 🟢" : "OFF 🔴"}*!` });
  },

  // ── AUTO REACT STATUS ──
  autoreactstatus: async (sock, msg, from, args, sender) => {
    if (!isOwner(sender)) return sock.sendMessage(from, { text: `❌ Owner only!` });
    const val = getSetting("autoreactstatus");
    setSetting("autoreactstatus", !val);
    await sock.sendMessage(from, { text: `💖 Auto-react to statuses is now *${!val ? "ON 🟢" : "OFF 🔴"}*!` });
  },

  // ── AUTO VIEW STATUS ──
  autoviewstatus: async (sock, msg, from, args, sender) => {
    if (!isOwner(sender)) return sock.sendMessage(from, { text: `❌ Owner only!` });
    const val = getSetting("autoviewstatus");
    setSetting("autoviewstatus", !val);
    await sock.sendMessage(from, { text: `👁️ Auto-view status is now *${!val ? "ON 🟢" : "OFF 🔴"}*!` });
  },

  // ── AUTO SAVE STATUS ──
  autosavestatus: async (sock, msg, from, args, sender) => {
    if (!isOwner(sender)) return sock.sendMessage(from, { text: `❌ Owner only!` });
    const val = getSetting("autosavestatus");
    setSetting("autosavestatus", !val);
    await sock.sendMessage(from, { text: `💾 Auto-save status is now *${!val ? "ON 🟢" : "OFF 🔴"}*!` });
  },

  // ── AUTO BIO ──
  autobio: async (sock, msg, from, args, sender) => {
    if (!isOwner(sender)) return sock.sendMessage(from, { text: `❌ Owner only!` });
    const val = getSetting("autobio");
    setSetting("autobio", !val);
    await sock.sendMessage(from, { text: `📝 Auto-bio (clock-based bio) is now *${!val ? "ON 🟢" : "OFF 🔴"}*!` });
  },

  // ── AUTO BLOCK ──
  autoblock: async (sock, msg, from, args, sender) => {
    if (!isOwner(sender)) return sock.sendMessage(from, { text: `❌ Owner only!` });
    const val = getSetting("autoblock");
    setSetting("autoblock", !val);
    await sock.sendMessage(from, { text: `🚫 Auto-block unknown numbers is now *${!val ? "ON 🟢" : "OFF 🔴"}*!` });
  },

  // ── ANTI BUG ──
  antibug: async (sock, msg, from, args, sender) => {
    if (!isOwner(sender)) return sock.sendMessage(from, { text: `❌ Owner only!` });
    const val = getSetting("antibug");
    setSetting("antibug", !val);
    await sock.sendMessage(from, { text: `🛡️ Anti-bug protection is now *${!val ? "ON 🟢" : "OFF 🔴"}*!` });
  },

  // ── ALWAYS ONLINE ──
  alwaysonline: async (sock, msg, from, args, sender) => {
    if (!isOwner(sender)) return sock.sendMessage(from, { text: `❌ Owner only!` });
    const val = getSetting("alwaysonline");
    setSetting("alwaysonline", !val);
    if (!val) await sock.sendPresenceUpdate("available");
    await sock.sendMessage(from, { text: `🟢 Always-online is now *${!val ? "ON 🟢" : "OFF 🔴"}*!` });
  },

  // ── ONLINE STATUS ──
  online: async (sock, msg, from, args, sender) => {
    if (!isOwner(sender) && !db.getSudos().includes(getJidNumber(sender))) return sock.sendMessage(from, { text: `❌ No permission!` });
    await sock.sendPresenceUpdate("available");
    await sock.sendMessage(from, { text: `✅ Bot presence set to *online*!` }, { quoted: msg });
  },

  // ── MODE STATUS ──
  modestatus: async (sock, msg, from) => {
    const mode = getSetting("mode", "public");
    await sock.sendMessage(from, { text: `⚙️ *Current Bot Mode:* ${mode.toUpperCase()}` }, { quoted: msg });
  },

  // ── GET SETTINGS ──
  getsettings: async (sock, msg, from, args, sender) => {
    if (!isOwner(sender) && !db.getSudos().includes(getJidNumber(sender))) return sock.sendMessage(from, { text: `❌ No permission!` });
    const s = getSettings();
    const entries = Object.entries(s).map(([k, v]) => `• *${k}:* ${JSON.stringify(v)}`).join("\n");
    await sock.sendMessage(from, { text: `⚙️ *Bot Settings:*\n${C.line}\n${entries || "No settings configured."}${makeFooter()}` });
  },

  // ── RESET SETTINGS ──
  resetsetting: async (sock, msg, from, args, sender) => {
    if (!isOwner(sender)) return sock.sendMessage(from, { text: `❌ Owner only!` });
    saveSettings({});
    await sock.sendMessage(from, { text: `♻️ All settings have been *reset to default*!` }, { quoted: msg });
  },

  // ── SET BOT NAME ──
  setbotname: async (sock, msg, from, args, sender) => {
    if (!isOwner(sender)) return sock.sendMessage(from, { text: `❌ Owner only!` });
    const name = args.join(" ");
    if (!name) return sock.sendMessage(from, { text: `⚠️ Usage: *!setbotname <name>*` });
    try { await sock.updateProfileName(name); } catch {}
    setSetting("botname", name);
    await sock.sendMessage(from, { text: `✅ Bot name updated to *${name}*!` }, { quoted: msg });
  },

  // ── SET OWNER NAME ──
  setownername: async (sock, msg, from, args, sender) => {
    if (!isOwner(sender)) return sock.sendMessage(from, { text: `❌ Owner only!` });
    const name = args.join(" ");
    if (!name) return sock.sendMessage(from, { text: `⚠️ Usage: *!setownername <name>*` });
    setSetting("ownername", name);
    await sock.sendMessage(from, { text: `✅ Owner name set to *${name}*!` }, { quoted: msg });
  },

  // ── SET OWNER NUMBER ──
  setownernumber: async (sock, msg, from, args, sender) => {
    if (!isOwner(sender)) return sock.sendMessage(from, { text: `❌ Owner only!` });
    const num = args[0]?.replace(/[^0-9]/g, "");
    if (!num) return sock.sendMessage(from, { text: `⚠️ Usage: *!setownernumber <number>*` });
    setSetting("ownernumber", num);
    await sock.sendMessage(from, { text: `✅ Owner number updated to *+${num}*!` }, { quoted: msg });
  },

  // ── SET BIO ──
  setbio: async (sock, msg, from, args, sender) => {
    if (!isOwner(sender)) return sock.sendMessage(from, { text: `❌ Owner only!` });
    const text = args.join(" ");
    if (!text) return sock.sendMessage(from, { text: `⚠️ Usage: *!setbio <text>*` });
    try { await sock.updateProfileStatus(text); } catch {}
    await sock.sendMessage(from, { text: `✅ Bio updated to: _${text}_` }, { quoted: msg });
  },

  // ── SET PROFILE PIC ──
  setprofilepic: async (sock, msg, from, args, sender) => {
    if (!isOwner(sender)) return sock.sendMessage(from, { text: `❌ Owner only!` });
    const quoted = msg?.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const imageMsg = quoted?.imageMessage;
    if (!imageMsg) return sock.sendMessage(from, { text: `⚠️ Reply to an image with *!setprofilepic*` });
    try {
      const { downloadMediaMessage } = require("@whiskeysockets/baileys");
      const buffer = await downloadMediaMessage({ message: { imageMessage: imageMsg }, key: msg.key }, "buffer", {});
      await sock.updateProfilePicture(sock.user.id, buffer);
      await sock.sendMessage(from, { text: `✅ Bot profile picture updated!` }, { quoted: msg });
    } catch (e) { await sock.sendMessage(from, { text: `❌ Failed: ${e.message}` }); }
  },

  // ── GET PP ──
  getpp: async (sock, msg, from, args, sender) => {
    const mentions = msg?.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const target = mentions[0] || sender;
    try {
      const url = await sock.profilePictureUrl(target, "image");
      const axios = require("axios");
      const res = await axios.get(url, { responseType: "arraybuffer" });
      await sock.sendMessage(from, { image: Buffer.from(res.data), caption: `🖼️ Profile picture of @${target.split("@")[0]}`, mentions: [target] }, { quoted: msg });
    } catch { await sock.sendMessage(from, { text: `❌ Could not fetch profile picture. It may be private or unavailable.` }); }
  },

  // ── GET ABOUT ──
  getabout: async (sock, msg, from, args) => {
    const mentions = msg?.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const target = mentions[0] || (args[0] ? `${args[0].replace(/[^0-9]/g, "")}@s.whatsapp.net` : sender);
    try {
      const status = await sock.fetchStatus(target);
      await sock.sendMessage(from, { text: `📝 *About @${target.split("@")[0]}:*\n\n_${status?.status || "No status set"}_`, mentions: [target] }, { quoted: msg });
    } catch { await sock.sendMessage(from, { text: `❌ Could not fetch status. May be private.` }); }
  },

  // ── SET FONT ──
  setfont: async (sock, msg, from, args, sender) => {
    if (!isOwner(sender) && !db.getSudos().includes(getJidNumber(sender))) return sock.sendMessage(from, { text: `❌ No permission!` });
    const font = args[0]?.toLowerCase();
    const fonts = ["bold", "italic", "mono", "normal"];
    if (!font || !fonts.includes(font)) return sock.sendMessage(from, { text: `⚠️ Usage: *!setfont bold/italic/mono/normal*` });
    setSetting("font", font);
    await sock.sendMessage(from, { text: `✅ Bot font set to *${font}*!` });
  },

  // ── SET TIMEZONE ──
  settimezone: async (sock, msg, from, args, sender) => {
    if (!isOwner(sender)) return sock.sendMessage(from, { text: `❌ Owner only!` });
    const tz = args[0];
    if (!tz) return sock.sendMessage(from, { text: `⚠️ Usage: *!settimezone <timezone>*\nExample: !settimezone Africa/Lagos` });
    setSetting("timezone", tz);
    await sock.sendMessage(from, { text: `✅ Timezone set to *${tz}*!` });
  },

  // ── SET STATUS EMOJI ──
  setstatusemoji: async (sock, msg, from, args, sender) => {
    if (!isOwner(sender)) return sock.sendMessage(from, { text: `❌ Owner only!` });
    const emoji = args[0];
    if (!emoji) return sock.sendMessage(from, { text: `⚠️ Usage: *!setstatusemoji <emoji>*` });
    setSetting("statusemoji", emoji);
    await sock.sendMessage(from, { text: `✅ Status emoji set to ${emoji}!` });
  },

  // ── SET STICKER AUTHOR/PACK ──
  setstickerauthor: async (sock, msg, from, args, sender) => {
    if (!isOwner(sender)) return sock.sendMessage(from, { text: `❌ Owner only!` });
    const text = args.join(" ");
    if (!text) return sock.sendMessage(from, { text: `⚠️ Usage: *!setstickerauthor <name>*` });
    setSetting("stickerauthor", text);
    await sock.sendMessage(from, { text: `✅ Sticker author set to *${text}*!` });
  },

  setstickerpackname: async (sock, msg, from, args, sender) => {
    if (!isOwner(sender)) return sock.sendMessage(from, { text: `❌ Owner only!` });
    const text = args.join(" ");
    if (!text) return sock.sendMessage(from, { text: `⚠️ Usage: *!setstickerpackname <name>*` });
    setSetting("stickerpackname", text);
    await sock.sendMessage(from, { text: `✅ Sticker pack name set to *${text}*!` });
  },

  // ── SET WATERMARK ──
  setwatermark: async (sock, msg, from, args, sender) => {
    if (!isOwner(sender)) return sock.sendMessage(from, { text: `❌ Owner only!` });
    const text = args.join(" ");
    setSetting("watermark", text || "Matarello 2.0");
    await sock.sendMessage(from, { text: `✅ Watermark set to *${text || "Matarello 2.0"}*!` });
  },

  // ── SET/DEL STICKER CMD ──
  setstickercmd: async (sock, msg, from, args, sender) => {
    if (!isOwner(sender)) return sock.sendMessage(from, { text: `❌ Owner only!` });
    const text = args.join(" ");
    setSetting("stickercmd", text);
    await sock.sendMessage(from, { text: `✅ Sticker command caption set to: _${text}_` });
  },

  delstickercmd: async (sock, msg, from, args, sender) => {
    if (!isOwner(sender)) return sock.sendMessage(from, { text: `❌ Owner only!` });
    setSetting("stickercmd", "");
    await sock.sendMessage(from, { text: `✅ Sticker command caption cleared!` });
  },

  // ── SET WARN ──
  setwarn: async (sock, msg, from, args, sender) => {
    if (!isOwner(sender) && !db.getSudos().includes(getJidNumber(sender))) return sock.sendMessage(from, { text: `❌ No permission!` });
    const num = parseInt(args[0]);
    if (isNaN(num) || num < 1) return sock.sendMessage(from, { text: `⚠️ Usage: *!setwarn <number>*\nExample: !setwarn 3` });
    setSetting("maxwarn", num);
    await sock.sendMessage(from, { text: `✅ Max warns set to *${num}*! Users will be kicked after ${num} warnings.` });
  },

  // ── LIST WARN ──
  listwarn: async (sock, msg, from, args, sender) => {
    if (!isOwner(sender) && !db.getSudos().includes(getJidNumber(sender))) return sock.sendMessage(from, { text: `❌ No permission!` });
    try {
      const rawDb = fs.readFileSync(path.join(__dirname, "../data/db/warns.json"), "utf8");
      const warns = JSON.parse(rawDb);
      if (!Object.keys(warns).length) return sock.sendMessage(from, { text: `ℹ️ No warnings recorded.` });
      const list = Object.entries(warns).map(([k, v]) => `• ${k}: ${v} warn(s)`).join("\n");
      await sock.sendMessage(from, { text: `⚠️ *All Warnings:*\n${C.line}\n${list}${makeFooter()}` });
    } catch { await sock.sendMessage(from, { text: `ℹ️ No warnings recorded yet.` }); }
  },

  // ── RESET WARN ──
  resetwarn: async (sock, msg, from, args, sender) => {
    if (!isOwner(sender) && !db.getSudos().includes(getJidNumber(sender))) return sock.sendMessage(from, { text: `❌ No permission!` });
    const mentions = msg?.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    if (!mentions.length) {
      fs.writeFileSync(path.join(__dirname, "../data/db/warns.json"), "{}");
      return sock.sendMessage(from, { text: `♻️ All warnings have been reset!` });
    }
    db.resetWarns(mentions[0], from);
    await sock.sendMessage(from, { text: `✅ Warns reset for @${mentions[0].split("@")[0]}!`, mentions }, { quoted: msg });
  },

  // ── SET ANTI-CALL MESSAGE ──
  setanticallmsg: async (sock, msg, from, args, sender) => {
    if (!isOwner(sender)) return sock.sendMessage(from, { text: `❌ Owner only!` });
    const text = args.join(" ");
    setSetting("anticallmsg", text || "Sorry, I don't accept calls. Please send a message instead.");
    await sock.sendMessage(from, { text: `✅ Anti-call message set!` });
  },

  delanticallmsg: async (sock, msg, from, args, sender) => {
    if (!isOwner(sender)) return sock.sendMessage(from, { text: `❌ Owner only!` });
    setSetting("anticallmsg", "");
    await sock.sendMessage(from, { text: `✅ Anti-call message cleared!` });
  },

  showanticallmsg: async (sock, msg, from) => {
    const m = getSetting("anticallmsg", "Sorry, I don't accept calls.");
    await sock.sendMessage(from, { text: `📵 *Anti-call message:*\n\n_${m}_` });
  },

  testanticallmsg: async (sock, msg, from) => {
    const m = getSetting("anticallmsg", "Sorry, I don't accept calls. Please send a message instead.");
    await sock.sendMessage(from, { text: `📵 *Test Anti-Call Message:*\n\n${m}` }, { quoted: msg });
  },

  // ── WELCOME/GOODBYE MANAGEMENT ──
  showwelcome: async (sock, msg, from) => {
    if (!from.endsWith("@g.us")) return sock.sendMessage(from, { text: `❌ Group only!` });
    const welcome = db.getWelcome(from);
    if (!welcome) return sock.sendMessage(from, { text: `ℹ️ No custom welcome message set. Using default.` });
    await sock.sendMessage(from, { text: `👋 *Welcome Message:*\n\n${welcome}` });
  },

  testwelcome: async (sock, msg, from, args, sender) => {
    if (!from.endsWith("@g.us")) return sock.sendMessage(from, { text: `❌ Group only!` });
    const welcome = db.getWelcome(from) || `🎉 Welcome to the group, @${sender.split("@")[0]}! 🙌\nWe're glad to have you here!`;
    await sock.sendMessage(from, { text: welcome.replace("{name}", `@${sender.split("@")[0]}`), mentions: [sender] }, { quoted: msg });
  },

  delwelcome: async (sock, msg, from, args, sender) => {
    if (!from.endsWith("@g.us")) return sock.sendMessage(from, { text: `❌ Group only!` });
    db.setWelcome(from, null);
    await sock.sendMessage(from, { text: `✅ Welcome message deleted! Will use default.` });
  },

  showgoodbye: async (sock, msg, from) => {
    if (!from.endsWith("@g.us")) return sock.sendMessage(from, { text: `❌ Group only!` });
    const bye = db.getGoodbye(from);
    if (!bye) return sock.sendMessage(from, { text: `ℹ️ No custom goodbye message set.` });
    await sock.sendMessage(from, { text: `👋 *Goodbye Message:*\n\n${bye}` });
  },

  testgoodbye: async (sock, msg, from, args, sender) => {
    if (!from.endsWith("@g.us")) return sock.sendMessage(from, { text: `❌ Group only!` });
    const bye = db.getGoodbye(from) || `👋 @${sender.split("@")[0]} has left the group. Bye!`;
    await sock.sendMessage(from, { text: bye.replace("{name}", `@${sender.split("@")[0]}`), mentions: [sender] }, { quoted: msg });
  },

  delgoodbye: async (sock, msg, from, args, sender) => {
    if (!from.endsWith("@g.us")) return sock.sendMessage(from, { text: `❌ Group only!` });
    db.setGoodbye(from, null);
    await sock.sendMessage(from, { text: `✅ Goodbye message deleted!` });
  },

  // ── SET MENU ──
  setmenu: async (sock, msg, from, args, sender) => {
    if (!isOwner(sender)) return sock.sendMessage(from, { text: `❌ Owner only!` });
    const text = args.join(" ");
    setSetting("custommenu", text);
    await sock.sendMessage(from, { text: `✅ Custom menu intro set!` });
  },

  // ── SET CONTEXT LINK ──
  setcontextlink: async (sock, msg, from, args, sender) => {
    if (!isOwner(sender)) return sock.sendMessage(from, { text: `❌ Owner only!` });
    const link = args[0];
    if (!link) return sock.sendMessage(from, { text: `⚠️ Usage: *!setcontextlink <url>*` });
    setSetting("contextlink", link);
    await sock.sendMessage(from, { text: `✅ Context link set to: ${link}` });
  },

  // ── STATUS SETTINGS ──
  statussettings: async (sock, msg, from, args, sender) => {
    if (!isOwner(sender)) return sock.sendMessage(from, { text: `❌ Owner only!` });
    const s = getSettings();
    await sock.sendMessage(from, {
      text: `📊 *Status Settings:*\n\n` +
        `• Auto-view status: *${s.autoviewstatus ? "ON 🟢" : "OFF 🔴"}*\n` +
        `• Auto-save status: *${s.autosavestatus ? "ON 🟢" : "OFF 🔴"}*\n` +
        `• Auto-react status: *${s.autoreactstatus ? "ON 🟢" : "OFF 🔴"}*\n` +
        `• Status emoji: *${s.statusemoji || "❤️"}*\n` +
        `• Status delay: *${s.statusdelay || "1"}s*`,
    });
  },

  // ── STATUS DELAY ──
  statusdelay: async (sock, msg, from, args, sender) => {
    if (!isOwner(sender)) return sock.sendMessage(from, { text: `❌ Owner only!` });
    const delay = parseInt(args[0]);
    if (isNaN(delay)) return sock.sendMessage(from, { text: `⚠️ Usage: *!statusdelay <seconds>*` });
    setSetting("statusdelay", delay);
    await sock.sendMessage(from, { text: `✅ Status view delay set to *${delay}* seconds!` });
  },

  // ── LIST BLOCKED ──
  listblocked: async (sock, msg, from, args, sender) => {
    if (!isOwner(sender)) return sock.sendMessage(from, { text: `❌ Owner only!` });
    try {
      const blocked = await sock.fetchBlocklist();
      if (!blocked.length) return sock.sendMessage(from, { text: `ℹ️ No blocked contacts.` });
      const list = blocked.map((b, i) => `${i + 1}. +${b.split("@")[0]}`).join("\n");
      await sock.sendMessage(from, { text: `🚫 *Blocked Contacts (${blocked.length}):*\n${C.line}\n${list}${makeFooter()}` });
    } catch { await sock.sendMessage(from, { text: `❌ Could not fetch blocked list.` }); }
  },

  // ── UNBLOCK ALL ──
  unblockall: async (sock, msg, from, args, sender) => {
    if (!isOwner(sender)) return sock.sendMessage(from, { text: `❌ Owner only!` });
    try {
      const blocked = await sock.fetchBlocklist();
      for (const b of blocked) await sock.updateBlockStatus(b, "unblock");
      await sock.sendMessage(from, { text: `✅ Unblocked *${blocked.length}* contacts!` });
    } catch { await sock.sendMessage(from, { text: `❌ Failed to unblock all.` }); }
  },

  // ── LIST SUDO ──
  listsudo: async (sock, msg, from, args, sender) => {
    const sudos = db.getSudos();
    if (!sudos.length) return sock.sendMessage(from, { text: `ℹ️ No sudo users.` });
    await sock.sendMessage(from, { text: `👑 *Sudo Users:*\n${C.line}\n${sudos.map((s, i) => `${i + 1}. +${s}`).join("\n")}${makeFooter()}` });
  },

  // ── LIST IGNORE LIST ──
  addignorelist: async (sock, msg, from, args, sender) => {
    if (!isOwner(sender)) return sock.sendMessage(from, { text: `❌ Owner only!` });
    const mentions = msg?.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const num = mentions[0] ? getJidNumber(mentions[0]) : args[0]?.replace(/[^0-9]/g, "");
    if (!num) return sock.sendMessage(from, { text: `⚠️ Usage: *!addignorelist @user*` });
    const s = getSettings(); s.ignorelist = s.ignorelist || []; if (!s.ignorelist.includes(num)) s.ignorelist.push(num); saveSettings(s);
    await sock.sendMessage(from, { text: `✅ *+${num}* added to ignore list!` });
  },

  delignorelist: async (sock, msg, from, args, sender) => {
    if (!isOwner(sender)) return sock.sendMessage(from, { text: `❌ Owner only!` });
    const mentions = msg?.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const num = mentions[0] ? getJidNumber(mentions[0]) : args[0]?.replace(/[^0-9]/g, "");
    if (!num) return sock.sendMessage(from, { text: `⚠️ Usage: *!delignorelist @user*` });
    const s = getSettings(); s.ignorelist = (s.ignorelist || []).filter((n) => n !== num); saveSettings(s);
    await sock.sendMessage(from, { text: `✅ *+${num}* removed from ignore list!` });
  },

  listignorelist: async (sock, msg, from, args, sender) => {
    if (!isOwner(sender)) return sock.sendMessage(from, { text: `❌ Owner only!` });
    const s = getSettings();
    const list = s.ignorelist || [];
    if (!list.length) return sock.sendMessage(from, { text: `ℹ️ Ignore list is empty.` });
    await sock.sendMessage(from, { text: `🔕 *Ignore List:*\n${list.map((n, i) => `${i + 1}. +${n}`).join("\n")}` });
  },

  // ── LIST BAD WORD ──
  listbadword: async (sock, msg, from) => {
    const words = db.getBadWords();
    if (!words.length) return sock.sendMessage(from, { text: `ℹ️ No bad words configured.` });
    await sock.sendMessage(from, { text: `🚫 *Bad Words (${words.length}):*\n${words.map((w, i) => `${i + 1}. ${w}`).join("\n")}` });
  },

  deletebadword: async (sock, msg, from, args, sender) => {
    if (!isOwner(sender) && !db.getSudos().includes(getJidNumber(sender))) return sock.sendMessage(from, { text: `❌ No permission!` });
    const word = args[0];
    if (!word) return sock.sendMessage(from, { text: `⚠️ Usage: *!deletebadword <word>*` });
    db.removeBadWord(word);
    await sock.sendMessage(from, { text: `✅ Removed *${word}* from bad words!` });
  },

  // ── ADD COUNTRY CODE ──
  addcountrycode: async (sock, msg, from, args, sender) => {
    if (!isOwner(sender)) return sock.sendMessage(from, { text: `❌ Owner only!` });
    const code = args[0]?.replace(/[^0-9]/g, "");
    if (!code) return sock.sendMessage(from, { text: `⚠️ Usage: *!addcountrycode <code>*\nExample: !addcountrycode 234` });
    const s = getSettings(); s.allowedcodes = s.allowedcodes || []; if (!s.allowedcodes.includes(code)) s.allowedcodes.push(code); saveSettings(s);
    await sock.sendMessage(from, { text: `✅ Country code *+${code}* added to allowed list!` });
  },

  delcountrycode: async (sock, msg, from, args, sender) => {
    if (!isOwner(sender)) return sock.sendMessage(from, { text: `❌ Owner only!` });
    const code = args[0]?.replace(/[^0-9]/g, "");
    const s = getSettings(); s.allowedcodes = (s.allowedcodes || []).filter((c) => c !== code); saveSettings(s);
    await sock.sendMessage(from, { text: `✅ Country code *+${code}* removed!` });
  },

  listcountrycode: async (sock, msg, from) => {
    const s = getSettings();
    const list = s.allowedcodes || [];
    await sock.sendMessage(from, { text: `🌍 *Allowed Country Codes:*\n${list.length ? list.map((c) => `+${c}`).join(", ") : "All allowed (none restricted)"}` });
  },

  // ── LAST SEEN ──
  lastseen: async (sock, msg, from, args, sender) => {
    if (!isOwner(sender)) return sock.sendMessage(from, { text: `❌ Owner only!` });
    const val = getSetting("lastseen");
    setSetting("lastseen", !val);
    await sock.sendMessage(from, { text: `👁️ Last seen is now *${!val ? "VISIBLE 🟢" : "HIDDEN 🔴"}*!` });
  },

  // ── READ RECEIPTS ──
  readreceipts: async (sock, msg, from, args, sender) => {
    if (!isOwner(sender)) return sock.sendMessage(from, { text: `❌ Owner only!` });
    const val = getSetting("readreceipts");
    setSetting("readreceipts", !val);
    await sock.sendMessage(from, { text: `✅ Read receipts (blue ticks) are now *${!val ? "ON 🟢" : "OFF 🔴"}*!` });
  },

  // ── PP PRIVACY ──
  ppprivacy: async (sock, msg, from, args, sender) => {
    if (!isOwner(sender)) return sock.sendMessage(from, { text: `❌ Owner only!` });
    const option = args[0]?.toLowerCase() || "contacts";
    await sock.sendMessage(from, { text: `🖼️ Profile picture privacy set to *${option}*!\n_(This requires WhatsApp app settings to fully apply)_` });
  },

  // ── VV2 (view once bypass) ──
  vv2: async (sock, msg, from) => {
    const quoted = msg?.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!quoted) return sock.sendMessage(from, { text: `⚠️ Reply to a view-once message with *!vv2*` });
    const mediaTypes = ["imageMessage", "videoMessage", "audioMessage"];
    for (const type of mediaTypes) {
      if (quoted[type]) {
        const clone = { ...quoted[type], viewOnce: false };
        await sock.sendMessage(from, { [type === "imageMessage" ? "image" : type === "videoMessage" ? "video" : "audio"]: { url: clone.url }, caption: "👁️ View-once bypass!" });
        return;
      }
    }
    await sock.sendMessage(from, { text: `❌ No view-once media found in that message.` });
  },

  // ── TO VIEW ONCE ──
  toviewonce: async (sock, msg, from) => {
    const quoted = msg?.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!quoted?.imageMessage && !quoted?.videoMessage) return sock.sendMessage(from, { text: `⚠️ Reply to an image or video with *!toviewonce*` });
    try {
      const { downloadMediaMessage } = require("@whiskeysockets/baileys");
      const type = quoted.imageMessage ? "imageMessage" : "videoMessage";
      const buffer = await downloadMediaMessage({ message: { [type]: quoted[type] }, key: msg.key }, "buffer", {});
      const mediaKey = type === "imageMessage" ? "image" : "video";
      await sock.sendMessage(from, { [mediaKey]: buffer, viewOnce: true, caption: "👁️ View-once media!" });
    } catch (e) { await sock.sendMessage(from, { text: `❌ Error: ${e.message}` }); }
  },

  // ── TO STATUS ──
  tostatus: async (sock, msg, from) => {
    const quoted = msg?.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const caption = args?.[0] || "";
    if (!quoted?.imageMessage) return sock.sendMessage(from, { text: `⚠️ Reply to an image with *!tostatus*` });
    try {
      const { downloadMediaMessage } = require("@whiskeysockets/baileys");
      const buffer = await downloadMediaMessage({ message: { imageMessage: quoted.imageMessage }, key: msg.key }, "buffer", {});
      await sock.sendMessage("status@broadcast", { image: buffer, caption: caption || "Posted via Matarello 2.0 🔥" });
      await sock.sendMessage(from, { text: `✅ Posted to your WhatsApp Status!` }, { quoted: msg });
    } catch (e) { await sock.sendMessage(from, { text: `❌ Failed: ${e.message}` }); }
  },

  // ── REACT ──
  react: async (sock, msg, from, args) => {
    const emoji = args[0] || "❤️";
    const quoted = msg?.message?.extendedTextMessage?.contextInfo;
    if (!quoted?.stanzaId) return sock.sendMessage(from, { text: `⚠️ Reply to a message with *!react <emoji>*` });
    try {
      await sock.sendMessage(from, { react: { text: emoji, key: { remoteJid: from, id: quoted.stanzaId, fromMe: false } } });
    } catch { await sock.sendMessage(from, { text: `❌ Could not react to that message.` }); }
  },

  // ── DELETE JUNK ──
  deljunk: async (sock, msg, from, args, sender) => {
    if (!isOwner(sender)) return sock.sendMessage(from, { text: `❌ Owner only!` });
    const fs2 = require("fs");
    const p = require("path").join(__dirname, "../data/db");
    const files = fs2.readdirSync(p);
    files.forEach((f) => {
      try {
        const content = JSON.parse(fs2.readFileSync(require("path").join(p, f), "utf8"));
        if (Object.keys(content).length === 0) fs2.unlinkSync(require("path").join(p, f));
      } catch {}
    });
    await sock.sendMessage(from, { text: `🗑️ Cleaned up empty database files!` });
  },

  // ── DISK USAGE ──
  disk: async (sock, msg, from) => {
    const { execSync } = require("child_process");
    try {
      const usage = execSync("df -h / | tail -1").toString().trim();
      const parts = usage.split(/\s+/);
      await sock.sendMessage(from, { text: `💾 *Disk Usage:*\n\n📦 Total: ${parts[1]}\n✅ Used: ${parts[2]}\n🆓 Free: ${parts[3]}\n📊 Use%: ${parts[4]}` }, { quoted: msg });
    } catch { await sock.sendMessage(from, { text: `❌ Could not fetch disk info.` }); }
  },

  // ── HOST IP ──
  hostip: async (sock, msg, from, args, sender) => {
    if (!isOwner(sender)) return sock.sendMessage(from, { text: `❌ Owner only!` });
    try {
      const { execSync } = require("child_process");
      const ip = execSync("curl -s ifconfig.me").toString().trim();
      await sock.sendMessage(from, { text: `🌐 *Host IP:* \`${ip}\`` }, { quoted: msg });
    } catch { await sock.sendMessage(from, { text: `❌ Could not fetch IP.` }); }
  },

  // ── REPO ──
  repo: async (sock, msg, from) => {
    await sock.sendMessage(from, { text: `📦 *Matarello 2.0*\n\n⚡ Version: ${cfg.version}\n🔗 Source repository: https://github.com/matarello98/matarello-2.0` }, { quoted: msg });
  },

  // ── PING2 ──
  ping2: async (sock, msg, from) => {
    const start = Date.now();
    const m = await sock.sendMessage(from, { text: `⚡ Pinging...` });
    const end = Date.now();
    await sock.sendMessage(from, { text: `🏓 *Pong!*\n⚡ Response: *${end - start}ms*\n✅ Bot is alive and kicking!` }, { quoted: msg });
  },

  // ── UPDATE ──
  update: async (sock, msg, from, args, sender) => {
    if (!isOwner(sender)) return sock.sendMessage(from, { text: `❌ Owner only!` });
    await sock.sendMessage(from, { text: `🔄 *Checking for updates...*\n\nCurrently on version *2.0.0*.\nYou are running the latest version! ✅\n\n_Manual update: Pull latest code and restart the bot._` }, { quoted: msg });
  },

  // ── GC ADD PRIVACY ──
  gcaddprivacy: async (sock, msg, from, args, sender) => {
    if (!isOwner(sender)) return sock.sendMessage(from, { text: `❌ Owner only!` });
    const val = getSetting("gcaddprivacy");
    setSetting("gcaddprivacy", !val);
    await sock.sendMessage(from, { text: `🔒 Group add privacy is now *${!val ? "RESTRICTED 🟢" : "OPEN 🔴"}*!` });
  },

  // ── BOTSTATUS ──
  botstatus: async (sock, msg, from, args, sender) => {
    if (!isOwner(sender) && !db.getSudos().includes(getJidNumber(sender))) return sock.sendMessage(from, { text: `❌ No permission!` });
    const text = args.join(" ");
    if (text) {
      try { await sock.updateProfileStatus(text); } catch {}
      await sock.sendMessage(from, { text: `✅ Bot status set to: _${text}_` }, { quoted: msg });
    } else {
      try {
        const status = await sock.fetchStatus(sock.user.id);
        await sock.sendMessage(from, { text: `📝 *Current Bot Status:*\n_${status?.status || "No status"}_` });
      } catch { await sock.sendMessage(from, { text: `❌ Could not fetch status.` }); }
    }
  },

  // ── AZA (Savings) ──
  setaza: async (sock, msg, from, args, sender) => {
    if (!isOwner(sender)) return sock.sendMessage(from, { text: `❌ Owner only!` });
    const amount = parseInt(args[0]);
    if (isNaN(amount)) return sock.sendMessage(from, { text: `⚠️ Usage: *!setaza <amount>*` });
    setSetting("aza", amount);
    await sock.sendMessage(from, { text: `💰 AZA (savings target) set to *${amount} coins*!` });
  },

  resetaza: async (sock, msg, from, args, sender) => {
    if (!isOwner(sender)) return sock.sendMessage(from, { text: `❌ Owner only!` });
    setSetting("aza", 0);
    await sock.sendMessage(from, { text: `♻️ AZA reset to 0!` });
  },

  aza: async (sock, msg, from, args, sender) => {
    const bal = db.getBalance(getJidNumber(sender));
    const target = getSetting("aza", 1000);
    const pct = Math.min(Math.round((bal / target) * 100), 100);
    const bar = "█".repeat(Math.floor(pct / 10)) + "░".repeat(10 - Math.floor(pct / 10));
    await sock.sendMessage(from, { text: `💰 *Your AZA Progress:*\n\n${bar} ${pct}%\n💵 Saved: ${bal} / ${target} coins\n\n${pct >= 100 ? "🎉 Goal reached! Withdraw or set a new target!" : "Keep grinding! 💪"}` }, { quoted: msg });
  },
};

module.exports = { settingsCommands, getSetting, saveSettings, getSettings };
