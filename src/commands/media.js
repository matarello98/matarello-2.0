const { getRandom } = require("../utils/helpers");

const situationStickers = {
  funny: [
    "https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif",
    "https://media.giphy.com/media/3o7TKMt1VVNkHV2PaE/giphy.gif",
  ],
  clap: [
    "https://media.giphy.com/media/fxI1G5PaKFbPe7bIDu/giphy.gif",
  ],
};

function quotedImage(msg) {
  return msg?.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage || null;
}

async function transformQuotedImage(sock, msg, from, operation, caption) {
  const imageMsg = quotedImage(msg);
  if (!imageMsg) {
    return sock.sendMessage(from, { text: "⚠️ Reply to an image to use this picture tool." }, { quoted: msg });
  }
  try {
    const { downloadMediaMessage } = require("@whiskeysockets/baileys");
    const buffer = await downloadMediaMessage({ message: { imageMessage: imageMsg }, key: msg.key }, "buffer", {});
    const sharp = require("sharp");
    const result = await operation(sharp(buffer));
    await sock.sendMessage(from, { image: result, caption }, { quoted: msg });
  } catch (error) {
    await sock.sendMessage(from, { text: `❌ Picture edit failed: ${error.message}` }, { quoted: msg });
  }
}

const mediaCommands = {
  sticker: async (sock, msg, from) => {
    const quoted = msg?.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const mediaMsg = quoted?.imageMessage || quoted?.videoMessage;
    if (!mediaMsg) {
      return sock.sendMessage(from, { text: `⚠️ *Reply to an image or video to make a sticker!*\nUsage: Reply to image with *!sticker*` }, { quoted: msg });
    }
    try {
      const { downloadMediaMessage } = require("@whiskeysockets/baileys");
      const buffer = await downloadMediaMessage({ message: { [quoted.imageMessage ? "imageMessage" : "videoMessage"]: mediaMsg }, key: msg.key }, "buffer", {});
      const sharp = require("sharp");
      const webp = await sharp(buffer).resize(512, 512, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).webp().toBuffer();
      await sock.sendMessage(from, { sticker: webp });
    } catch (e) {
      await sock.sendMessage(from, { text: `❌ Could not convert to sticker: ${e.message}` });
    }
  },

  toimg: async (sock, msg, from) => {
    const quoted = msg?.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const stickerMsg = quoted?.stickerMessage;
    if (!stickerMsg) {
      return sock.sendMessage(from, { text: `⚠️ *Reply to a sticker to convert it to an image!*` }, { quoted: msg });
    }
    try {
      const { downloadMediaMessage } = require("@whiskeysockets/baileys");
      const buffer = await downloadMediaMessage({ message: { stickerMessage: stickerMsg }, key: msg.key }, "buffer", {});
      const sharp = require("sharp");
      const png = await sharp(buffer).png().toBuffer();
      await sock.sendMessage(from, { image: png, caption: "🖼️ Here's your image!" });
    } catch (e) {
      await sock.sendMessage(from, { text: `❌ Could not convert: ${e.message}` });
    }
  },

  grayscale: async (sock, msg, from) => {
    const quoted = msg?.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const imageMsg = quoted?.imageMessage;
    if (!imageMsg) return sock.sendMessage(from, { text: `⚠️ Reply to an image with *!grayscale*` });
    try {
      const { downloadMediaMessage } = require("@whiskeysockets/baileys");
      const buffer = await downloadMediaMessage({ message: { imageMessage: imageMsg }, key: msg.key }, "buffer", {});
      const sharp = require("sharp");
      const result = await sharp(buffer).grayscale().jpeg().toBuffer();
      await sock.sendMessage(from, { image: result, caption: "🖤 Grayscale version!" });
    } catch (e) {
      await sock.sendMessage(from, { text: `❌ Error: ${e.message}` });
    }
  },

  blur: async (sock, msg, from, args) => {
    const quoted = msg?.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const imageMsg = quoted?.imageMessage;
    if (!imageMsg) return sock.sendMessage(from, { text: `⚠️ Reply to an image with *!blur*` });
    const sigma = Math.min(parseInt(args[0]) || 5, 100);
    try {
      const { downloadMediaMessage } = require("@whiskeysockets/baileys");
      const buffer = await downloadMediaMessage({ message: { imageMessage: imageMsg }, key: msg.key }, "buffer", {});
      const sharp = require("sharp");
      const result = await sharp(buffer).blur(sigma).jpeg().toBuffer();
      await sock.sendMessage(from, { image: result, caption: `🌫️ Blurred (sigma: ${sigma})!` });
    } catch (e) {
      await sock.sendMessage(from, { text: `❌ Error: ${e.message}` });
    }
  },

  flip: async (sock, msg, from) => {
    const quoted = msg?.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const imageMsg = quoted?.imageMessage;
    if (!imageMsg) return sock.sendMessage(from, { text: `⚠️ Reply to an image with *!flip*` });
    try {
      const { downloadMediaMessage } = require("@whiskeysockets/baileys");
      const buffer = await downloadMediaMessage({ message: { imageMessage: imageMsg }, key: msg.key }, "buffer", {});
      const sharp = require("sharp");
      const result = await sharp(buffer).flip().jpeg().toBuffer();
      await sock.sendMessage(from, { image: result, caption: `🔃 Flipped!` });
    } catch (e) {
      await sock.sendMessage(from, { text: `❌ Error: ${e.message}` });
    }
  },

  flop: async (sock, msg, from) => {
    const quoted = msg?.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const imageMsg = quoted?.imageMessage;
    if (!imageMsg) return sock.sendMessage(from, { text: `⚠️ Reply to an image with *!flop*` });
    try {
      const { downloadMediaMessage } = require("@whiskeysockets/baileys");
      const buffer = await downloadMediaMessage({ message: { imageMessage: imageMsg }, key: msg.key }, "buffer", {});
      const sharp = require("sharp");
      const result = await sharp(buffer).flop().jpeg().toBuffer();
      await sock.sendMessage(from, { image: result, caption: `↔️ Flopped!` });
    } catch (e) {
      await sock.sendMessage(from, { text: `❌ Error: ${e.message}` });
    }
  },

  invert: async (sock, msg, from) => {
    const quoted = msg?.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const imageMsg = quoted?.imageMessage;
    if (!imageMsg) return sock.sendMessage(from, { text: `⚠️ Reply to an image with *!invert*` });
    try {
      const { downloadMediaMessage } = require("@whiskeysockets/baileys");
      const buffer = await downloadMediaMessage({ message: { imageMessage: imageMsg }, key: msg.key }, "buffer", {});
      const sharp = require("sharp");
      const result = await sharp(buffer).negate().jpeg().toBuffer();
      await sock.sendMessage(from, { image: result, caption: `🎨 Inverted colors!` });
    } catch (e) {
      await sock.sendMessage(from, { text: `❌ Error: ${e.message}` });
    }
  },

  rotate: async (sock, msg, from, args) => {
    const quoted = msg?.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const imageMsg = quoted?.imageMessage;
    if (!imageMsg) return sock.sendMessage(from, { text: `⚠️ Reply to an image with *!rotate <degrees>*` });
    const angle = parseInt(args[0]) || 90;
    try {
      const { downloadMediaMessage } = require("@whiskeysockets/baileys");
      const buffer = await downloadMediaMessage({ message: { imageMessage: imageMsg }, key: msg.key }, "buffer", {});
      const sharp = require("sharp");
      const result = await sharp(buffer).rotate(angle).jpeg().toBuffer();
      await sock.sendMessage(from, { image: result, caption: `🔄 Rotated ${angle}°!` });
    } catch (e) {
      await sock.sendMessage(from, { text: `❌ Error: ${e.message}` });
    }
  },

  resize: async (sock, msg, from, args) => {
    const width = Math.min(Math.max(parseInt(args[0], 10) || 800, 64), 2000);
    const height = Math.min(Math.max(parseInt(args[1], 10) || width, 64), 2000);
    await transformQuotedImage(sock, msg, from, (image) => image.resize(width, height, { fit: "inside", withoutEnlargement: true }).jpeg({ quality: 90 }).toBuffer(), `📐 Resized to ${width}×${height}`);
  },

  crop: async (sock, msg, from, args) => {
    const width = Math.min(Math.max(parseInt(args[0], 10) || 800, 64), 2000);
    const height = Math.min(Math.max(parseInt(args[1], 10) || width, 64), 2000);
    await transformQuotedImage(sock, msg, from, (image) => image.resize(width, height, { fit: "cover", position: "centre" }).jpeg({ quality: 92 }).toBuffer(), `✂️ Cropped to ${width}×${height}`);
  },

  sepia: async (sock, msg, from) => {
    await transformQuotedImage(sock, msg, from, (image) => image.grayscale().tint({ r: 156, g: 104, b: 55 }).jpeg({ quality: 92 }).toBuffer(), "🤎 Sepia tone");
  },

  sharpen: async (sock, msg, from) => {
    await transformQuotedImage(sock, msg, from, (image) => image.sharpen(2).jpeg({ quality: 94 }).toBuffer(), "🔍 Sharpened image");
  },

  brightness: async (sock, msg, from, args) => {
    const level = Math.min(Math.max(Number(args[0]) || 1.2, 0.2), 3);
    await transformQuotedImage(sock, msg, from, (image) => image.modulate({ brightness: level }).jpeg({ quality: 92 }).toBuffer(), `☀️ Brightness ${level}×`);
  },

  compress: async (sock, msg, from, args) => {
    const quality = Math.min(Math.max(parseInt(args[0], 10) || 70, 20), 100);
    await transformQuotedImage(sock, msg, from, (image) => image.jpeg({ quality }).toBuffer(), `🗜️ Compressed at ${quality}% quality`);
  },

  round: async (sock, msg, from) => {
    await transformQuotedImage(sock, msg, from, async (image) => {
      const size = 640;
      const mask = Buffer.from(`<svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="white"/></svg>`);
      return image.resize(size, size, { fit: "cover" }).ensureAlpha().composite([{ input: mask, blend: "dest-in" }]).png().toBuffer();
    }, "⭕ Circular crop");
  },

  imageedit: async (sock, msg, from) => {
    await sock.sendMessage(from, {
      text: `🎨 *PICTURE EDIT LAB*\n\nReply to an image with:\n• *!resize 800 800* — Resize\n• *!crop 800 600* — Center crop\n• *!grayscale* — Black and white\n• *!sepia* — Warm vintage tone\n• *!blur 8* — Blur\n• *!sharpen* — Sharpen details\n• *!brightness 1.3* — Brightness\n• *!compress 70* — Reduce file size\n• *!round* — Circular crop\n• *!rotate 90* — Rotate\n• *!flip* / *!flop* — Mirror\n• *!invert* — Invert colors`,
    }, { quoted: msg });
  },

  imghelp: async (sock, msg, from) => mediaCommands.imageedit(sock, msg, from),
};

module.exports = mediaCommands;
