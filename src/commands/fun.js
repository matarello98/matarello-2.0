const { getRandom, getRandomInt, C, makeHeader, makeFooter } = require("../utils/helpers");
const jokes = require("../data/jokes");
const { naijaSlangs, naijaProverbs, naijaInsults, naijaCompliments, naijaFoods, afrobeatArtists } = require("../data/naijadata");

const funCommands = {
  joke: async (sock, msg, from) => {
    await sock.sendMessage(from, { text: `😂 ${getRandom(jokes)}` }, { quoted: msg });
  },

  naijajoke: async (sock, msg, from) => {
    await sock.sendMessage(from, { text: `😂 ${getRandom(jokes.naija)}` }, { quoted: msg });
  },

  roast: async (sock, msg, from, args) => {
    const mentions = msg?.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const target = mentions[0] ? `@${mentions[0].split("@")[0]}` : "you";
    const roasts = [
      `${target} you sabi roast people but you can't even roast a chicken properly 😂`,
      `${target} your WiFi password and your brain capacity are both weak 💀`,
      `${target} na your fine face dey do the talking because your brain dey take leave 😭`,
      `${target} if stupidity was currency, you'd be richer than Dangote 😂`,
      `${target} the upgrade to your thinking is pending since 2015 💀`,
      `${target} you dey act like you invented common sense when you obviously missed the class 😂`,
      `${target} even NEPA takes more breaks than your brain does 💡`,
      `${target} you're the type to google 'how to use Google' 😭`,
      `${target} your Wi-Fi reaches further than your life plans 💀`,
      `${target} I've seen smarter decisions at NASS 😂`,
    ];
    await sock.sendMessage(from, { text: getRandom(roasts), mentions }, { quoted: msg });
  },

  compliment: async (sock, msg, from, args) => {
    const mentions = msg?.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const target = mentions[0] ? `@${mentions[0].split("@")[0]}` : "you";
    await sock.sendMessage(from, { text: `${target} — ${getRandom(naijaCompliments)}`, mentions }, { quoted: msg });
  },

  ship: async (sock, msg, from, args) => {
    const mentions = msg?.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    if (mentions.length < 2) return sock.sendMessage(from, { text: `❤️ Usage: *!ship @person1 @person2*` });
    const compatibility = getRandomInt(1, 100);
    const emoji = compatibility > 80 ? "❤️🔥" : compatibility > 60 ? "💕" : compatibility > 40 ? "😊" : compatibility > 20 ? "🤔" : "💔";
    await sock.sendMessage(from, {
      text: `💕 *Compatibility Check!*\n\n@${mentions[0].split("@")[0]} ❤️ @${mentions[1].split("@")[0]}\n\n${emoji} *${compatibility}%* compatible!\n\n${compatibility > 70 ? "Omo! This one na match made in heaven 🙌" : compatibility > 40 ? "There's potential sha, work at it 😊" : "Hmm... e go take miracle o 💀"}`,
      mentions,
    }, { quoted: msg });
  },

  "8ball": async (sock, msg, from, args) => {
    const q = args.join(" ");
    if (!q) return sock.sendMessage(from, { text: `🎱 Ask me a question!\nUsage: *!8ball <question>*` });
    const answers = [
      "It is certain! ✅", "Without a doubt! ✅", "Yes, definitely! ✅", "You may rely on it ✅", "As I see it, yes ✅",
      "Most likely ✅", "Signs point to yes ✅", "Reply hazy, try again 🔄", "Ask again later 🔄",
      "Better not tell you now 🤫", "Don't count on it ❌", "My reply is no ❌", "Very doubtful ❌", "Nope, e no go happen ❌",
      "Abeg ask another time 🔄",
    ];
    await sock.sendMessage(from, { text: `🎱 *Question:* ${q}\n\n*Answer:* ${getRandom(answers)}` }, { quoted: msg });
  },

  truth: async (sock, msg, from) => {
    const { truthQuestions } = require("../data/games");
    await sock.sendMessage(from, { text: `🎯 *TRUTH*\n\n${getRandom(truthQuestions)}` }, { quoted: msg });
  },

  dare: async (sock, msg, from) => {
    const { dareChallengess } = require("../data/games");
    await sock.sendMessage(from, { text: `🔥 *DARE*\n\n${getRandom(dareChallengess)}` }, { quoted: msg });
  },

  wouldyourather: async (sock, msg, from) => {
    const { wouldYouRather } = require("../data/games");
    await sock.sendMessage(from, { text: `🤔 *Would You Rather?*\n\n${getRandom(wouldYouRather)}` }, { quoted: msg });
  },

  rizz: async (sock, msg, from) => {
    const rizzLines = [
      "Are you a charger? Because without you, I'd die 😍",
      "Do you have a map? Because I just got lost in your eyes 👀",
      "Is your name Google? Because you have everything I've been searching for 💯",
      "Are you jollof rice? Because everyone fights over you 😂❤️",
      "Your smile must be Wi-Fi because I just got connected ❤️",
      "Do you believe in love at first swipe? 😂",
      "You must be from heaven because you don't look like anyone from this earth 🌹",
      "I was doing fine until you showed up and made everything better 💫",
    ];
    await sock.sendMessage(from, { text: `😍 *Rizz Line:*\n\n_${getRandom(rizzLines)}_` }, { quoted: msg });
  },

  pickup: async (sock, msg, from) => {
    const lines = [
      "Are you Nigerian? Because you just stole my heart like EFCC can't catch you 😂❤️",
      "You must be jollof rice because I can't imagine a party without you 🍛❤️",
      "Your presence is like NEPA bringing light — unexpected and beautiful ⚡❤️",
      "Are you suya? Because you're smoking hot and everyone wants a piece 🥩😍",
      "You must have village people working for you because how are you this fine? 😂❤️",
    ];
    await sock.sendMessage(from, { text: `💕 *Pick-Up Line:*\n\n_${getRandom(lines)}_` }, { quoted: msg });
  },

  rate: async (sock, msg, from, args) => {
    const thing = args.join(" ") || "yourself";
    const rating = getRandomInt(1, 10);
    const emoji = rating >= 8 ? "🔥" : rating >= 6 ? "😊" : rating >= 4 ? "🤔" : "💀";
    await sock.sendMessage(from, { text: `${emoji} *Rating: ${thing}*\n\n*${rating}/10* ${emoji}\n\n${rating >= 8 ? "Correct! You dey belong for the top!" : rating >= 6 ? "Not bad, there's room to grow" : rating >= 4 ? "Hmm... average things happening here" : "Omo... pray about it 😭"}` }, { quoted: msg });
  },

  coinflip: async (sock, msg, from) => {
    const result = Math.random() < 0.5 ? "🟡 HEADS" : "⚫ TAILS";
    await sock.sendMessage(from, { text: `🪙 *Coin Flip!*\n\nThe coin landed on... *${result}*!` }, { quoted: msg });
  },

  dice: async (sock, msg, from) => {
    const roll = getRandomInt(1, 6);
    const emojis = ["", "1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣"];
    await sock.sendMessage(from, { text: `🎲 *Dice Roll!*\n\nYou rolled: ${emojis[roll]} (*${roll}*)` }, { quoted: msg });
  },

  slots: async (sock, msg, from) => {
    const items = ["🍒", "🍋", "🍊", "🍇", "⭐", "💎", "7️⃣"];
    const a = getRandom(items), b = getRandom(items), c = getRandom(items);
    const win = a === b && b === c;
    await sock.sendMessage(from, { text: `🎰 *SLOTS!*\n\n| ${a} | ${b} | ${c} |\n\n${win ? "🎉 *JACKPOT!!! YOU WIN!!! 🎉*" : "Better luck next time! 😭"}` }, { quoted: msg });
  },

  rps: async (sock, msg, from, args) => {
    const choices = ["rock", "paper", "scissors"];
    const player = args[0]?.toLowerCase();
    if (!choices.includes(player)) return sock.sendMessage(from, { text: `✊✋✌️ Usage: *!rps rock/paper/scissors*` });
    const bot = getRandom(choices);
    const emojis = { rock: "✊", paper: "✋", scissors: "✌️" };
    let result;
    if (player === bot) result = "It's a draw! 🤝";
    else if ((player === "rock" && bot === "scissors") || (player === "paper" && bot === "rock") || (player === "scissors" && bot === "paper")) result = "You win! 🎉";
    else result = "I win! 😂 Better luck next time!";
    await sock.sendMessage(from, { text: `✊✋✌️ *Rock Paper Scissors*\n\nYou: ${emojis[player]}\nMe: ${emojis[bot]}\n\n${result}` }, { quoted: msg });
  },

  hype: async (sock, msg, from, args) => {
    const mentions = msg?.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const target = mentions[0] ? `@${mentions[0].split("@")[0]}` : "you";
    const hypes = [
      `${target} you be the GOAT! Nobody dey do it like you! 🔥👑`,
      `${target} your energy is unmatched! Pepper them gang certified! 🌶️🔥`,
      `${target} this person dey gbas every day and not gbos once! Respect! 💪`,
      `${target} you dey motivate people without even trying! That's power 🚀`,
      `${target} future is so bright for you, I need shades to look at you! 😎`,
    ];
    await sock.sendMessage(from, { text: getRandom(hypes), mentions }, { quoted: msg });
  },

  naijaproverb: async (sock, msg, from) => {
    await sock.sendMessage(from, { text: `📜 *Naija Proverb:*\n\n_${getRandom(naijaProverbs)}_` }, { quoted: msg });
  },

  naijafact: async (sock, msg, from) => {
    const { naija: naijafacts } = require("../data/facts");
    await sock.sendMessage(from, { text: `🇳🇬 *Nigerian Fact:*\n\n${getRandom(naijafacts)}` }, { quoted: msg });
  },

  food: async (sock, msg, from) => {
    const f = getRandom(naijaFoods);
    await sock.sendMessage(from, { text: `🍽️ *Nigerian Food Spotlight*\n\n*${f.name}*\n${f.desc}` }, { quoted: msg });
  },

  jollof: async (sock, msg, from) => {
    await sock.sendMessage(from, { text: `🍛 *Jollof Rice is Nigerian!*\n\nAnyone who argues otherwise is operating on very low battery. Nigerian jollof > everything else. And yes, we stand on that. No debate. No cap. 👑🇳🇬` }, { quoted: msg });
  },

  afrobeat: async (sock, msg, from) => {
    const artist = getRandom(afrobeatArtists);
    const songs = ["the vibe today", "this conversation", "the mood right now", "this energy"];
    await sock.sendMessage(from, { text: `🎵 *Afrobeat Vibes!*\n\n${artist} fits ${getRandom(songs)} perfectly!\n\nNaija music is literally the world's soundtrack right now 🌍🔥` }, { quoted: msg });
  },

  sapa: async (sock, msg, from) => {
    const sapalines = [
      "💸 Sapa season be the realest adversary. But pepper dem gang NEVER fold! 💪",
      "💸 Sapa don catch everybody this month. We dey together in this trenches 😭",
      "💸 My account balance and my self-esteem are having a competition on who can go lower 😂",
      "💸 The economy is not your friend. But God is. Balance maintained 🙏😂",
    ];
    await sock.sendMessage(from, { text: getRandom(sapalines) }, { quoted: msg });
  },

  level: async (sock, msg, from, args) => {
    const mentions = msg?.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const target = mentions[0] ? `@${mentions[0].split("@")[0]}` : "your";
    const level = getRandomInt(1, 100);
    await sock.sendMessage(from, { text: `📊 *Level Check!*\n\n${target} level is: *${level}*\n\n${level > 80 ? "🔥 Top tier energy!" : level > 60 ? "✅ Solid, can be better" : level > 40 ? "😐 Average activities" : "💀 Omo... pray for upgrade"}` }, { quoted: msg });
  },

  howold: async (sock, msg, from, args) => {
    if (!args[0]) return sock.sendMessage(from, { text: `⚠️ Usage: *!howold <year>*` });
    const year = parseInt(args[0]);
    const age = new Date().getFullYear() - year;
    if (isNaN(age) || age < 0 || age > 150) return sock.sendMessage(from, { text: `❌ Invalid year!` });
    await sock.sendMessage(from, { text: `🎂 *Age Calculator*\n\nBorn in *${year}* = *${age} years old*\n\n${age < 18 ? "Young blood! Still growing 🌱" : age < 30 ? "You dey your prime! No dulling! 🔥" : age < 50 ? "Senior comrade! Respect the hustle 💪" : "Legend status! You've seen things 👑"}` }, { quoted: msg });
  },

  bmi: async (sock, msg, from, args) => {
    const [weight, height] = args.map(Number);
    if (!weight || !height) return sock.sendMessage(from, { text: `⚠️ Usage: *!bmi <weight_kg> <height_cm>*` });
    const h = height / 100;
    const bmi = (weight / (h * h)).toFixed(1);
    const status = bmi < 18.5 ? "Underweight 😟" : bmi < 25 ? "Normal weight ✅" : bmi < 30 ? "Overweight 😐" : "Obese ❌";
    await sock.sendMessage(from, { text: `⚖️ *BMI Calculator*\n\nBMI: *${bmi}*\nStatus: *${status}*\n\n${bmi < 25 && bmi >= 18.5 ? "Body dey kampe! Keep it up 💪" : "Health is wealth — take care of yourself 🙏"}` }, { quoted: msg });
  },
};

module.exports = funCommands;
