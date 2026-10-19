const { getRandom, getRandomInt, C, makeFooter, isOwner, getJidNumber } = require("../utils/helpers");
const db = require("../utils/database");

// Unicode font maps
function toFancy(text) {
  const map = "𝔞𝔟𝔠𝔡𝔢𝔣𝔤𝔥𝔦𝔧𝔨𝔩𝔪𝔫𝔬𝔭𝔮𝔯𝔰𝔱𝔲𝔳𝔴𝔵𝔶𝔷𝔄𝔅ℭ𝔇𝔈𝔉𝔊ℌℑ𝔍𝔎𝔏𝔐𝔑𝔒𝔓𝔔ℜ𝔖𝔗𝔘𝔙𝔚𝔛𝔜ℨ";
  const norm = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  return text.split("").map((c) => { const i = norm.indexOf(c); return i >= 0 ? map[i] : c; }).join("");
}

function toFlip(text) {
  const flip = { a: "ɐ", b: "q", c: "ɔ", d: "p", e: "ǝ", f: "ɟ", g: "ƃ", h: "ɥ", i: "ı", j: "ɾ", k: "ʞ", l: "l", m: "ɯ", n: "u", o: "o", p: "d", q: "b", r: "ɹ", s: "s", t: "ʇ", u: "n", v: "ʌ", w: "ʍ", x: "x", y: "ʎ", z: "z", A: "∀", B: "B", C: "Ɔ", D: "D", E: "Ǝ", F: "Ⅎ", G: "פ", H: "H", I: "I", J: "ɾ", K: "K", L: "˥", M: "W", N: "N", O: "O", P: "Ԁ", Q: "Q", R: "R", S: "S", T: "┴", U: "∩", V: "Λ", W: "M", X: "X", Y: "⅄", Z: "Z", " ": " " };
  return text.split("").reverse().map((c) => flip[c] || c).join("");
}

function toBold(text) {
  const map = "𝗮𝗯𝗰𝗱𝗲𝗳𝗴𝗵𝗶𝗷𝗸𝗹𝗺𝗻𝗼𝗽𝗾𝗿𝘀𝘁𝘂𝘃𝘄𝘅𝘆𝘇𝗔𝗕𝗖𝗗𝗘𝗙𝗚𝗛𝗜𝗝𝗞𝗟𝗠𝗡𝗢𝗣𝗤𝗥𝗦𝗧𝗨𝗩𝗪𝗫𝗬𝗭";
  const norm = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  return text.split("").map((c) => { const i = norm.indexOf(c); return i >= 0 ? map[i] : c; }).join("");
}

function toItalic(text) {
  const map = "𝘢𝘣𝘤𝘥𝘦𝘧𝘨𝘩𝘪𝘫𝘬𝘭𝘮𝘯𝘰𝘱𝘲𝘳𝘴𝘵𝘶𝘷𝘸𝘹𝘺𝘻𝘈𝘉𝘊𝘋𝘌𝘍𝘎𝘍𝘐𝘑𝘒𝘓𝘔𝘕𝘖𝘗𝘘𝘙𝘚𝘛𝘜𝘝𝘞𝘟𝘠𝘡";
  const norm = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  return text.split("").map((c) => { const i = norm.indexOf(c); return i >= 0 ? map[i] : c; }).join("");
}

function toMono(text) {
  const map = "𝚊𝚋𝚌𝚍𝚎𝚏𝚐𝚑𝚒𝚓𝚔𝚕𝚖𝚗𝚘𝚙𝚚𝚛𝚜𝚝𝚞𝚟𝚠𝚡𝚢𝚣𝙰𝙱𝙲𝙳𝙴𝙵𝙶𝙷𝙸𝙹𝙺𝙻𝙼𝙽𝙾𝙿𝚀𝚁𝚂𝚃𝚄𝚅𝚆𝚇𝚈𝚉";
  const norm = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  return text.split("").map((c) => { const i = norm.indexOf(c); return i >= 0 ? map[i] : c; }).join("");
}

function obfuscateText(text) {
  const zalgo = ["̴", "̵", "̶", "̷", "̸", "͜", "͝", "͞", "͟", "͠"];
  return text.split("").map((c) => c + (Math.random() > 0.5 ? getRandom(zalgo) + getRandom(zalgo) : "")).join("");
}

function genPassword(len = 16) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

const extraCommands = {

  // ── TEXT MANIPULATION ──
  fancy: async (sock, msg, from, args) => {
    const text = args.join(" ");
    if (!text) return sock.sendMessage(from, { text: `⚠️ Usage: *!fancy <text>*` });
    await sock.sendMessage(from, { text: `✨ *Fancy Text:*\n\n${toFancy(text)}` }, { quoted: msg });
  },

  fliptext: async (sock, msg, from, args) => {
    const text = args.join(" ");
    if (!text) return sock.sendMessage(from, { text: `⚠️ Usage: *!fliptext <text>*` });
    await sock.sendMessage(from, { text: `🔃 *Flipped Text:*\n\n${toFlip(text)}` }, { quoted: msg });
  },

  bold: async (sock, msg, from, args) => {
    const text = args.join(" ");
    if (!text) return sock.sendMessage(from, { text: `⚠️ Usage: *!bold <text>*` });
    await sock.sendMessage(from, { text: `𝗕𝗼𝗹𝗱 𝗧𝗲𝘅𝘁:\n\n${toBold(text)}` }, { quoted: msg });
  },

  italic: async (sock, msg, from, args) => {
    const text = args.join(" ");
    if (!text) return sock.sendMessage(from, { text: `⚠️ Usage: *!italic <text>*` });
    await sock.sendMessage(from, { text: `𝘐𝘵𝘢𝘭𝘪𝘤 𝘛𝘦𝘹𝘵:\n\n${toItalic(text)}` }, { quoted: msg });
  },

  glitchtext: async (sock, msg, from, args) => {
    const text = args.join(" ");
    if (!text) return sock.sendMessage(from, { text: `⚠️ Usage: *!glitchtext <text>*` });
    await sock.sendMessage(from, { text: `⚡ *Glitch Text:*\n\n${obfuscateText(text)}` }, { quoted: msg });
  },

  obfuscate: async (sock, msg, from, args) => {
    const text = args.join(" ");
    if (!text) return sock.sendMessage(from, { text: `⚠️ Usage: *!obfuscate <text>*` });
    await sock.sendMessage(from, { text: `🌀 *Obfuscated:*\n\n${obfuscateText(text)}` }, { quoted: msg });
  },

  writetext: async (sock, msg, from, args) => {
    const text = args.join(" ");
    if (!text) return sock.sendMessage(from, { text: `⚠️ Usage: *!writetext <text>*` });
    const styles = [toFancy, toFlip, toBold, toItalic, toMono];
    const style = getRandom(styles);
    await sock.sendMessage(from, { text: `✍️ *Styled Text:*\n\n${style(text)}` }, { quoted: msg });
  },

  typography: async (sock, msg, from, args) => {
    const text = args.join(" ");
    if (!text) return sock.sendMessage(from, { text: `⚠️ Usage: *!typography <text>*` });
    await sock.sendMessage(from, {
      text: `🔤 *Typography Showcase:*\n\n` +
        `Normal: ${text}\n` +
        `Bold: ${toBold(text)}\n` +
        `Italic: ${toItalic(text)}\n` +
        `Fancy: ${toFancy(text)}\n` +
        `Mono: ${toMono(text)}\n` +
        `Flipped: ${toFlip(text)}`,
    }, { quoted: msg });
  },

  gradienttext: async (sock, msg, from, args) => {
    const text = args.join(" ");
    if (!text) return sock.sendMessage(from, { text: `⚠️ Usage: *!gradienttext <text>*` });
    const emojis = ["🔴", "🟠", "🟡", "🟢", "🔵", "🟣"];
    const result = text.split("").map((c, i) => (i % 2 === 0 ? c.toUpperCase() : c.toLowerCase())).join("");
    await sock.sendMessage(from, { text: `🌈 *Gradient Text:*\n\n${emojis[0]}${result}${emojis[emojis.length - 1]}\n\n_${toBold(text)}_` }, { quoted: msg });
  },

  // ── PASSWORD GENERATOR ──
  genpass: async (sock, msg, from, args) => {
    const len = Math.min(parseInt(args[0]) || 16, 64);
    const pass = genPassword(len);
    await sock.sendMessage(from, { text: `🔐 *Generated Password:*\n\n\`\`\`${pass}\`\`\`\n\n📏 Length: ${len}\n⚠️ _Save it somewhere safe!_` }, { quoted: msg });
  },

  // ── USER ID ──
  userid: async (sock, msg, from, args, sender) => {
    const mentions = msg?.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const target = mentions[0] || sender;
    await sock.sendMessage(from, { text: `🪪 *User ID:*\n\n📱 JID: \`${target}\`\n📞 Number: +${target.split("@")[0]}` }, { quoted: msg });
  },

  // ── MEMES ──
  memes: async (sock, msg, from) => {
    const memes = [
      "Nigerian parents: You're free to choose any career. Also them: Doctor or Engineer.",
      "NEPA taking light during your favorite show is a form of punishment we haven't named yet.",
      "The confidence of a Nigerian man going to the ATM when sapa is real 😂",
      "Me: *achieves something great* My relatives at Christmas: But when are you getting married?",
      "Naija traffic: The only place where everyone is going nowhere fast.",
      "My data when I need it most 📉 vs my data when I'm sleeping 📶",
      "The way Nigerians will beg you for something and still be picky about it 😂",
      "Generator fuel price dey compete with my rent. Which one be more important? 🤔",
      "Person wey never chop eba no understand life 🍛",
      "Every Nigerian morning starts with: 'NEPA!' followed by generator noise 😭",
    ];
    await sock.sendMessage(from, { text: `😂 *Meme of the Moment:*\n\n_${getRandom(memes)}_` }, { quoted: msg });
  },

  // ── TRUTH DETECTOR ──
  truthdetector: async (sock, msg, from, args) => {
    const statement = args.join(" ");
    if (!statement) return sock.sendMessage(from, { text: `⚠️ Usage: *!truthdetector <statement>*` });
    const results = ["💯 TRUE - 100% accurate, no doubt!", "❌ FALSE - That's a big lie bro", "🤔 MAYBE - This one dey border", "⚠️ SUSPICIOUS - The vibes aren't adding up", "🎯 ABSOLUTELY TRUE - Cross my heart!", "😂 BIG LIE - Delete and start again"];
    await sock.sendMessage(from, { text: `🔍 *Truth Detector 3000™*\n\nStatement: _${statement}_\n\nResult: *${getRandom(results)}*` }, { quoted: msg });
  },

  // ── XXQC ──
  xxqc: async (sock, msg, from, args) => {
    const mentions = msg?.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const target = mentions[0] ? `@${mentions[0].split("@")[0]}` : "Anonymous";
    const levels = ["Very Correct 💯", "Extremely Suspect 👀", "Questionable at best 🤨", "The goat 🐐", "Main character energy 🎯", "Side character behavior 😂", "NPC confirmed 💀", "Villain arc loading... 😤"];
    await sock.sendMessage(from, { text: `🔬 *XXQC Analysis for ${target}:*\n\n${getRandom(levels)}\n\n_Analysis by Matarello 2.0 Labs™_`, mentions }, { quoted: msg });
  },

  // ── TRUTH OR DARE ──
  truthordare: async (sock, msg, from) => {
    const { truthQuestions, dareChallengess } = require("../data/games");
    const isTruth = Math.random() > 0.5;
    if (isTruth) {
      await sock.sendMessage(from, { text: `🎯 *TRUTH!*\n\n${getRandom(truthQuestions)}` }, { quoted: msg });
    } else {
      await sock.sendMessage(from, { text: `🔥 *DARE!*\n\n${getRandom(dareChallengess)}` }, { quoted: msg });
    }
  },

  // ── TO URL (convert to text URL format) ──
  tourl: async (sock, msg, from, args) => {
    const text = args.join(" ");
    if (!text) return sock.sendMessage(from, { text: `⚠️ Usage: *!tourl <text>*` });
    const encoded = encodeURIComponent(text);
    await sock.sendMessage(from, { text: `🔗 *URL Encoded:*\n\n${encoded}` }, { quoted: msg });
  },

  // ── VCF (contact card) ──
  vcf: async (sock, msg, from, args) => {
    const [name, number] = args;
    if (!name || !number) return sock.sendMessage(from, { text: `⚠️ Usage: *!vcf <name> <number>*\nExample: !vcf "John Doe" 2349012345678` });
    const num = number.replace(/[^0-9]/g, "");
    const vcfContent = `BEGIN:VCARD\nVERSION:3.0\nFN:${name}\nTEL;TYPE=CELL:+${num}\nEND:VCARD`;
    const fs = require("fs");
    const tmpPath = `/tmp/${name.replace(/\s/g, "_")}.vcf`;
    fs.writeFileSync(tmpPath, vcfContent);
    await sock.sendMessage(from, { document: fs.readFileSync(tmpPath), mimetype: "text/vcard", fileName: `${name}.vcf`, caption: `📇 Contact card for ${name}` }, { quoted: msg });
  },

  filtervcf: async (sock, msg, from, args) => {
    await sock.sendMessage(from, { text: `📇 *Filter VCF*\n\nSend a VCF file and it will be filtered to remove duplicates and format numbers properly.\n\n_Feature active for VCF files sent to this chat._` }, { quoted: msg });
  },

  // ── DEFINE ──
  define2: async (sock, msg, from, args) => {
    const word = args[0];
    if (!word) return sock.sendMessage(from, { text: `⚠️ Usage: *!define2 <word>*` });
    const definitions = {
      sapa: "A Nigerian slang for being completely broke. The state of having no money whatsoever. Example: 'Sapa don catch me this month.'",
      japa: "Nigerian slang meaning to run/flee/emigrate, usually to a better country. Example: 'My brother don japa go UK.'",
      omo: "Yoruba exclamation expressing surprise, shock, or emphasis. Equivalent to 'wow' or 'dude'.",
      wahala: "Nigerian/Hausa word meaning trouble, problem, or stress. Example: 'No wahala' means 'no problem'.",
      "dey play": "Nigerian slang meaning to joke around or not take something seriously. Example: 'You dey play with your future.'",
      abeg: "Nigerian pidgin for 'please' or used to express disbelief/frustration.",
      pepper: "To disgrace, expose or outdo someone publicly. Example: 'She go pepper them at the party.'",
      shakara: "Showing off, acting proud or playing hard to get. Example: 'Stop doing shakara.'",
    };
    const def = definitions[word.toLowerCase()];
    if (def) {
      await sock.sendMessage(from, { text: `📖 *Definition: ${word}*\n\n${def}` }, { quoted: msg });
    } else {
      await sock.sendMessage(from, { text: `📖 *${word}*\n\nDefinition not found in local dictionary. Try searching online for the full definition!\n\n_Note: Local dictionary contains Nigerian slangs: sapa, japa, omo, wahala, dey play, abeg, pepper, shakara_` }, { quoted: msg });
    }
  },

  // ── TRANSLATE ──
  translate2: async (sock, msg, from, args) => {
    const text = args.join(" ");
    if (!text) return sock.sendMessage(from, { text: `⚠️ Usage: *!translate2 <text>*\n\nNote: This does Pidgin ↔ English translation internally.` });
    const translations = {
      "how far": "How are you doing?",
      "how body": "How are you feeling?",
      "no wahala": "No problem / No worries",
      "e don be": "It's over / That's it",
      "e go be": "It will be / It will happen",
      "dey play": "Joking around",
      "abeg": "Please",
      "abi": "Right? / Isn't it?",
      "oya": "Come on / Let's go",
      "sha": "Just / Anyway",
      "nau": "Now (for emphasis)",
    };
    const lower = text.toLowerCase();
    const translation = translations[lower];
    if (translation) {
      await sock.sendMessage(from, { text: `🌍 *Translation:*\n\nPidgin: _${text}_\nEnglish: *${translation}*` }, { quoted: msg });
    } else {
      await sock.sendMessage(from, { text: `🌍 *Translation:*\n\n_${text}_\n\n⚠️ Full translation API not connected. Known Pidgin→English translations are available. Type common Naija phrases!` }, { quoted: msg });
    }
  },

  // ── PROGRAMMING HELP ──
  programming: async (sock, msg, from, args) => {
    const topic = args.join(" ");
    const topics = {
      javascript: "JavaScript is a high-level, interpreted language used for web development. Key concepts: variables (let/const), functions, arrays, objects, promises, async/await.",
      python: "Python is a beginner-friendly language known for its clean syntax. Used in AI, data science, web dev. Key: indentation matters, everything is an object.",
      nodejs: "Node.js lets you run JavaScript on the server. Built on Chrome's V8 engine. Great for APIs, bots (like this one!), real-time apps.",
      api: "An API (Application Programming Interface) lets different programs talk to each other. REST APIs use HTTP methods: GET, POST, PUT, DELETE.",
      database: "Databases store data. SQL databases (MySQL, PostgreSQL) use tables. NoSQL (MongoDB) uses documents. Choose based on your data structure needs.",
    };
    const tip = topic ? (topics[topic.toLowerCase()] || `No built-in info for '${topic}'. Try: javascript, python, nodejs, api, database`) : `💻 *Programming Topics Available:*\n${Object.keys(topics).map((t) => `• !programming ${t}`).join("\n")}`;
    await sock.sendMessage(from, { text: `💻 *Programming Help:*\n\n${topic ? topics[topic.toLowerCase()] || tip : tip}` }, { quoted: msg });
  },

  // ── STORY GENERATOR ──
  story: async (sock, msg, from, args) => {
    const topic = args.join(" ") || "a Nigerian hustler";
    const intros = [`Once upon a time in Lagos, there was ${topic}.`, `Nobody expected ${topic} to change everything.`, `It was a hot Wednesday in Abuja when ${topic} changed the game.`, `The streets of Ojota will never forget ${topic}.`];
    const middles = ["Against all odds, they hustled every day without giving up.", "Village people tried to stop them but God had other plans.", "The sapa was real but the dream was realer.", "Friends doubted. Family worried. But the grind continued."];
    const endings = ["Today, they are thriving. Lesson: Stay in your lane and trust the process! 🔥", "The breakthrough came when they least expected it. E don be! 💪", "Now they laugh at the struggle because it made them stronger. 👑", "Nobody believed — until the results spoke for themselves. No cap! 💯"];
    await sock.sendMessage(from, { text: `📖 *Matarello Story Time:*\n\n${getRandom(intros)}\n\n${getRandom(middles)}\n\n${getRandom(endings)}` }, { quoted: msg });
  },

  // ── TEACH ──
  teach: async (sock, msg, from, args) => {
    const topic = args.join(" ");
    if (!topic) return sock.sendMessage(from, { text: `⚠️ Usage: *!teach <topic>*\nExample: !teach discipline` });
    const lessons = {
      discipline: "🎯 *Discipline:* Doing what needs to be done even when you don't feel like it. The bridge between goals and accomplishment. No discipline, no result. Simple.",
      hustle: "💪 *Hustle:* Smart + hard work combined. Not just working long hours but working on the RIGHT things. Hustle without direction is just suffering.",
      success: "🏆 *Success:* The progressive realization of a worthy goal. It's not a destination, it's a journey. Define YOUR version of success first.",
      money: "💰 *Money:* A tool, not a goal. Learn to make it, save it, invest it, and grow it. Financial literacy is the foundation.",
      love: "❤️ *Love:* More than a feeling — it's a choice you make daily. Respect, communication, and consistency are the building blocks.",
    };
    const lesson = lessons[topic.toLowerCase()];
    await sock.sendMessage(from, { text: lesson || `📚 *Teaching: ${topic}*\n\nThe most important lessons about ${topic}:\n\n1. Start where you are\n2. Learn as you go\n3. Consistency beats perfection\n4. Ask for help when stuck\n5. Never stop growing\n\n_Matarello 2.0 School 🎓_` }, { quoted: msg });
  },

  // ── SAVE STATUS ──
  savestatus: async (sock, msg, from) => {
    const quoted = msg?.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!quoted) return sock.sendMessage(from, { text: `⚠️ Reply to a status/message with *!savestatus*` });
    const types = { imageMessage: "image", videoMessage: "video", audioMessage: "audio" };
    for (const [type, key] of Object.entries(types)) {
      if (quoted[type]) {
        try {
          const { downloadMediaMessage } = require("@whiskeysockets/baileys");
          const buffer = await downloadMediaMessage({ message: { [type]: quoted[type] }, key: msg.key }, "buffer", {});
          await sock.sendMessage(from, { [key]: buffer, caption: "💾 Status saved!" });
          return;
        } catch (e) { return sock.sendMessage(from, { text: `❌ Failed to save: ${e.message}` }); }
      }
    }
    await sock.sendMessage(from, { text: `❌ No media found in quoted message.` });
  },

  // ── STUBS FOR API-DEPENDENT COMMANDS ──
  analyze: async (sock, msg, from) => {
    await sock.sendMessage(from, { text: `🔍 *Image Analyze*\n\nThis command analyzes images using AI.\n\n⚙️ To enable: Configure an AI vision API key in bot settings.\n_Powered by: AI Vision API_` }, { quoted: msg });
  },
  blackbox: async (sock, msg, from) => {
    await sock.sendMessage(from, { text: `🤖 *Blackbox AI*\n\nConnect to Blackbox AI for coding assistance.\n\n⚙️ API setup required. Contact bot owner to enable.` }, { quoted: msg });
  },
  dalle: async (sock, msg, from) => {
    await sock.sendMessage(from, { text: `🎨 *DALL-E Image Generation*\n\nGenerate images with AI.\n\n⚙️ OpenAI API key required. Contact owner to enable.` }, { quoted: msg });
  },
  deepseek: async (sock, msg, from) => {
    await sock.sendMessage(from, { text: `🧠 *DeepSeek AI*\n\n⚙️ DeepSeek API key required. Contact owner to enable.` }, { quoted: msg });
  },
  doppleai: async (sock, msg, from) => {
    await sock.sendMessage(from, { text: `🤖 *Dopple AI*\n\n⚙️ API setup required. Contact owner to enable.` }, { quoted: msg });
  },
  gemini: async (sock, msg, from, args) => {
    await sock.sendMessage(from, { text: `♊ *Google Gemini AI*\n\nChat with Google's most capable AI.\n\n⚙️ Gemini API key required. Contact owner to enable.` }, { quoted: msg });
  },
  generate: async (sock, msg, from, args) => {
    const prompt = args.join(" ");
    if (!prompt) return sock.sendMessage(from, { text: `⚠️ Usage: *!generate <prompt>*` });
    await sock.sendMessage(from, { text: `🎨 *AI Image Generator*\n\nPrompt: _${prompt}_\n\n⚙️ Image generation API required. Contact owner to enable.` }, { quoted: msg });
  },

  // ── DOWNLOAD STUBS ──
  song: async (sock, msg, from, args) => {
    const query = args.join(" ");
    await sock.sendMessage(from, { text: `🎵 *Song Download*\n\nSearching for: _${query || "...provide a song name"}_\n\n⚙️ Music download API not configured. Feature coming soon!` }, { quoted: msg });
  },
  song2: async (sock, msg, from, args) => {
    const query = args.join(" ");
    await sock.sendMessage(from, { text: `🎵 *Song Download v2*\n\nQuery: _${query || "provide song name"}_\n\n⚙️ Coming soon!` }, { quoted: msg });
  },
  video: async (sock, msg, from, args) => {
    await sock.sendMessage(from, { text: `🎬 *Video Download*\n\n⚙️ Video download requires setup. Supported platforms: YouTube, TikTok, Instagram, Twitter.\n\nFeature coming soon!` }, { quoted: msg });
  },
  tiktokaudio: async (sock, msg, from, args) => {
    await sock.sendMessage(from, { text: `🎵 *TikTok Audio Download*\n\n⚙️ Provide a TikTok URL: *!tiktokaudio <url>*\n\nFeature: Download audio from TikTok videos. Coming soon!` }, { quoted: msg });
  },
  twitter: async (sock, msg, from, args) => {
    await sock.sendMessage(from, { text: `🐦 *Twitter/X Media Download*\n\n⚙️ Usage: *!twitter <tweet url>*\n\nFeature coming soon!` }, { quoted: msg });
  },
  facebook: async (sock, msg, from, args) => {
    await sock.sendMessage(from, { text: `👥 *Facebook Media Download*\n\n⚙️ Usage: *!facebook <video url>*\n\nFeature coming soon!` }, { quoted: msg });
  },
  instagram: async (sock, msg, from, args) => {
    await sock.sendMessage(from, { text: `📷 *Instagram Download*\n\n⚙️ Usage: *!instagram <post url>*\n\nFeature coming soon!` }, { quoted: msg });
  },
  ytmp3: async (sock, msg, from, args) => {
    await sock.sendMessage(from, { text: `🎵 *YouTube MP3*\n\n⚙️ Usage: *!ytmp3 <youtube url or title>*\n\nFeature coming soon!` }, { quoted: msg });
  },
  ytmp4: async (sock, msg, from, args) => {
    await sock.sendMessage(from, { text: `🎬 *YouTube MP4*\n\n⚙️ Usage: *!ytmp4 <youtube url>*\n\nFeature coming soon!` }, { quoted: msg });
  },
  yts: async (sock, msg, from, args) => {
    const q = args.join(" ");
    await sock.sendMessage(from, { text: `🔍 *YouTube Search:* _${q}_\n\n⚙️ YouTube search API not connected. Feature coming soon!` }, { quoted: msg });
  },
  apk: async (sock, msg, from, args) => {
    await sock.sendMessage(from, { text: `📱 *APK Download*\n\n⚙️ APK download service not configured. Feature coming soon!` }, { quoted: msg });
  },
  gdrive: async (sock, msg, from, args) => {
    await sock.sendMessage(from, { text: `☁️ *Google Drive Download*\n\n⚙️ Usage: *!gdrive <url>*\n\nFeature coming soon!` }, { quoted: msg });
  },
  mediafire: async (sock, msg, from, args) => {
    await sock.sendMessage(from, { text: `📁 *MediaFire Download*\n\n⚙️ Usage: *!mediafire <url>*\n\nFeature coming soon!` }, { quoted: msg });
  },
  download: async (sock, msg, from, args) => {
    const url = args[0];
    await sock.sendMessage(from, { text: `⬇️ *Universal Downloader*\n\nURL: ${url || "provide a URL"}\n\n⚙️ Feature coming soon!` }, { quoted: msg });
  },
  xvideo: async (sock, msg, from) => {
    await sock.sendMessage(from, { text: `❌ This command is restricted. Not available.` });
  },
  itunes: async (sock, msg, from, args) => {
    await sock.sendMessage(from, { text: `🍎 *iTunes Search*\n\n⚙️ Feature coming soon!` }, { quoted: msg });
  },
  pin: async (sock, msg, from) => {
    await sock.sendMessage(from, { text: `📌 *Pin Download*\n\n⚙️ Pinterest download. Feature coming soon!` }, { quoted: msg });
  },
  gitclone: async (sock, msg, from, args) => {
    const repo = args[0];
    await sock.sendMessage(from, { text: `🐙 *Git Clone*\n\nRepo: ${repo || "provide a GitHub URL"}\n\n⚙️ This feature is for reference only. Clone repositories locally.` }, { quoted: msg });
  },
  telesticker: async (sock, msg, from, args) => {
    await sock.sendMessage(from, { text: `🎭 *Telegram Sticker*\n\n⚙️ Feature coming soon!` }, { quoted: msg });
  },
  videodoc: async (sock, msg, from) => {
    await sock.sendMessage(from, { text: `📄 *Video as Document*\n\nReply to a video message with *!videodoc* to convert it.\n\n⚙️ Feature coming soon!` }, { quoted: msg });
  },

  // ── AUDIO EFFECTS STUBS ──
  bass: async (sock, msg, from) => { await sock.sendMessage(from, { text: `🔊 *Bass Boost*\n\nReply to an audio with *!bass*\n\n⚙️ Audio processing requires FFmpeg. Feature coming soon!` }, { quoted: msg }); },
  blown: async (sock, msg, from) => { await sock.sendMessage(from, { text: `💥 *Blown Audio*\n\n⚙️ Audio processing. Feature coming soon!` }, { quoted: msg }); },
  deep: async (sock, msg, from) => { await sock.sendMessage(from, { text: `🎤 *Deep Voice*\n\n⚙️ Audio processing. Feature coming soon!` }, { quoted: msg }); },
  earrape: async (sock, msg, from) => { await sock.sendMessage(from, { text: `🔊💥 *Earrape Effect*\n\n⚙️ Audio processing. Feature coming soon!` }, { quoted: msg }); },
  robot: async (sock, msg, from) => { await sock.sendMessage(from, { text: `🤖 *Robot Voice*\n\n⚙️ Audio processing. Feature coming soon!` }, { quoted: msg }); },
  tomp3: async (sock, msg, from) => { await sock.sendMessage(from, { text: `🎵 *Convert to MP3*\n\nReply to a video/audio with *!tomp3*\n\n⚙️ Feature coming soon!` }, { quoted: msg }); },
  toptt: async (sock, msg, from) => { await sock.sendMessage(from, { text: `🎙️ *Text to Push-to-Talk*\n\n⚙️ Feature coming soon!` }, { quoted: msg }); },
  volaudio: async (sock, msg, from) => { await sock.sendMessage(from, { text: `🔊 *Volume Boost*\n\n⚙️ Audio processing. Feature coming soon!` }, { quoted: msg }); },

  // ── IMAGE EFFECTS STUBS ──
  "1917style": async (sock, msg, from) => { await sock.sendMessage(from, { text: `🎬 *1917 Cinematic Style*\n\nReply to an image.\n\n⚙️ Advanced AI filter. Feature coming soon!` }, { quoted: msg }); },
  advancedglow: async (sock, msg, from) => { await sock.sendMessage(from, { text: `✨ *Advanced Glow Effect*\n\n⚙️ Image effect. Feature coming soon!` }, { quoted: msg }); },
  blackpinklogo: async (sock, msg, from) => { await sock.sendMessage(from, { text: `💗🖤 *Blackpink Logo Style*\n\n⚙️ Feature coming soon!` }, { quoted: msg }); },
  blackpinkstyle: async (sock, msg, from) => { await sock.sendMessage(from, { text: `💗🖤 *Blackpink Style Filter*\n\n⚙️ Feature coming soon!` }, { quoted: msg }); },
  cartoonstyle: async (sock, msg, from) => { await sock.sendMessage(from, { text: `🎨 *Cartoon Style Filter*\n\n⚙️ Feature coming soon!` }, { quoted: msg }); },
  deletingtext: async (sock, msg, from, args) => { await sock.sendMessage(from, { text: `⌫ *Deleting Text Effect*\n\n⚙️ Feature coming soon!` }, { quoted: msg }); },
  dragonball: async (sock, msg, from) => { await sock.sendMessage(from, { text: `🐉 *Dragon Ball Style*\n\n⚙️ Feature coming soon!` }, { quoted: msg }); },
  effectclouds: async (sock, msg, from) => { await sock.sendMessage(from, { text: `☁️ *Cloud Effects*\n\n⚙️ Feature coming soon!` }, { quoted: msg }); },
  flag3dtext: async (sock, msg, from, args) => { await sock.sendMessage(from, { text: `🚩 *3D Flag Text*\n\n⚙️ Feature coming soon!` }, { quoted: msg }); },
  flagtext: async (sock, msg, from, args) => { await sock.sendMessage(from, { text: `🚩 *Flag Text*\n\n⚙️ Feature coming soon!` }, { quoted: msg }); },
  freecreate: async (sock, msg, from, args) => { await sock.sendMessage(from, { text: `🎨 *Free Create*\n\n⚙️ Feature coming soon!` }, { quoted: msg }); },
  galaxystyle: async (sock, msg, from) => { await sock.sendMessage(from, { text: `🌌 *Galaxy Style Filter*\n\n⚙️ Feature coming soon!` }, { quoted: msg }); },
  galaxywallpaper: async (sock, msg, from) => { await sock.sendMessage(from, { text: `🌌 *Galaxy Wallpaper*\n\n⚙️ Feature coming soon!` }, { quoted: msg }); },
  glowingtext: async (sock, msg, from, args) => { await sock.sendMessage(from, { text: `✨ *Glowing Text*\n\n⚙️ Feature coming soon!` }, { quoted: msg }); },
  graffiti: async (sock, msg, from, args) => { await sock.sendMessage(from, { text: `🎨 *Graffiti Text*\n\n⚙️ Feature coming soon!` }, { quoted: msg }); },
  incandescent: async (sock, msg, from) => { await sock.sendMessage(from, { text: `💡 *Incandescent Effect*\n\n⚙️ Feature coming soon!` }, { quoted: msg }); },
  lighteffects: async (sock, msg, from) => { await sock.sendMessage(from, { text: `💡 *Light Effects*\n\n⚙️ Feature coming soon!` }, { quoted: msg }); },
  logomaker: async (sock, msg, from, args) => { await sock.sendMessage(from, { text: `🏷️ *Logo Maker*\n\n⚙️ Feature coming soon!` }, { quoted: msg }); },
  luxurygold: async (sock, msg, from, args) => { await sock.sendMessage(from, { text: `👑 *Luxury Gold Effect*\n\n⚙️ Feature coming soon!` }, { quoted: msg }); },
  makingneon: async (sock, msg, from) => { await sock.sendMessage(from, { text: `🌈 *Neon Making Effect*\n\n⚙️ Feature coming soon!` }, { quoted: msg }); },
  matrix: async (sock, msg, from, args) => {
    const text = args.join(" ") || "Matarello";
    const chars = "01アイウエオカキクケコサシスセソタチツテトナニヌネノ";
    const matrixLine = (len) => Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join(" ");
    await sock.sendMessage(from, { text: `🟢 *MATRIX*\n\n\`\`\`${matrixLine(8)}\n${matrixLine(8)}\n   ${text}\n${matrixLine(8)}\n${matrixLine(8)}\`\`\`` }, { quoted: msg });
  },
  multicoloredneon: async (sock, msg, from) => { await sock.sendMessage(from, { text: `🌈 *Multicolored Neon*\n\n⚙️ Feature coming soon!` }, { quoted: msg }); },
  neonglitch: async (sock, msg, from) => { await sock.sendMessage(from, { text: `⚡ *Neon Glitch Effect*\n\n⚙️ Feature coming soon!` }, { quoted: msg }); },
  papercutstyle: async (sock, msg, from) => { await sock.sendMessage(from, { text: `✂️ *Paper Cut Style*\n\n⚙️ Feature coming soon!` }, { quoted: msg }); },
  pixelglitch: async (sock, msg, from) => { await sock.sendMessage(from, { text: `👾 *Pixel Glitch Effect*\n\n⚙️ Feature coming soon!` }, { quoted: msg }); },
  royaltext: async (sock, msg, from, args) => {
    const text = args.join(" ");
    if (!text) return sock.sendMessage(from, { text: `⚠️ Usage: *!royaltext <text>*` });
    await sock.sendMessage(from, { text: `👑 *𝓡𝓸𝔂𝓪𝓵 𝓣𝓮𝔁𝓽:*\n\n${text.split("").map((c) => `𝓟`.replace("𝓟", String.fromCodePoint(c.codePointAt(0) + (c.match(/[a-z]/) ? 0x1D4EA - 97 : c.match(/[A-Z]/) ? 0x1D4D0 - 65 : 0)) || c)).join("")}` }, { quoted: msg });
  },
  sand: async (sock, msg, from) => { await sock.sendMessage(from, { text: `🏖️ *Sand Effect*\n\n⚙️ Feature coming soon!` }, { quoted: msg }); },
  summerbeach: async (sock, msg, from) => { await sock.sendMessage(from, { text: `🏖️ *Summer Beach Style*\n\n⚙️ Feature coming soon!` }, { quoted: msg }); },
  topography: async (sock, msg, from) => { await sock.sendMessage(from, { text: `🗺️ *Topography Style*\n\n⚙️ Feature coming soon!` }, { quoted: msg }); },
  watercolortext: async (sock, msg, from, args) => { await sock.sendMessage(from, { text: `🎨 *Watercolor Text*\n\n⚙️ Feature coming soon!` }, { quoted: msg }); },

  // ── REMINI & WALLPAPER ──
  remini: async (sock, msg, from) => { await sock.sendMessage(from, { text: `✨ *Remini HD Enhance*\n\nReply to an image with *!remini* to enhance quality.\n\n⚙️ Remini API required. Feature coming soon!` }, { quoted: msg }); },
  wallpaper: async (sock, msg, from, args) => {
    const category = args[0] || "nature";
    await sock.sendMessage(from, { text: `🖼️ *Wallpaper Download*\n\nCategory: _${category}_\n\n⚙️ Wallpaper API not connected. Feature coming soon!\n\nTry: !wallpaper nature/city/abstract/animals` }, { quoted: msg });
  },

  // ── REFERENCE STUBS ──
  bible: async (sock, msg, from, args) => {
    const verses = [
      "Philippians 4:13 - I can do all things through Christ who strengthens me. 🙏",
      "Jeremiah 29:11 - For I know the plans I have for you, declares the Lord. Plans to prosper you. 🙏",
      "Proverbs 3:5-6 - Trust in the Lord with all your heart and lean not on your own understanding. 🙏",
      "Romans 8:28 - All things work together for good to them that love God. 🙏",
      "Joshua 1:9 - Be strong and courageous. Do not be afraid; do not be discouraged. 🙏",
      "Psalm 23:1 - The Lord is my shepherd; I shall not want. 🙏",
      "Isaiah 40:31 - Those who hope in the Lord will renew their strength. They will soar on wings like eagles. 🙏",
    ];
    const ref = args.join(" ");
    await sock.sendMessage(from, { text: `📖 *Bible Verse ${ref ? `(${ref})` : ""}:*\n\n_${getRandom(verses)}_` }, { quoted: msg });
  },

  quran: async (sock, msg, from, args) => {
    const verses = [
      "Surah Al-Baqarah 2:286 - Allah does not burden a soul beyond that it can bear. 🌙",
      "Surah Al-Inshirah 94:5-6 - Verily with hardship comes ease. 🌙",
      "Surah Al-Imran 3:159 - And when you have decided, put your trust in Allah. 🌙",
      "Surah Al-Talaq 65:3 - Whoever relies on Allah — He will be sufficient for him. 🌙",
      "Surah Al-Anfal 8:46 - And be patient. Indeed, Allah is with the patient. 🌙",
    ];
    await sock.sendMessage(from, { text: `📖 *Quran Verse:*\n\n_${getRandom(verses)}_` }, { quoted: msg });
  },

  imdb: async (sock, msg, from, args) => {
    const query = args.join(" ");
    if (!query) return sock.sendMessage(from, { text: `⚠️ Usage: *!imdb <movie/show name>*` });
    await sock.sendMessage(from, { text: `🎬 *IMDB Search: ${query}*\n\n⚙️ IMDB API not connected. Search at: https://www.imdb.com/find/?q=${encodeURIComponent(query)}` }, { quoted: msg });
  },

  shazam: async (sock, msg, from) => {
    await sock.sendMessage(from, { text: `🎵 *Shazam Music Recognition*\n\nSend a voice note or audio and *!shazam* to identify the song.\n\n⚙️ Shazam API not connected. Feature coming soon!` }, { quoted: msg });
  },

  gsmarena: async (sock, msg, from, args) => {
    const phone = args.join(" ");
    if (!phone) return sock.sendMessage(from, { text: `⚠️ Usage: *!gsmarena <phone model>*\nExample: !gsmarena iPhone 15 Pro` });
    await sock.sendMessage(from, { text: `📱 *GSMArena: ${phone}*\n\n⚙️ API not connected. Check specs at: https://gsmarena.com` }, { quoted: msg });
  },

  // ── BROWSER/SCREENSHOT STUBS ──
  ssweb: async (sock, msg, from, args) => {
    const url = args[0];
    if (!url) return sock.sendMessage(from, { text: `⚠️ Usage: *!ssweb <url>*` });
    await sock.sendMessage(from, { text: `📸 *Screenshot: ${url}*\n\n⚙️ Screenshot API required. Feature coming soon!` }, { quoted: msg });
  },
  sswebpc: async (sock, msg, from, args) => {
    const url = args[0];
    await sock.sendMessage(from, { text: `🖥️ *PC Screenshot: ${url || "provide url"}*\n\n⚙️ Feature coming soon!` }, { quoted: msg });
  },
  sswebtab: async (sock, msg, from, args) => {
    const url = args[0];
    await sock.sendMessage(from, { text: `📑 *Tab Screenshot: ${url || "provide url"}*\n\n⚙️ Feature coming soon!` }, { quoted: msg });
  },
  browse: async (sock, msg, from, args) => {
    const url = args[0];
    await sock.sendMessage(from, { text: `🌐 *Browse: ${url || "provide url"}*\n\n⚙️ Feature coming soon!` }, { quoted: msg });
  },

  // ── TEXT TO PDF ──
  texttopdf: async (sock, msg, from, args) => {
    await sock.sendMessage(from, { text: `📄 *Text to PDF*\n\nReply to a text message with *!texttopdf* to convert.\n\n⚙️ PDF generation coming soon!` }, { quoted: msg });
  },

  // ── EMOJIMIX ──
  emojimix: async (sock, msg, from, args) => {
    const [e1, e2] = args;
    if (!e1 || !e2) return sock.sendMessage(from, { text: `⚠️ Usage: *!emojimix <emoji1> <emoji2>*\nExample: !emojimix 🔥 💧` });
    await sock.sendMessage(from, { text: `🎨 *Emoji Mix:* ${e1} + ${e2} = ${e1}${e2}\n\n⚙️ Animated emoji mix requires external API. Feature coming soon!` }, { quoted: msg });
  },

  // ── RUN EVAL (owner only) ──
  runeval: async (sock, msg, from, args, sender) => {
    if (!isOwner(sender)) return sock.sendMessage(from, { text: `❌ Owner only!` });
    const code = args.join(" ");
    if (!code) return sock.sendMessage(from, { text: `⚠️ Usage: *!runeval <js code>*` });
    try {
      const result = await eval(code);
      await sock.sendMessage(from, { text: `✅ *Result:*\n\`\`\`${JSON.stringify(result, null, 2)}\`\`\`` }, { quoted: msg });
    } catch (e) { await sock.sendMessage(from, { text: `❌ Error: ${e.message}` }); }
  },

  // ── DEVICE INFO ──
  device: async (sock, msg, from) => {
    const os = require("os");
    await sock.sendMessage(from, {
      text: `💻 *Server Info:*\n\n🖥️ Platform: ${os.platform()}\n🔧 Arch: ${os.arch()}\n💾 RAM: ${(os.freemem() / 1024 / 1024).toFixed(0)}MB free / ${(os.totalmem() / 1024 / 1024).toFixed(0)}MB total\n⚙️ CPUs: ${os.cpus().length}x ${os.cpus()[0]?.model || "Unknown"}\n🌐 Node.js: ${process.version}`,
    }, { quoted: msg });
  },

  // ── VCC (virtual credit card generator) ──
  vcc: async (sock, msg, from) => {
    const prefixes = ["4111", "5500", "3714", "6011"];
    const prefix = getRandom(prefixes);
    const num = prefix + Array.from({ length: 12 }, () => Math.floor(Math.random() * 10)).join("");
    await sock.sendMessage(from, { text: `💳 *Virtual Card (For Testing Only)*\n\n🔢 Number: \`${num}\`\n📅 Expiry: ${String(new Date().getMonth() + 2).padStart(2, "0")}/${new Date().getFullYear() + 3}\n🔐 CVV: ${getRandomInt(100, 999)}\n\n⚠️ _This is randomly generated for testing only. Not real._` }, { quoted: msg });
  },
};

module.exports = extraCommands;
