const dns = require("node:dns/promises");
const net = require("node:net");
const cfg = require("../config");
const info = require("./info");
const utility = require("./utility");
const fun = require("./fun");
const games = require("./games");
const advanced = require("./advanced");
const extras = require("./extra");
const owner = require("./owner");
const settings = require("./settings").settingsCommands;
const getSetting = require("./settings").getSetting;
const stickerCommands = require("./stickers");
const group = require("./group");
const groupExtra = require("./groupextra");
const sports = require("./sports");

function decodeXml(value = "") {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'");
}

function normalizeDomain(input) {
  const raw = String(input || "").trim();
  if (!raw) return null;
  try {
    const parsed = new URL(/^[a-z]+:\/\//i.test(raw) ? raw : `https://${raw}`);
    const hostname = parsed.hostname.toLowerCase().replace(/\.$/, "");
    if (net.isIP(hostname) || hostname.length > 253 || hostname === "localhost" || hostname.endsWith(".local")) return null;
    const labels = hostname.split(".");
    if (labels.length < 2 || labels.some((label) => !/^(?!-)[a-z0-9-]{1,63}(?<!-)$/.test(label))) return null;
    return hostname;
  } catch {
    return null;
  }
}

async function sendError(sock, msg, from, label, error) {
  await sock.sendMessage(from, { text: `❌ ${label} failed: ${error.message}` }, { quoted: msg });
}

const advicePool = [
  "Pause before replying while you are upset. A clear message later usually works better than a fast one now.",
  "Break the problem into the next action you can finish today. You do not need to solve the whole thing at once.",
  "When choosing between options, write down what matters most and what you can still change later.",
  "Protect your time and be direct about what you can realistically commit to.",
  "Ask for the specific help you need. People often respond better when the request is clear.",
];

async function listRegisteredCommands(sock, msg, from) {
  const registries = [
    require("./info"), require("./fun"), require("./utility"), require("./media"),
    require("./group"), require("./owner"), require("./settings").settingsCommands,
    require("./extra"), require("./groupextra"), require("./sports"),
    require("./advanced"), require("./stickers"), require("./audio"), module.exports,
  ];
  const registry = Object.assign({}, ...registries);
  const placeholderPattern = /feature coming soon|coming soon|not implemented|not connected|requires setup/i;
  const names = Object.entries(registry)
    .filter(([, handler]) => typeof handler === "function"
      && (handler === listRegisteredCommands || !placeholderPattern.test(handler.toString())))
    .map(([name]) => name)
    .filter((name) => /^[a-z0-9_-]+$/i.test(name))
    .sort();
  const pages = [];
  for (let i = 0; i < names.length; i += 90) pages.push(names.slice(i, i + 90));
  await sock.sendMessage(from, {
    text: `📚 *Implemented commands — ${names.length} total*\nPrefix: \`${getSetting("prefix", cfg.prefix)}\` (legacy \`!\` also works)\n\n${pages[0].join("  •  ")}`,
  }, { quoted: msg });
  for (let page = 1; page < pages.length; page += 1) {
    await sock.sendMessage(from, { text: `📚 *Commands — ${page + 1}/${pages.length}*\n${pages[page].join("  •  ")}` });
  }
}

const userRequestedCommands = {
  alive: info.ping,
  ping2: info.ping,
  about: info.botinfo,
  owner: info.botinfo,
  repo: settings.repo,
  save: extras.savestatus,
  image: advanced.download,
  ytsearch: advanced.play,
  take: stickerCommands.savesticker,
  addjid: owner.addsudo,
  autorecording: settings.autorecord,
  autoreply: settings.chatbot,
  autotyping: settings.autotype,
  getsudo: owner.listsudo,
  mysudo: owner.listsudo,
  rentbot: advanced.rentclone,
  insult: fun.roast,
  hangman: games.hangman,
  quiz: games.trivia,
  topdf: extras.texttopdf,
  url: extras.tourl,
  getgpp: groupExtra.getgrouppp,
  getparticipants: group.members,
  invite: group.grouplink,
  link: group.grouplink,
  mute: group.closegroup,
  unmute: group.opengroup,
  welcome: group.setwelcome,
  goodbye: group.setgoodbye,
  warnings: group.warnlist,
  wwe: sports.wwenews,

  fixtures: async (sock, msg, from, args, sender) => routeSport(sock, msg, from, args, sender, "matches"),
  standings: async (sock, msg, from, args, sender) => routeSport(sock, msg, from, args, sender, "standings"),
  topscorers: async (sock, msg, from, args, sender) => routeSport(sock, msg, from, args, sender, "scorers"),

  commands: listRegisteredCommands,
  allcommands: listRegisteredCommands,

  getid: async (sock, msg, from) => {
    await sock.sendMessage(from, { text: `Chat ID: ${from}` }, { quoted: msg });
  },
  getjid: async (sock, msg, from, args, sender) => {
    await sock.sendMessage(from, { text: `Chat JID: ${from}\nYour sender JID: ${sender}` }, { quoted: msg });
  },
  prefixinfo: async (sock, msg, from) => {
    await sock.sendMessage(from, { text: `The command prefix is *${getSetting("prefix", cfg.prefix)}*. The legacy *!* prefix is also accepted.` }, { quoted: msg });
  },
  trim: async (sock, msg, from, args) => {
    const text = args.join(" ").replace(/\s+/g, " ").trim();
    await sock.sendMessage(from, { text: text || "Usage: *.trim <text>*" }, { quoted: msg });
  },
  advice: async (sock, msg, from) => {
    const { getRandom } = require("../utils/helpers");
    await sock.sendMessage(from, { text: `💡 ${getRandom(advicePool)}` }, { quoted: msg });
  },
  fbsearch: async (sock, msg, from, args) => {
    const query = args.join(" ").trim();
    if (!query) return sock.sendMessage(from, { text: "Usage: *.fbsearch <search terms>*" }, { quoted: msg });
    await sock.sendMessage(from, { text: `🔎 Facebook search for “${query}”:\nhttps://www.facebook.com/search/top/?q=${encodeURIComponent(query)}` }, { quoted: msg });
  },
  news: async (sock, msg, from) => {
    try {
      const response = await fetch("https://feeds.bbci.co.uk/news/world/rss.xml", { signal: AbortSignal.timeout(12_000) });
      if (!response.ok) throw new Error(`News feed returned HTTP ${response.status}`);
      const xml = await response.text();
      const items = [...xml.matchAll(/<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/gi)].slice(0, 6);
      const stories = items.map(([, item]) => {
        const title = decodeXml(item.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "").trim();
        const link = decodeXml(item.match(/<link[^>]*>([\s\S]*?)<\/link>/i)?.[1] || "").trim();
        return title && link ? `• ${title}\n  ${link}` : "";
      }).filter(Boolean);
      if (!stories.length) throw new Error("The news feed had no readable headlines.");
      await sock.sendMessage(from, { text: `📰 *Latest world headlines (BBC)*\n\n${stories.join("\n\n")}` }, { quoted: msg });
    } catch (error) {
      await sendError(sock, msg, from, "News", error);
    }
  },
  define: async (sock, msg, from, args) => {
    const word = args.join(" ").trim();
    if (!word) return sock.sendMessage(from, { text: "Usage: *.define <word>*" }, { quoted: msg });
    try {
      const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`, { signal: AbortSignal.timeout(12_000) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || "No definition was found.");
      const meanings = (payload[0]?.meanings || []).slice(0, 3).map((meaning) => {
        const definition = meaning.definitions?.[0]?.definition;
        return definition ? `• *${meaning.partOfSpeech || "Meaning"}:* ${definition}` : "";
      }).filter(Boolean);
      if (!meanings.length) throw new Error("No definition was found.");
      await sock.sendMessage(from, { text: `📖 *${payload[0].word}*\n\n${meanings.join("\n\n")}` }, { quoted: msg });
    } catch (error) {
      await sendError(sock, msg, from, "Dictionary lookup", error);
    }
  },
  translate: async (sock, msg, from, args) => {
    const languages = String(args[0] || "").split("|");
    const text = args.slice(1).join(" ").trim();
    if (languages.length !== 2 || !text) {
      return sock.sendMessage(from, { text: "Usage: *.translate <source-language>|<target-language> <text>*\nExample: *.translate en|fr Good morning*" }, { quoted: msg });
    }
    if (languages.length !== 2 || !/^[a-z]{2,3}$/i.test(languages[0]) || !/^[a-z]{2,3}$/i.test(languages[1])) {
      return sock.sendMessage(from, { text: "Use two language codes, for example *.translate en|fr Hello*." }, { quoted: msg });
    }
    try {
      const url = new URL("https://api.mymemory.translated.net/get");
      url.searchParams.set("q", text);
      url.searchParams.set("langpair", `${languages[0]}|${languages[1]}`);
      const response = await fetch(url, { signal: AbortSignal.timeout(12_000) });
      const payload = await response.json();
      if (!response.ok || payload.responseStatus !== 200) throw new Error(payload.responseDetails || `Translation failed (${response.status}).`);
      await sock.sendMessage(from, { text: `🌐 *Translation (${languages[0]} → ${languages[1]}):*\n${decodeXml(payload.responseData?.translatedText || "")}` }, { quoted: msg });
    } catch (error) {
      await sendError(sock, msg, from, "Translation", error);
    }
  },
  whois: async (sock, msg, from, args) => {
    const domain = normalizeDomain(args[0]);
    if (!domain) return sock.sendMessage(from, { text: "Usage: *.whois <public domain>* (not an IP address or local hostname)" }, { quoted: msg });
    try {
      const response = await fetch(`https://rdap.org/domain/${encodeURIComponent(domain)}`, { signal: AbortSignal.timeout(12_000) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.title || `RDAP lookup returned HTTP ${response.status}`);
      const registrar = data.entities?.find((entity) => entity.roles?.includes("registrar"))?.vcardArray?.[1]?.find((item) => item[0] === "fn")?.[3];
      const events = (data.events || []).filter((event) => ["registration", "last changed", "expiration"].includes(event.eventAction));
      const lines = [
        `🌐 *Domain record: ${domain}*`,
        registrar ? `Registrar: ${registrar}` : "",
        ...events.map((event) => `${event.eventAction}: ${event.eventDate}`),
        data.status?.length ? `Status: ${data.status.join(", ")}` : "",
      ].filter(Boolean);
      await sock.sendMessage(from, { text: lines.join("\n") }, { quoted: msg });
    } catch (error) {
      await sendError(sock, msg, from, "Domain lookup", error);
    }
  },
  dnslookup: async (sock, msg, from, args) => {
    const domain = normalizeDomain(args[0]);
    if (!domain) return sock.sendMessage(from, { text: "Usage: *.dnslookup <public domain>*" }, { quoted: msg });
    const lookups = await Promise.allSettled([
      dns.resolve4(domain), dns.resolve6(domain), dns.resolveMx(domain),
    ]);
    const lines = [`🌐 *DNS records for ${domain}*`];
    if (lookups[0].status === "fulfilled") lines.push(`A: ${lookups[0].value.join(", ")}`);
    if (lookups[1].status === "fulfilled") lines.push(`AAAA: ${lookups[1].value.join(", ")}`);
    if (lookups[2].status === "fulfilled") lines.push(`MX: ${lookups[2].value.map((record) => `${record.exchange} (priority ${record.priority})`).join(", ")}`);
    if (lines.length === 1) lines.push("No A, AAAA, or MX records were returned.");
    await sock.sendMessage(from, { text: lines.join("\n") }, { quoted: msg });
  },
  shorturl: async (sock, msg, from, args) => {
    let url;
    try {
      url = new URL(args[0]);
      if (!["https:", "http:"].includes(url.protocol) || !normalizeDomain(url.hostname)) throw new Error();
    } catch {
      return sock.sendMessage(from, { text: "Usage: *.shorturl https://public-site.example/page*" }, { quoted: msg });
    }
    try {
      const endpoint = new URL("https://is.gd/create.php");
      endpoint.searchParams.set("format", "simple");
      endpoint.searchParams.set("url", url.toString());
      const response = await fetch(endpoint, { signal: AbortSignal.timeout(12_000) });
      const result = (await response.text()).trim();
      if (!response.ok || !/^https:\/\/is\.gd\/[A-Za-z0-9]+$/.test(result)) throw new Error(result.slice(0, 160) || `Shortener returned HTTP ${response.status}`);
      await sock.sendMessage(from, { text: `🔗 ${result}` }, { quoted: msg });
    } catch (error) {
      await sendError(sock, msg, from, "URL shortening", error);
    }
  },
  movie: async (sock, msg, from, args) => {
    const query = args.join(" ").trim();
    if (!query) return sock.sendMessage(from, { text: "Usage: *.movie <title>*" }, { quoted: msg });
    await sock.sendMessage(from, { text: `🎬 Search movie information for “${query}”:\nhttps://www.themoviedb.org/search?query=${encodeURIComponent(query)}\n\nThis opens a public search page; it does not claim to fetch a streaming copy.` }, { quoted: msg });
  },
  trailer: async (sock, msg, from, args) => {
    const query = args.join(" ").trim();
    if (!query) return sock.sendMessage(from, { text: "Usage: *.trailer <movie title>*" }, { quoted: msg });
    await sock.sendMessage(from, { text: `▶️ Search trailers for “${query}”:\nhttps://www.youtube.com/results?search_query=${encodeURIComponent(`${query} official trailer`)}` }, { quoted: msg });
  },
};

async function routeSport(sock, msg, from, args, sender, operation) {
  const aliases = {
    epl: "epl", premier: "epl", premierleague: "epl",
    laliga: "laliga", bundesliga: "bundesliga", seriea: "seriea",
    ligue1: "ligue1", efl: "efl", europa: "el", champions: "cl",
    championsleague: "cl", worldcup: "wc", wc: "wc",
  };
  const league = aliases[String(args[0] || "epl").toLowerCase()];
  const command = league && sports[`${league}${operation}`];
  if (typeof command !== "function") {
    return sock.sendMessage(from, {
      text: `Usage: *.${operation === "matches" ? "fixtures" : operation === "scorers" ? "topscorers" : "standings"} <league>*\nSupported: epl, laliga, bundesliga, seriea, ligue1, efl, europa, champions, worldcup.`,
    }, { quoted: msg });
  }
  return command(sock, msg, from, args.slice(1), sender);
}

module.exports = userRequestedCommands;
