const cfg = require("../config.js");

const BOT_NAME = cfg.botName;
const OWNER = cfg.ownerNumber;
const PREFIX = cfg.prefix;

function getJidNumber(jid) {
  return jid ? jid.split("@")[0].split(":")[0] : "";
}

function isOwner(sender) {
  const senderNumber = getJidNumber(sender).replace(/[^0-9]/g, "");
  const owners = [
    ...(Array.isArray(cfg.ownerNumbers) ? cfg.ownerNumbers : []),
    cfg.ownerNumber,
  ]
    .map((number) => String(number || "").replace(/[^0-9]/g, ""))
    .filter(Boolean);
  return Boolean(senderNumber) && owners.includes(senderNumber);
}

function getOwnerJid() {
  return `${String(cfg.ownerNumber || "").replace(/[^0-9]/g, "")}@s.whatsapp.net`;
}

function isGroup(jid) {
  return jid && jid.endsWith("@g.us");
}

function getRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function formatTime(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d ${h % 24}h ${m % 60}m`;
  if (h > 0) return `${h}h ${m % 60}m ${s % 60}s`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

function formatDate(date) {
  const d = new Date(date || Date.now());
  return d.toLocaleString("en-NG", { timeZone: "Africa/Lagos", dateStyle: "full", timeStyle: "short" });
}

function mentionUser(number) {
  return `@${number}`;
}

function extractMentions(msg) {
  return msg?.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
}

function getQuotedMsg(msg) {
  const quoted = msg?.message?.extendedTextMessage?.contextInfo?.quotedMessage;
  return quoted || null;
}

function getQuotedSender(msg) {
  return msg?.message?.extendedTextMessage?.contextInfo?.participant || null;
}

function hasMedia(msg) {
  const m = msg?.message;
  if (!m) return false;
  return !!(m.imageMessage || m.videoMessage || m.stickerMessage || m.audioMessage || m.documentMessage);
}

function getMediaType(msg) {
  const m = msg?.message;
  if (!m) return null;
  if (m.imageMessage) return "image";
  if (m.videoMessage) return "video";
  if (m.stickerMessage) return "sticker";
  if (m.audioMessage) return "audio";
  if (m.documentMessage) return "document";
  return null;
}

function generateId(length = 8) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

// ---- COLORFUL FORMATTING ----
const C = {
  bold: (t) => `*${t}*`,
  italic: (t) => `_${t}_`,
  strike: (t) => `~${t}~`,
  mono: (t) => `\`\`\`${t}\`\`\``,
  line: "─".repeat(20),
  dline: "═".repeat(20),
  sparkle: "✨",
  fire: "🔥",
  crown: "👑",
  bolt: "⚡",
  star: "⭐",
  gem: "💎",
  rocket: "🚀",
  check: "✅",
  cross: "❌",
  warn: "⚠️",
  info: "ℹ️",
};

function makeHeader(title, emoji = "🔥") {
  return `${emoji}${C.bold(title)}${emoji}\n${C.line}`;
}

function makeSection(title, emoji = "▶️") {
  return `\n${emoji} ${C.bold(title)}\n`;
}

function makeFooter() {
  return `\n${C.line}\n⚡ ${C.bold(BOT_NAME)} | Made with 💚 by ${C.bold(cfg.ownerName)}`;
}

module.exports = {
  getJidNumber, isOwner, isGroup, getRandom, getRandomInt,
  getOwnerJid,
  sleep, formatTime, formatDate, mentionUser, extractMentions,
  getQuotedMsg, getQuotedSender, hasMedia, getMediaType,
  generateId, C, makeHeader, makeSection, makeFooter,
  BOT_NAME, OWNER, PREFIX,
};
