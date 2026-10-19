const fs = require("fs");
const path = require("path");

const STICKER_DIR = path.join(__dirname, "../data/db/stickers");
const INDEX_FILE = path.join(STICKER_DIR, "index.json");

function ensureStore() {
  fs.mkdirSync(STICKER_DIR, { recursive: true });
  if (!fs.existsSync(INDEX_FILE)) fs.writeFileSync(INDEX_FILE, "{}");
}

function readIndex() {
  ensureStore();
  try {
    return JSON.parse(fs.readFileSync(INDEX_FILE, "utf8"));
  } catch {
    return {};
  }
}

function writeIndex(index) {
  ensureStore();
  fs.writeFileSync(INDEX_FILE, JSON.stringify(index, null, 2));
}

function safeTag(value) {
  return String(value || "random")
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "")
    .slice(0, 32) || "random";
}

function saveSticker(buffer, tag, source = "owner") {
  if (!Buffer.isBuffer(buffer) || !buffer.length) throw new Error("Sticker data is empty.");
  const normalizedTag = safeTag(tag);
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const fileName = `${id}.webp`;
  ensureStore();
  fs.writeFileSync(path.join(STICKER_DIR, fileName), buffer);
  const index = readIndex();
  index[id] = { id, tag: normalizedTag, fileName, source, createdAt: new Date().toISOString() };
  writeIndex(index);
  return index[id];
}

function listStickers() {
  return Object.values(readIndex());
}

function deleteSticker(idOrTag) {
  const query = String(idOrTag || "").toLowerCase();
  const index = readIndex();
  const matches = Object.values(index).filter((item) => item.id === query || item.tag === query);
  for (const item of matches) {
    try { fs.unlinkSync(path.join(STICKER_DIR, item.fileName)); } catch {}
    delete index[item.id];
  }
  writeIndex(index);
  return matches.length;
}

function getStickerBuffer(item) {
  if (!item) return null;
  try {
    return fs.readFileSync(path.join(STICKER_DIR, item.fileName));
  } catch {
    return null;
  }
}

function chooseSticker(text = "") {
  const lower = String(text).toLowerCase();
  const tags = [];
  if (/(😂|lol|lmao|haha|funny|joke|laugh)/i.test(lower)) tags.push("funny", "laugh", "happy");
  if (/(sad|cry|hurt|heartbreak|lonely|miss)/i.test(lower)) tags.push("sad", "comfort", "cry");
  if (/(angry|mad|vex|annoyed|pissed)/i.test(lower)) tags.push("angry", "vex");
  if (/(love|crush|bae|romance)/i.test(lower)) tags.push("love", "romance");
  if (/(congrat|win|success|celebrate|birthday|happy)/i.test(lower)) tags.push("celebrate", "happy");
  if (/(thank|thanks|appreciate)/i.test(lower)) tags.push("thanks", "appreciation");
  if (!tags.length) return null;

  const items = listStickers();
  for (const tag of tags) {
    const matches = items.filter((item) => item.tag === tag);
    if (matches.length) return matches[Math.floor(Math.random() * matches.length)];
  }
  return null;
}

module.exports = {
  STICKER_DIR,
  saveSticker,
  listStickers,
  deleteSticker,
  getStickerBuffer,
  chooseSticker,
};