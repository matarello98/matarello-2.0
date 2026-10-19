const { getRandom, getMediaType } = require("../utils/helpers");
const R = require("./responses");
const chatMemory = new Map();

// Keywords triggers
const GREETING_KW = ["hi", "hello", "hey", "holla", "sup", "oya", "e don do", "how far", "how body", "what's up", "whatsup", "yo", "hola", "morning", "afternoon", "evening", "night", "goodnight", "goodmorning", "howdy"];
const HOW_KW = ["how are you", "how u dey", "how you dey", "how you doing", "how are u", "you okay", "are you okay", "u good", "you good"];
const SAD_KW = ["sad", "crying", "depressed", "heartbreak", "heartbroken", "lonely", "alone", "miss", "lost", "pain", "hurt", "broken", "frustrated", "hopeless", "helpless", "down", "stressed", "anxiety", "tired of life"];
const ANGRY_KW = ["angry", "mad", "annoyed", "pissed", "furious", "vex", "vexed", "I hate", "stupid", "idiot", "nonsense"];
const FUNNY_KW = ["lol", "lmao", "haha", "hehe", "hilarious", "funny", "joke", "laugh", "😂", "💀", "😭", "🤣"];
const INSULT_KW = ["useless", "dumb", "stupid bot", "you're dumb", "you are dumb", "trash bot", "useless bot", "foolish", "idiot bot", "senseless"];

function pickFresh(pool, recent = []) {
  if (!pool?.length) return "";
  const recentSet = new Set(recent);
  const fresh = pool.filter((reply) => !recentSet.has(reply));
  return getRandom(fresh.length ? fresh : pool);
}

function hasKeyword(text, keywords) {
  return keywords.some((keyword) => {
    if (keyword.includes(" ")) return text.includes(keyword);
    return new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(text);
  });
}

function detectMood(text) {
  const t = text.toLowerCase().replace(/[’]/g, "'");
  if (INSULT_KW.some((k) => t.includes(k))) return "insult";
  if (HOW_KW.some((k) => t.includes(k))) return "howAreYou";
  if (hasKeyword(t, GREETING_KW)) return "greeting";
  if (hasKeyword(t, ["thank", "thanks", "thank you", "appreciate"])) return "thanks";
  if (hasKeyword(t, ["sorry", "apologize", "my bad", "forgive"])) return "apology";
  if (hasKeyword(t, ["congratulations", "congrats", "promoted", "promotion", "passed", "won", "success", "got the job"])) return "achievement";
  if (hasKeyword(t, ["sad", "crying", "depressed", "heartbreak", "heartbroken", "lonely", "alone", "pain", "hurt", "broken", "frustrated", "hopeless", "helpless", "stressed", "anxiety"])) return "sad";
  if (hasKeyword(t, ["angry", "mad", "annoyed", "pissed", "furious", "vex", "vexed", "hate", "nonsense"])) return "angry";
  if (hasKeyword(t, ["lol", "lmao", "haha", "hehe", "hilarious", "funny", "joke", "laugh", "😂", "💀", "🤣"])) return "funny";
  if (hasKeyword(t, ["sapa", "broke", "no money", "salary", "rent", "bills", "cash"])) return "sapa";
  if (hasKeyword(t, ["japa", "relocate", "abroad", "visa", "travel"])) return "japa";
  if (hasKeyword(t, ["love", "crush", "relationship", "bae", "partner", "dating", "breakup"])) return "love";
  if (hasKeyword(t, ["food", "hungry", "eat", "jollof", "suya", "lunch", "dinner", "breakfast"])) return "food";
  if (hasKeyword(t, ["hustle", "grind", "work", "job", "business", "office", "career"])) return "hustle";
  if (hasKeyword(t, ["sleep", "tired", "rest", "exhausted", "long day"])) return "tired";
  if (hasKeyword(t, ["music", "song", "album", "afrobeats", "afrobeats", "artist"])) return "music";
  if (hasKeyword(t, ["football", "soccer", "match", "arsenal", "chelsea", "liverpool", "manchester", "sports"])) return "sports";
  if (hasKeyword(t, ["family", "mother", "mum", "mom", "father", "dad", "sibling", "brother", "sister"])) return "family";
  if (hasKeyword(t, ["school", "study", "studying", "exam", "assignment", "lecture", "homework"])) return "school";
  if (hasKeyword(t, ["phone", "laptop", "computer", "wifi", "software", "coding", "programming", "app", "tech"])) return "tech";
  if (hasKeyword(t, ["birthday", "anniversary", "celebration", "party"])) return "celebration";
  if (hasKeyword(t, ["plan", "planning", "schedule", "organize", "organise", "goal", "deadline"])) return "planning";
  if (hasKeyword(t, ["weather", "rain", "sunny", "hot today", "cold today"])) return "weather";
  if (hasKeyword(t, ["naija", "nigeria", "country", "lagos", "abuja"])) return "naija";
  if (hasKeyword(t, ["advice", "what should i do", "what do you think", "help me decide"])) return "advice";
  if (hasKeyword(t, ["what is", "who is", "where is", "when is", "why does", "how do i", "how can i", "?"])) return "question";
  return "conversation";
}

const INTENT_RESPONSES = {
  thanks: ["You're welcome. Glad I could be part of the moment 🙌", "Anytime, my person. I appreciate you saying that 🤝", "No wahala at all — happy it helped."],
  apology: ["I hear you. We can move forward from here 🤝", "Thanks for saying that. It takes maturity to own it.", "No hard feelings from me. Let's reset and keep it honest."],
  achievement: ["That is a real win — take a moment to enjoy it before the next thing starts 🎉", "You put in the work and it showed. Big congratulations 👏", "Omo, that's excellent news. You earned this one 🔥"],
  music: ["Music can change the whole mood of a day. What have you had on repeat lately? 🎧", "Afrobeats has range — from a soft late-night track to full party energy. I rate it.", "I hear you. A good song can say what a long message can't."],
  sports: ["That match talk can get intense fast 😂 Which moment stood out to you?", "Football is never just football once the group chat starts 😄", "I’m with you on the match gist. The details matter more than the final score sometimes."],
  family: ["Family conversations can carry a lot. I’m listening, and I won’t brush it off.", "That sounds personal. I hear what you’re saying about your family.", "Family can be love and stress in the same breath. Your reaction makes sense."],
  school: ["School can pile up quickly. Which deadline or subject is taking most of your attention right now?", "That sounds like a lot to balance. A short study block and one clear priority can make it feel more manageable.", "I hear you. We can break the assignment or exam prep into smaller steps instead of carrying the whole thing at once."],
  tech: ["Tell me the device, app, or error you’re dealing with and what you already tried; I can help narrow it down.", "Tech problems are easier to solve when we isolate what changed. What did you expect to happen, and what happened instead?", "I’m following the tech issue. Share the exact error or the steps that lead to it and I’ll reason through it with you."],
  celebration: ["That’s worth celebrating properly. I hope you get to enjoy the moment instead of rushing straight to the next thing 🎉", "Big moment! You deserve to take it in and make a good memory out of it 🥳", "That is lovely news. Wishing you a celebration full of the people and things you enjoy 🎊"],
  planning: ["Let’s make the plan concrete: choose the first step, give it a time, and keep one backup option.", "A useful plan needs a priority and a realistic next action. What has to happen first?", "Start with the deadline and work backward; then leave room for anything that could delay you."],
  weather: ["Weather can change the whole day. If you tell me your city, I can help you check a current forecast with the weather command.", "I hear you — heat and rain both affect the plans. The weather command can check a city’s current conditions."],
  advice: ["Let's make it practical: name the outcome you want, the main risk, and what you can control today. That gives us a clearer next step.", "I’d start with the option that protects your wellbeing and keeps the most doors open. Small reversible steps are usually safer than a rushed big move.", "My honest take: separate what you know from what you fear, then decide based on the facts you can check."],
};

function getChatState(chatId) {
  const key = chatId || "default";
  let state = chatMemory.get(key);
  if (!state) {
    state = { messages: [], replies: [], touchedAt: Date.now() };
    chatMemory.set(key, state);
  }
  state.touchedAt = Date.now();
  if (chatMemory.size > 300) {
    const oldest = [...chatMemory.entries()].sort((a, b) => a[1].touchedAt - b[1].touchedAt)[0];
    if (oldest) chatMemory.delete(oldest[0]);
  }
  return state;
}

const SAPA_RESPONSES = [
  "Omo sapa don catch you? You and me both my friend 😭😂",
  "The sapa season is really not respecting anyone this year o 💀",
  "Na so sapa dey... e don marry everybody at this point 😭",
  "Sapa dey run things? Pepper dem gang still gotta stand up! 💪",
  "You broke? Me too o. But we no go talk am outside 😂",
  "Sapa is not your portion! It's just visiting. Show it the door 🚪",
];

const JAPA_RESPONSES = [
  "Japa don catch you? The abroad spirit dey pursue everybody these days 😂",
  "Omo if you japa, abeg send money back for those of us that remain 😭",
  "Japa life is not always what they show on Instagram sha 👀",
  "Make sure if you go abroad, you don't forget where you come from 🇳🇬❤️",
  "Anywhere wey your success dey, go there. Japa or not, just be great 💯",
];

const LOVE_RESPONSES = [
  "Love? In this economy? You're brave o 😂❤️",
  "Relationship wahala is a universal experience I see 😂",
  "Omo love dey sweet when e dey good sha. Hold on tight! ❤️",
  "Your bae knows they're lucky right? Because they should 👑",
  "The heart wants what it wants — no shame in that 💕",
  "Love is a whole assignment and not everyone passes 😂",
];

const FOOD_RESPONSES = [
  "Food?! Now you're speaking my language! 🍛🔥",
  "Omo mention food and you have my full attention 😂",
  "If it's not jollof rice, I'm not interested in this conversation 😂",
  "Hunger is a whole emotion and nobody talks about it enough 😭",
  "Man cannot live on bread alone — man needs jollof, suya, and puff puff 😂",
  "Na food make the world go round honestly 🌍",
];

const HUSTLE_RESPONSES = [
  "Hustle hard, God dey! The breakthrough dey come 🔥💪",
  "Grind season? I respect the dedication! 💯",
  "No rest for the wicked and no rest for the hustlers either 😂",
  "Keep pushing. Your own time go come and e go shock everybody 🚀",
  "The grind doesn't lie. Put in the work and the results go show 🎯",
];

const TIRED_RESPONSES = [
  "Rest is not laziness. Your body is telling you something, listen to it 🙏",
  "Even the strongest person needs to recharge. Sleep! 😴",
  "Omo please rest. You can't pour from an empty cup 💯",
  "The work will still be there after you sleep. Take care of yourself 🌙",
  "Being tired is your body's way of saying 'oga, enough for today' 😂",
];

const NAIJA_RESPONSES = [
  "Nigeria... my country. No place like it honestly 🇳🇬",
  "This country ehn... e dey try us but we still love am 😂❤️",
  "Naija no dey carry last! Giant of Africa for a reason 💪",
  "9ja hard but the people harder. We're built different 🔥",
  "Nigeria is stressful but the culture, food, and vibes? Unbeatable 🌍",
];

async function getChatbotResponse(msg, transcribedText = "", chatId = "") {
  const body = String(
    transcribedText ||
    msg?.message?.conversation ||
    msg?.message?.extendedTextMessage?.text ||
    "",
  ).trim();
  const state = getChatState(chatId || msg?.key?.remoteJid);
  const mediaType = getMediaType(msg);
  const userText = body || (mediaType ? `[sent ${mediaType}]` : "");
  const previousMessage = state.messages.at(-1) || "";
  if (userText) state.messages.push(userText.slice(0, 500));
  state.messages = state.messages.slice(-8);

  const reply = (pool) => {
    const result = pickFresh(pool, state.replies);
    state.replies.push(result);
    state.replies = state.replies.slice(-8);
    return result;
  };

  // Media response
  if (mediaType === "image") return reply(R.imageReplies);
  if (mediaType === "sticker") return reply(R.stickerReplies);
  if (mediaType === "audio" && !transcribedText) return reply(R.voiceNoteReplies);
  if (mediaType === "video") return reply(["I got the video. The moment you shared must have caught your eye.", "Video received — I’m following the gist."]);

  if (!body) return reply(["I got that. Send the detail you want me to focus on and I’ll follow along.", "Message received. I’m here with you."]);

  const mood = detectMood(body);
  if (INTENT_RESPONSES[mood]) return reply(INTENT_RESPONSES[mood]);
  switch (mood) {
    case "insult": return reply(R.insultClapbacks);
    case "greeting": return reply(R.greetings);
    case "howAreYou": return reply(R.howAreYou);
    case "sad": return reply(R.sadReplies);
    case "angry": return reply(R.angryReplies);
    case "funny": return reply(R.funnyReplies);
    case "sapa": return reply(SAPA_RESPONSES);
    case "japa": return reply(JAPA_RESPONSES);
    case "love": return reply(LOVE_RESPONSES);
    case "food": return reply(FOOD_RESPONSES);
    case "hustle": return reply(HUSTLE_RESPONSES);
    case "tired": return reply(TIRED_RESPONSES);
    case "naija": return reply(NAIJA_RESPONSES);
    case "question": {
      const match = body.match(/\b(?:what is|who is|where is|when is|why does|how do i|how can i)\s+(.+?)(?:\?|$)/i);
      const subject = match?.[1]?.trim().slice(0, 100);
      if (subject) {
        return reply([
          `You're asking about ${subject}. I don't want to invent facts; give me the context or a source and I'll help break it down.`,
          `On ${subject}: I can help think it through, but I don't have a verified answer for that exact detail yet.`,
          `I caught the question about ${subject}. The useful next step is to pin down what part you need answered first.`,
        ]);
      }
      return reply([
        "I hear the question. Here’s my direct take: start with the detail that changes the outcome most, then check that against what you know.",
        "That’s worth unpacking. I don’t have enough detail to give a reliable fact, but I can help reason through the situation.",
      ]);
    }
    default: {
      if (previousMessage && /^(it|that|they|them|he|she|this|same|and then|what about)\b/i.test(body)) {
        return reply([
          `I’m connecting this to what you said just before: “${previousMessage.slice(0, 100)}.” I’m following the thread.`,
          `That sounds connected to your earlier point about “${previousMessage.slice(0, 100)}.” The extra detail helps me understand it better.`,
        ]);
      }
      const excerpt = body.replace(/\s+/g, " ").slice(0, 120);
      return reply([
        `I hear you about “${excerpt}.” That’s the part I’m focusing on, not just replying at random.`,
        `Got it — you’re talking about “${excerpt}.” I’m following. That sounds like something with a bit of context behind it.`,
        `Thanks for sharing that. “${excerpt}” gives me a clearer read on what you mean.`,
      ]);
    }
  }
}

module.exports = { getChatbotResponse, detectMood };
