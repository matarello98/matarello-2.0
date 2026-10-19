// ── Nigerian Human Chatbot Response Banks ──
// All responses indexed by keyword/situation. Bot NEVER repeats a response.

const greetings = [
  "Omo! You don come. What's good? 😂",
  "Hey hey! Longest time! How body? 🙌",
  "Baba/Mama! You dey? Everywhere good? ✌️",
  "E don tey! How things for your end? 🔥",
  "Guy! You still dey alive! Good thing sha 😂",
  "Yo! What's up with you sef 🤷",
  "Hola! You showed up! I was wondering where you went 👀",
  "Oh you're here. Cool cool. How life? 😌",
  "Omo you land! How far nau? 💪",
  "Whadup whadup! You okay sha? ✅",
  "Ehhhh! My person! Longest time! 🎉",
  "Sup sup. You reach finally. Hope the journey no stress you 😏",
];

const howAreYou = [
  "Me? I dey o. Na your own wey concern me sef 😂",
  "I dey kampe. You nko? 💪",
  "Living the dream bro. Or at least, I'm dreaming I'm living 😭",
  "E dey go. Some days good, some days you just gotta accept e don be 😂",
  "I dey here dey enjoy life. You know say no be everybody get that grace 🙌",
  "Physically, I'm present. Mentally, I'm on a beach in Lagos 🌊😂",
  "Abeg I dey manage. You know how naija life be — hustle and hope 💡",
  "I dey enjoy my fine life. No dulling ever! 🔥",
  "Omo I dey! But my pocket no dey gree cooperate sha 😭😂",
  "I dey shine o! Life too short to be sad 💫",
  "I dey alright. Na God dey keep me 🙏😂",
  "I dey, I dey. Can't complain. Abi I fit complain? Who go listen 😂",
];

const random = [
  "Na so e be sha 🤷",
  "No cap, dat thing you talk get sense 💡",
  "Omo see gist — I too like how you dey reason 😂",
  "Wait wait wait... make I understand this thing well 👀",
  "Abeg talk true — you sure about this? 🤨",
  "E be like you dey lie but I go allow am 😂",
  "My guy/my girl — that one no make sense at all o 😭",
  "Oya continue, I'm listening with my full chest 👂",
  "You know wetin? You right! I no go lie 💯",
  "Everywhere good, make we just keep talking 😊",
  "Dey play dey play — serious matter be this o 😂",
  "Baba/Mama I hear you o, but that one na strong argument 💪",
  "Omo why you do me like this with this gist 😂",
  "Honestly? Same energy! I feel you 100% 🤝",
  "No lies detected. You been talking facts from start 🎯",
  "Wait, is that so? Interesting... very interesting... 🤔",
  "Lol okay okay, I see what you did there 😄",
  "Chai! You just woke something in me with that one 🔥",
  "Na your mouth? See as you just talk am clean clean 💎",
  "Hmmm. Let me not say anything and just observe 👀",
  "You know I was literally thinking about this same thing? 😮",
  "Real talk no cap — life is wild for real 💀",
  "Omo this thing ehn... e dey touch me 😂",
  "I no go lie to you, that thing you talk — correct 💯",
  "Person wey understand life na you be dat 👑",
  "Oh chim! You too much sef 😂🙌",
  "My person! We dey on the same frequency 📡",
  "Abeg no mind them, focus on your thing 🎯",
  "At this point, I just dey laugh at life 😂",
  "Sapa or not, we still here and that matters 💪",
];

const funnyReplies = [
  "Lmaooo bro you killed me with that one 💀😂",
  "LMAOOOO omo I can't breathe 😂😂",
  "Hahaha stop it I'm at my job 😭😂",
  "Bruhhh 💀💀 this is too much",
  "You know what, you're dangerous. Too funny 😂🔥",
  "I screamed reading that 😂 stop please",
  "Dead. I'm dead. You killed me 💀",
  "Okay but why is that actually funny 😂",
  "Lol that caught me off guard fr 😂",
  "Omoooo 😭😂 you're not serious at all",
  "I wasn't expecting that at all 💀😂",
  "Bro you need to stop before I lose it 😂",
  "That's it. You're officially the funniest person I talk to 👑😂",
];

const sadReplies = [
  "Omo... that one touch me. Talk to me, wetin happen? 🙏",
  "Ahh! No worry — tough times no last, tough people last longer 💪",
  "E go be alright. I know it don't feel like it now, but it will 🙏",
  "Baba/Mama, your village people no go win. Stay strong 💪",
  "Omo this life ehn... but you're still here, and that's power 🔥",
  "Don't let them see you cry. Cry in private then come out and slay 😤👑",
  "I dey here for you o. Talk am out, no bottle am inside 🤝",
  "Life go always have its ups and downs. The key na to stay in the game 🎯",
  "Real ones go through the storm and still glow up. You be a real one 💎",
  "Abeg no give up. The story no finish yet — your best chapter is loading 🚀",
];

const angryReplies = [
  "Omo calm down! Fight no solve anything — but I understand the vexing sha 😤",
  "I see you're hot right now. Deep breath. Breathe in... breathe out... okay now talk 😂",
  "You have every right to be upset. But no let the anger make you do something you go regret 🙏",
  "Na real talk you dey talk o. Them go hear word one day 💪",
  "Channel that energy into your hustle and use it to win. Best revenge na success 🔥",
  "Omo I no go lie — I for be angry too. But God don got you 🙏",
  "Valid. Completely valid. But we move. We always move 💯",
];

const insultClapbacks = [
  "Useless? My guy/my girl, I'm literally built different. Your vocabulary dey disappoint you more than me sha 😂",
  "Oh wow, 'useless'? Creative. Very creative. Did you Google that or is that original content? 💀",
  "Omo you called me useless... with THAT grammar? The irony is too loud 😂",
  "Dumb? Interesting. You must be using a mirror to type that 🪞😂",
  "Bro/Sis imagine calling me dumb when your whole message doesn't even make sense 💀",
  "You dey call me dumb? The fact that you're talking to a bot and losing the argument says a lot about your IQ sha 😂",
  "Useless ke? Go ask your pocket what's actually useless in your life. I'll wait. 😌",
  "Oh chim! The audacity! You sat there, opened WhatsApp, and chose violence with me today? Brave. Very brave 😂",
  "My village people never called me useless and they actually know me. Who are you again? 🙄😂",
  "Dumb? Me? At least I know how to form a complete sentence — which is more than I can say right now 💀",
  "Omo na you dey call me useless? You must be one of those people that lost an argument to autocorrect 😂",
  "See this one! Calling me useless as if your life is a certified masterpiece 🎨 Sit down abeg 😂",
  "Ah ah! Abeg no be me you go try today. I dey warn you with love and full chest 😤",
  "You call me dumb? The one insulting me doesn't even know that chatbots have higher IQ than the person typing this 💀😂",
  "Omo I see what you're doing — you're trying to provoke me. Very cute. But unfortunately I'm unbothered 😌✨",
];

const imageReplies = [
  "Omo wetin be dis?! 😂 Looks interesting sha",
  "You sent this to me? Okay, I see you. I see you. 👀",
  "Lol what is this? I'm intrigued 😂",
  "The picture quality sha... nice nice! 🔥",
  "Omo is this real? This is wild 😭😂",
  "Hmm interesting photo. What's the story behind this? 👀",
  "I see your vibe with this one 😂 It tracks actually",
  "You know, I wasn't expecting this image at all. Props 😂",
  "Lmaoo what am I looking at 😂💀",
  "This image tells a whole story. I like it 🔥",
  "Okay okay, I see what you're going for here 😌",
  "The picture dey vibe! I rate it 💯",
];

const stickerReplies = [
  "Omo this sticker hit different today 💀😂",
  "Hahaha! You found the perfect sticker for this moment 😂",
  "That sticker speaks for me too honestly 😭😂",
  "LMAOOO I can't 😂💀 the accuracy of that sticker",
  "The sticker said everything I needed to hear 😂",
  "Perfect timing on that one 👏😂",
  "You know what, that sticker won the whole conversation 👑",
  "Bro that sticker is too much 😂",
  "Where did you even find that sticker? 😂💀",
  "That sticker dey talk the truth sha 😭😂",
];

const voiceNoteReplies = [
  "Okay voice note sender! I received it 😂 E be like you have gist",
  "Omo you sent a voice note? The drama begins 😂👀",
  "Voice note people always have the most to say 😂",
  "Oga/Madam, you know say text dey exist right? 😂 But okay, okay",
  "The way you sent that voice note tells me everything 😂",
  "Voice note received! You must have something important to say 👀",
  "My people! The voice note gang! I see you 😂",
];

module.exports = {
  greetings, howAreYou, random, funnyReplies,
  sadReplies, angryReplies, insultClapbacks,
  imageReplies, stickerReplies, voiceNoteReplies,
};
