const fs = require("fs");
const path = require("path");

const DB_DIR = path.join(__dirname, "../data/db");

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

function readDB(file) {
  const fp = path.join(DB_DIR, `${file}.json`);
  if (!fs.existsSync(fp)) return {};
  try {
    return JSON.parse(fs.readFileSync(fp, "utf8"));
  } catch {
    return {};
  }
}

function writeDB(file, data) {
  const fp = path.join(DB_DIR, `${file}.json`);
  fs.writeFileSync(fp, JSON.stringify(data, null, 2));
}

// ---- SUDO ----
function getSudos() {
  const db = readDB("sudo");
  return db.sudos || [];
}
function addSudo(number) {
  const db = readDB("sudo");
  db.sudos = db.sudos || [];
  if (!db.sudos.includes(number)) db.sudos.push(number);
  writeDB("sudo", db);
}
function removeSudo(number) {
  const db = readDB("sudo");
  db.sudos = (db.sudos || []).filter((n) => n !== number);
  writeDB("sudo", db);
}

// ---- BANS ----
function getBanned() {
  const db = readDB("banned");
  return db.banned || [];
}
function banUser(number) {
  const db = readDB("banned");
  db.banned = db.banned || [];
  if (!db.banned.includes(number)) db.banned.push(number);
  writeDB("banned", db);
}
function unbanUser(number) {
  const db = readDB("banned");
  db.banned = (db.banned || []).filter((n) => n !== number);
  writeDB("banned", db);
}

// ---- WARNS ----
function getWarns(number, group) {
  const db = readDB("warns");
  const key = group ? `${group}_${number}` : number;
  return db[key] || 0;
}
function addWarn(number, group) {
  const db = readDB("warns");
  const key = group ? `${group}_${number}` : number;
  db[key] = (db[key] || 0) + 1;
  writeDB("warns", db);
  return db[key];
}
function resetWarns(number, group) {
  const db = readDB("warns");
  const key = group ? `${group}_${number}` : number;
  db[key] = 0;
  writeDB("warns", db);
}

// ---- ANTILINK ----
function getAntilink(group) {
  const db = readDB("antilink");
  return db[group] || false;
}
function setAntilink(group, val) {
  const db = readDB("antilink");
  db[group] = val;
  writeDB("antilink", db);
}

// ---- WELCOME ----
function getWelcome(group) {
  const db = readDB("welcome");
  return db[group];
}
function setWelcome(group, msg) {
  const db = readDB("welcome");
  db[group] = msg;
  writeDB("welcome", db);
}
function getGoodbye(group) {
  const db = readDB("goodbye");
  return db[group];
}
function setGoodbye(group, msg) {
  const db = readDB("goodbye");
  db[group] = msg;
  writeDB("goodbye", db);
}

// ---- NOTES ----
function getNotes(jid) {
  const db = readDB("notes");
  return db[jid] || {};
}
function addNote(jid, name, content) {
  const db = readDB("notes");
  db[jid] = db[jid] || {};
  db[jid][name] = content;
  writeDB("notes", db);
}
function delNote(jid, name) {
  const db = readDB("notes");
  if (db[jid]) delete db[jid][name];
  writeDB("notes", db);
}

// ---- AFKMODE ----
function getAfk() {
  const db = readDB("afk");
  return db.list || {};
}
function setAfk(number, reason) {
  const db = readDB("afk");
  db.list = db.list || {};
  db.list[number] = { reason, time: Date.now() };
  writeDB("afk", db);
}
function clearAfk(number) {
  const db = readDB("afk");
  db.list = db.list || {};
  delete db.list[number];
  writeDB("afk", db);
}

// ---- CHATBOT USED RESPONSES ----
function getUsedResponses() {
  const db = readDB("chatbot");
  return db.used || [];
}
function markResponseUsed(resp) {
  const db = readDB("chatbot");
  db.used = db.used || [];
  if (!db.used.includes(resp)) db.used.push(resp);
  if (db.used.length > 500) db.used = db.used.slice(-400);
  writeDB("chatbot", db);
}

// ---- CHATBOT CONVERSATION MEMORY ----
function getChatbotMemory(chatId) {
  const db = readDB("chatbot-memory");
  return db[chatId] || { messages: [], responses: [] };
}

function rememberChatbotTurn(chatId, userText, response) {
  if (!chatId) return;
  const db = readDB("chatbot-memory");
  const memory = db[chatId] || { messages: [], responses: [] };
  if (userText) memory.messages.push(String(userText).slice(0, 500));
  if (response) memory.responses.push(String(response));
  memory.messages = memory.messages.slice(-8);
  memory.responses = memory.responses.slice(-12);
  db[chatId] = memory;
  writeDB("chatbot-memory", db);
}

function getRecentChatbotResponses(chatId) {
  return getChatbotMemory(chatId).responses || [];
}

// ---- GROUP SETTINGS ----
function getGroupSetting(group, key) {
  const db = readDB("groupsettings");
  return (db[group] || {})[key];
}
function setGroupSetting(group, key, val) {
  const db = readDB("groupsettings");
  db[group] = db[group] || {};
  db[group][key] = val;
  writeDB("groupsettings", db);
}

// ---- MUTED GROUPS ----
function isGroupMuted(group) {
  const db = readDB("muted");
  return (db.groups || []).includes(group);
}
function muteGroup(group) {
  const db = readDB("muted");
  db.groups = db.groups || [];
  if (!db.groups.includes(group)) db.groups.push(group);
  writeDB("muted", db);
}
function unmuteGroup(group) {
  const db = readDB("muted");
  db.groups = (db.groups || []).filter((g) => g !== group);
  writeDB("muted", db);
}

// ---- BLOCKED WORDS ----
function getBadWords() {
  const db = readDB("badwords");
  return db.words || [];
}
function addBadWord(word) {
  const db = readDB("badwords");
  db.words = db.words || [];
  if (!db.words.includes(word.toLowerCase())) db.words.push(word.toLowerCase());
  writeDB("badwords", db);
}
function removeBadWord(word) {
  const db = readDB("badwords");
  db.words = (db.words || []).filter((w) => w !== word.toLowerCase());
  writeDB("badwords", db);
}

// ---- BOT STATS ----
function getStats() {
  const db = readDB("stats");
  return db;
}
function incrementStat(key) {
  const db = readDB("stats");
  db[key] = (db[key] || 0) + 1;
  writeDB("stats", db);
}

// ---- ECONOMY ----
function getBalance(number) {
  const db = readDB("economy");
  return db[number] || 0;
}
function setBalance(number, amount) {
  const db = readDB("economy");
  db[number] = amount;
  writeDB("economy", db);
}
function addBalance(number, amount) {
  const db = readDB("economy");
  db[number] = (db[number] || 0) + amount;
  writeDB("economy", db);
}

// ---- CLONE RENTALS ----
function getCloneRentals() {
  const db = readDB("clone-rentals");
  return db.rentals || {};
}
function saveCloneRental(rental) {
  const db = readDB("clone-rentals");
  db.rentals = db.rentals || {};
  db.rentals[rental.id] = rental;
  writeDB("clone-rentals", db);
}
function removeCloneRental(id) {
  const db = readDB("clone-rentals");
  db.rentals = db.rentals || {};
  delete db.rentals[id];
  writeDB("clone-rentals", db);
}

module.exports = {
  getSudos, addSudo, removeSudo,
  getBanned, banUser, unbanUser,
  getWarns, addWarn, resetWarns,
  getAntilink, setAntilink,
  getWelcome, setWelcome, getGoodbye, setGoodbye,
  getNotes, addNote, delNote,
  getAfk, setAfk, clearAfk,
  getUsedResponses, markResponseUsed,
  getChatbotMemory, rememberChatbotTurn, getRecentChatbotResponses,
  getGroupSetting, setGroupSetting,
  isGroupMuted, muteGroup, unmuteGroup,
  getBadWords, addBadWord, removeBadWord,
  getStats, incrementStat,
  getBalance, setBalance, addBalance,
  getCloneRentals, saveCloneRental, removeCloneRental,
};
