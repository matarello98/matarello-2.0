const { getRandom, C, makeHeader, makeFooter, generateId } = require("../utils/helpers");
const db = require("../utils/database");
const quotes = require("../data/quotes");
const facts = require("../data/facts");
const riddles = require("../data/riddles");

const utilityCommands = {
  quote: async (sock, msg, from) => {
    await sock.sendMessage(from, { text: `💬 *Quote of the Moment:*\n\n_${getRandom(quotes)}_` }, { quoted: msg });
  },

  naijaquote: async (sock, msg, from) => {
    await sock.sendMessage(from, { text: `💬 *Naija Quote:*\n\n_${getRandom(quotes.naija)}_` }, { quoted: msg });
  },

  fact: async (sock, msg, from) => {
    await sock.sendMessage(from, { text: `💡 *Random Fact:*\n\n${getRandom(facts)}` }, { quoted: msg });
  },

  riddle: async (sock, msg, from) => {
    const r = getRandom(riddles);
    await sock.sendMessage(from, { text: `🧩 *Riddle Time!*\n\n_${r.q}_\n\nSend *!riddleanswer* to reveal!` }, { quoted: msg });
    require("../utils/database").addNote(from, "_lastriddle_", r.a);
  },

  riddleanswer: async (sock, msg, from) => {
    const notes = db.getNotes(from);
    const ans = notes["_lastriddle_"];
    if (!ans) return sock.sendMessage(from, { text: `❓ No active riddle. Use *!riddle* first!` });
    await sock.sendMessage(from, { text: `🎯 *The Answer is:* _${ans}_` }, { quoted: msg });
    db.delNote(from, "_lastriddle_");
  },

  calc: async (sock, msg, from, args) => {
    const expr = args.join(" ").replace(/[^0-9+\-*/.()%^ ]/g, "");
    if (!expr) return sock.sendMessage(from, { text: `🔢 Usage: *!calc <expression>*\nExample: !calc 50 * 20 + 100` });
    try {
      const result = Function(`"use strict"; return (${expr})`)();
      await sock.sendMessage(from, { text: `🔢 *Calculator*\n\n*${expr}*\n= *${result}*` }, { quoted: msg });
    } catch {
      await sock.sendMessage(from, { text: `❌ Invalid expression! Check the math and try again.` });
    }
  },

  percentage: async (sock, msg, from, args) => {
    const [part, whole] = args.map(Number);
    if (!part || !whole) return sock.sendMessage(from, { text: `⚠️ Usage: *!percentage <part> <whole>*\nExample: !percentage 25 200` });
    const pct = ((part / whole) * 100).toFixed(2);
    await sock.sendMessage(from, { text: `📊 *Percentage:*\n\n${part} of ${whole} = *${pct}%*` }, { quoted: msg });
  },

  time: async (sock, msg, from) => {
    const now = new Date().toLocaleString("en-NG", { timeZone: "Africa/Lagos", dateStyle: "full", timeStyle: "long" });
    await sock.sendMessage(from, { text: `🕐 *Current Time (Lagos/Nigeria):*\n\n${now}` }, { quoted: msg });
  },

  date: async (sock, msg, from) => {
    const now = new Date().toLocaleDateString("en-NG", { timeZone: "Africa/Lagos", weekday: "long", year: "numeric", month: "long", day: "numeric" });
    await sock.sendMessage(from, { text: `📅 *Today's Date:*\n\n${now}` }, { quoted: msg });
  },

  reverse: async (sock, msg, from, args) => {
    const text = args.join(" ");
    if (!text) return sock.sendMessage(from, { text: `⚠️ Usage: *!reverse <text>*` });
    await sock.sendMessage(from, { text: `🔄 *Reversed:*\n\n${text.split("").reverse().join("")}` }, { quoted: msg });
  },

  uppercase: async (sock, msg, from, args) => {
    const text = args.join(" ");
    if (!text) return sock.sendMessage(from, { text: `⚠️ Usage: *!uppercase <text>*` });
    await sock.sendMessage(from, { text: `🔡 *UPPERCASE:*\n\n${text.toUpperCase()}` }, { quoted: msg });
  },

  lowercase: async (sock, msg, from, args) => {
    const text = args.join(" ");
    if (!text) return sock.sendMessage(from, { text: `⚠️ Usage: *!lowercase <text>*` });
    await sock.sendMessage(from, { text: `🔡 *lowercase:*\n\n${text.toLowerCase()}` }, { quoted: msg });
  },

  count: async (sock, msg, from, args) => {
    const text = args.join(" ");
    if (!text) return sock.sendMessage(from, { text: `⚠️ Usage: *!count <text>*` });
    const chars = text.length;
    const words = text.trim().split(/\s+/).length;
    await sock.sendMessage(from, { text: `📊 *Count:*\n\n📝 Characters: *${chars}*\n💬 Words: *${words}*` }, { quoted: msg });
  },

  base64: async (sock, msg, from, args) => {
    if (!args[0] || !args[1]) return sock.sendMessage(from, { text: `⚠️ Usage: *!base64 encode/decode <text>*` });
    const mode = args[0].toLowerCase();
    const text = args.slice(1).join(" ");
    try {
      const result = mode === "encode" ? Buffer.from(text).toString("base64") : Buffer.from(text, "base64").toString("utf8");
      await sock.sendMessage(from, { text: `🔐 *Base64 ${mode}:*\n\n${result}` }, { quoted: msg });
    } catch { await sock.sendMessage(from, { text: `❌ Invalid input!` }); }
  },

  qrgen: async (sock, msg, from, args) => {
    const text = args.join(" ");
    if (!text) return sock.sendMessage(from, { text: `⚠️ Usage: *!qrgen <text or link>*` });
    await sock.sendMessage(from, { text: `📱 *QR Code Generator*\n\nFor: _${text}_\n\nUse a QR generator website to create this code, or scan the text directly: ${text}` }, { quoted: msg });
  },

  note: async (sock, msg, from, args) => {
    const name = args[0], content = args.slice(1).join(" ");
    if (!name || !content) return sock.sendMessage(from, { text: `⚠️ Usage: *!note <name> <content>*` });
    db.addNote(from, name, content);
    await sock.sendMessage(from, { text: `📝 Note *${name}* saved!` }, { quoted: msg });
  },

  getnote: async (sock, msg, from, args) => {
    const name = args[0];
    if (!name) return sock.sendMessage(from, { text: `⚠️ Usage: *!getnote <name>*` });
    const notes = db.getNotes(from);
    const note = notes[name];
    if (!note) return sock.sendMessage(from, { text: `❌ Note *${name}* not found!` });
    await sock.sendMessage(from, { text: `📝 *Note: ${name}*\n\n${note}` }, { quoted: msg });
  },

  listnotes: async (sock, msg, from) => {
    const notes = db.getNotes(from);
    const keys = Object.keys(notes).filter((k) => !k.startsWith("_"));
    if (!keys.length) return sock.sendMessage(from, { text: `📝 No notes saved here!` });
    await sock.sendMessage(from, { text: `📝 *Saved Notes:*\n\n${keys.map((k, i) => `${i + 1}. ${k}`).join("\n")}` }, { quoted: msg });
  },

  delnote: async (sock, msg, from, args) => {
    const name = args[0];
    if (!name) return sock.sendMessage(from, { text: `⚠️ Usage: *!delnote <name>*` });
    db.delNote(from, name);
    await sock.sendMessage(from, { text: `🗑️ Note *${name}* deleted!` }, { quoted: msg });
  },

  afk: async (sock, msg, from, args, sender) => {
    const reason = args.join(" ") || "No reason given";
    db.setAfk(sender.split("@")[0], reason);
    await sock.sendMessage(from, { text: `💤 *AFK Mode ON!*\n\nReason: _${reason}_\n\nYou will be notified when someone pings you!` }, { quoted: msg });
  },

  balance: async (sock, msg, from, args, sender) => {
    const bal = db.getBalance(sender.split("@")[0]);
    await sock.sendMessage(from, { text: `💰 *Your Balance:* ${bal} coins` }, { quoted: msg });
  },

  daily: async (sock, msg, from, args, sender) => {
    const num = sender.split("@")[0];
    const coins = 50 + Math.floor(Math.random() * 150);
    db.addBalance(num, coins);
    await sock.sendMessage(from, { text: `🎁 *Daily Reward!*\n\nYou received *${coins} coins*!\n💰 Total: *${db.getBalance(num)} coins*` }, { quoted: msg });
  },

  transfer: async (sock, msg, from, args, sender) => {
    const mentions = msg?.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const target = mentions[0];
    const amount = parseInt(args[1] || args[0]);
    if (!target || isNaN(amount) || amount <= 0) return sock.sendMessage(from, { text: `⚠️ Usage: *!transfer @user <amount>*` });
    const senderNum = sender.split("@")[0];
    const bal = db.getBalance(senderNum);
    if (bal < amount) return sock.sendMessage(from, { text: `❌ Insufficient coins! You have *${bal} coins*.` });
    db.addBalance(senderNum, -amount);
    db.addBalance(target.split("@")[0], amount);
    await sock.sendMessage(from, { text: `💸 *Transfer Successful!*\n\nSent *${amount} coins* to @${target.split("@")[0]}!\n💰 Your balance: *${db.getBalance(senderNum)} coins*`, mentions: [target] }, { quoted: msg });
  },

  weather: async (sock, msg, from, args) => {
    const city = args.join(" ") || "Lagos";
    const conditions = ["Sunny ☀️", "Cloudy ⛅", "Rainy 🌧️", "Partly Cloudy 🌤️", "Stormy ⛈️", "Hot and Humid 🥵"];
    const temp = 22 + Math.floor(Math.random() * 15);
    await sock.sendMessage(from, { text: `🌦️ *Weather (Simulated): ${city}*\n\n🌡️ Temp: ${temp}°C\n🌤️ Condition: ${getRandom(conditions)}\n💧 Humidity: ${50 + Math.floor(Math.random() * 40)}%\n\n_Note: For live weather, enable weather API in config._` }, { quoted: msg });
  },

  currency: async (sock, msg, from, args) => {
    const [amount, from_curr, , to_curr] = args;
    if (!amount || !from_curr || !to_curr) return sock.sendMessage(from, { text: `⚠️ Usage: *!currency <amount> <FROM> to <TO>*\nExample: !currency 100 USD to NGN` });
    const rates = { USD: 1650, EUR: 1800, GBP: 2100, NGN: 1, GHS: 120, KES: 12.5 };
    const f = rates[from_curr.toUpperCase()], t = rates[to_curr.toUpperCase()];
    if (!f || !t) return sock.sendMessage(from, { text: `❌ Unsupported currency. Supported: USD, EUR, GBP, NGN, GHS, KES` });
    const result = ((parseFloat(amount) * f) / t).toFixed(2);
    await sock.sendMessage(from, { text: `💱 *Currency Converter*\n\n${amount} ${from_curr.toUpperCase()} = *${result} ${to_curr.toUpperCase()}*\n\n_Note: Approximate rates, check live rates for accuracy._` }, { quoted: msg });
  },
};

module.exports = utilityCommands;
