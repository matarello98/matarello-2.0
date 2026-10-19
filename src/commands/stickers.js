const db = require("../utils/database");
const { isOwner, getJidNumber } = require("../utils/helpers");
const {
  saveSticker,
  listStickers,
  deleteSticker,
  getStickerBuffer,
} = require("../services/stickerService");

function isPrivileged(sender) {
  return isOwner(sender) || db.getSudos().includes(getJidNumber(sender));
}

const stickerCommands = {
  savesticker: async (sock, msg, from, args, sender) => {
    if (!isPrivileged(sender)) return sock.sendMessage(from, { text: "❌ Owner or sudo only." });
    const quoted = msg?.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const stickerMessage = quoted?.stickerMessage;
    if (!stickerMessage) {
      return sock.sendMessage(from, { text: "⚠️ Reply to a sticker with *.savesticker funny* (or another situation tag)." }, { quoted: msg });
    }
    const tag = args[0] || "random";
    try {
      const { downloadMediaMessage } = require("@whiskeysockets/baileys");
      const buffer = await downloadMediaMessage({ message: { stickerMessage }, key: msg.key }, "buffer", {});
      const saved = saveSticker(buffer, tag, sender);
      await sock.sendMessage(from, { text: `✅ Saved sticker *${saved.id}* under *${saved.tag}*.` }, { quoted: msg });
    } catch (error) {
      await sock.sendMessage(from, { text: `❌ Could not save sticker: ${error.message}` }, { quoted: msg });
    }
  },

  stickerlist: async (sock, msg, from) => {
    const items = listStickers();
    if (!items.length) return sock.sendMessage(from, { text: "ℹ️ No favorite stickers saved yet. Reply to a sticker with *.savesticker funny*." });
    const lines = items.map((item, index) => `${index + 1}. *${item.tag}* — ${item.id}`);
    await sock.sendMessage(from, { text: `⭐ *Favorite Sticker Bank*\n\n${lines.join("\n")}\n\nUse *.usesticker <tag>* to send one.` }, { quoted: msg });
  },

  usesticker: async (sock, msg, from, args) => {
    const requested = String(args[0] || "random").toLowerCase();
    const items = listStickers().filter((item) => requested === "random" || item.tag === requested || item.id === requested);
    const item = items[Math.floor(Math.random() * items.length)];
    const buffer = getStickerBuffer(item);
    if (!buffer) return sock.sendMessage(from, { text: `ℹ️ No saved sticker found for *${requested}*.` }, { quoted: msg });
    await sock.sendMessage(from, { sticker: buffer }, { quoted: msg });
  },

  delsticker: async (sock, msg, from, args, sender) => {
    if (!isPrivileged(sender)) return sock.sendMessage(from, { text: "❌ Owner or sudo only." });
    const query = args[0];
    if (!query) return sock.sendMessage(from, { text: "⚠️ Usage: *.delsticker <tag-or-id>*" }, { quoted: msg });
    const deleted = deleteSticker(query);
    await sock.sendMessage(from, { text: deleted ? `✅ Deleted ${deleted} saved sticker(s).` : "ℹ️ No matching sticker found." }, { quoted: msg });
  },
};

module.exports = stickerCommands;