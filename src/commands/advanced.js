const axios = require("axios");
const path = require("path");
const { isOwner, getJidNumber, formatTime } = require("../utils/helpers");
const db = require("../utils/database");
const cloneManager = require("../services/cloneManager");
const { cleanQuery, downloadWithYtDlp, isYouTubeUrl } = require("../services/mediaService");

const MAX_DOWNLOAD_BYTES = 50 * 1024 * 1024;
const MEDIA_TYPES = /^(audio|video|image)\/|^application\/(octet-stream|pdf|zip|x-7z-compressed|x-rar-compressed)/i;

function hasClonePermission(sender) {
  return isOwner(sender) || db.getSudos().includes(getJidNumber(sender));
}

function getDirectUrl(value) {
  try {
    const parsed = new URL(value);
    if (!["http:", "https:"].includes(parsed.protocol)) return null;
    const hostname = parsed.hostname.toLowerCase();
    if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1" || hostname.endsWith(".local")) return null;
    if (/^(10|127)\.|^192\.168\.|^172\.(1[6-9]|2\d|3[01])\./.test(hostname)) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

function fileNameFromResponse(response, url) {
  const disposition = response.headers["content-disposition"] || "";
  const match = disposition.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
  if (match?.[1]) return path.basename(decodeURIComponent(match[1])).slice(0, 100);
  const urlName = path.basename(new URL(url).pathname).replace(/[^\w.\-]/g, "_");
  if (urlName && urlName !== "_") return urlName.slice(-100);
  const type = (response.headers["content-type"] || "").split(";")[0].toLowerCase();
  const ext = { "image/jpeg": "jpg", "image/png": "png", "image/gif": "gif", "video/mp4": "mp4", "audio/mpeg": "mp3", "audio/ogg": "ogg", "application/pdf": "pdf" }[type] || "bin";
  return `matarello-download.${ext}`;
}

async function fetchMedia(url) {
  const response = await axios.get(url, {
    responseType: "arraybuffer",
    timeout: 30_000,
    maxContentLength: MAX_DOWNLOAD_BYTES,
    maxBodyLength: MAX_DOWNLOAD_BYTES,
    validateStatus: (status) => status >= 200 && status < 300,
    headers: { "User-Agent": "Matarello-Downloader/2.0" },
  });
  const contentType = response.headers["content-type"] || "application/octet-stream";
  const declaredLength = Number(response.headers["content-length"] || 0);
  if (declaredLength > MAX_DOWNLOAD_BYTES || Buffer.byteLength(response.data) > MAX_DOWNLOAD_BYTES) {
    throw new Error("The file is larger than the 50 MB limit.");
  }
  if (!MEDIA_TYPES.test(contentType)) {
    throw new Error("That URL returned a web page, not a direct media/file URL.");
  }
  return { buffer: Buffer.from(response.data), contentType, fileName: fileNameFromResponse(response, url) };
}

async function sendDownload(sock, msg, from, args, adult = false) {
  if (adult && !hasClonePermission(msg.key.participant || msg.key.remoteJid)) {
    return sock.sendMessage(from, { text: "❌ Adult-site downloads are restricted to the owner and sudo users." }, { quoted: msg });
  }
  const url = getDirectUrl(args[0]);
  if (!url) {
    return sock.sendMessage(from, {
      text: `⚠️ Usage: *!${adult ? "adultdl" : "download"} <direct media URL>*\n\nOnly public http(s) direct file URLs are supported. Maximum size: 50 MB.`,
    }, { quoted: msg });
  }
  try {
    await sock.sendMessage(from, { text: "⬇️ Downloading… please wait." }, { quoted: msg });
    const file = await fetchMedia(url);
    const payload = file.contentType.startsWith("image/") ? { image: file.buffer, caption: `⬇️ ${file.fileName}` }
      : file.contentType.startsWith("video/") ? { video: file.buffer, caption: `⬇️ ${file.fileName}`, mimetype: file.contentType }
      : file.contentType.startsWith("audio/") ? { audio: file.buffer, mimetype: file.contentType, fileName: file.fileName }
      : { document: file.buffer, fileName: file.fileName, mimetype: file.contentType };
    await sock.sendMessage(from, payload, { quoted: msg });
  } catch (error) {
    await sock.sendMessage(from, { text: `❌ Download failed: ${error.message}\n\nThis downloader accepts direct public file URLs only; it does not bypass logins, paywalls, DRM, or site protections.` }, { quoted: msg });
  }
}

function quotedEditKey(sock, msg, from) {
  const context = msg?.message?.extendedTextMessage?.contextInfo;
  if (!context?.stanzaId || !context.quotedMessage) return null;
  const botJid = sock.user?.id?.replace(/:.*@/, "@") || "";
  const participant = context.participant || "";
  if (participant !== botJid && getJidNumber(participant) !== getJidNumber(botJid)) return null;
  return { remoteJid: from, fromMe: true, id: context.stanzaId, participant: participant || botJid };
}

async function editOldMessage(sock, msg, from, args) {
  const text = args.join(" ").trim();
  if (!text) return sock.sendMessage(from, { text: "⚠️ Reply to one of the bot's text messages with *!editold <new text>*." }, { quoted: msg });
  const key = quotedEditKey(sock, msg, from);
  if (!key) return sock.sendMessage(from, { text: "❌ You can only edit a message sent by this bot. Reply directly to that message." }, { quoted: msg });
  try {
    await sock.sendMessage(from, { text, edit: key });
  } catch (error) {
    await sock.sendMessage(from, { text: `❌ WhatsApp rejected the edit: ${error.message}\n\nWhatsApp controls the edit window, so this command cannot bypass its server-side limit for very old messages.` }, { quoted: msg });
  }
}

async function youtubeDownload(sock, msg, from, args, mode = "video", asDocument = false) {
  const input = cleanQuery(args.join(" "));
  if (!input) {
    return sock.sendMessage(from, { text: mode === "audio"
      ? "⚠️ Usage: *.play <song name and artist>*"
      : "⚠️ Usage: *.youtube <YouTube URL>*" }, { quoted: msg });
  }
  if (mode === "video" && !isYouTubeUrl(input)) {
    return sock.sendMessage(from, { text: "⚠️ *.youtube* accepts a YouTube URL. Use *.play <song and artist>* for music search." }, { quoted: msg });
  }
  try {
    await sock.sendMessage(from, { text: mode === "audio" ? `🎧 Searching for *${input}*…` : "📺 Preparing YouTube download…" }, { quoted: msg });
    const file = await downloadWithYtDlp(input, mode);
    const payload = mode === "audio" && asDocument
      ? { document: file.buffer, mimetype: "audio/mpeg", fileName: file.fileName }
      : mode === "audio"
      ? { audio: file.buffer, mimetype: "audio/mpeg", fileName: file.fileName, ptt: false }
      : { video: file.buffer, mimetype: "video/mp4", fileName: file.fileName, caption: `🎬 ${file.fileName}` };
    await sock.sendMessage(from, payload, { quoted: msg });
  } catch (error) {
    await sock.sendMessage(from, { text: `❌ Media download failed: ${error.message}\n\nThe source must be public and within WhatsApp's 50 MB limit.` }, { quoted: msg });
  }
}

function adultSearchCommand(site, urlBuilder) {
  return async (sock, msg, from, args, sender) => {
    if (!hasClonePermission(sender)) return sock.sendMessage(from, { text: "❌ Adult-site search is restricted to the owner and sudo users." }, { quoted: msg });
    const query = cleanQuery(args.join(" "));
    if (!query) return sock.sendMessage(from, { text: `⚠️ Usage: *.${site} <search terms>*` }, { quoted: msg });
    const url = urlBuilder(query);
    await sock.sendMessage(from, { text: `🔞 *${site.toUpperCase()} SEARCH*\n\n🔎 ${query}\n\n${url}\n\n_Open the result in your browser. This command returns a search link and does not bypass age gates, accounts, or site protections._` }, { quoted: msg });
  };
}

const advancedCommands = {
  download: (sock, msg, from, args) => sendDownload(sock, msg, from, args, false),
  dl: (sock, msg, from, args) => sendDownload(sock, msg, from, args, false),
  adultdl: (sock, msg, from, args) => sendDownload(sock, msg, from, args, true),
  youtube: (sock, msg, from, args) => youtubeDownload(sock, msg, from, args, "video"),
  yt: (sock, msg, from, args) => youtubeDownload(sock, msg, from, args, "video"),
  ytmp4: (sock, msg, from, args) => youtubeDownload(sock, msg, from, args, "video"),
  play: (sock, msg, from, args) => youtubeDownload(sock, msg, from, args, "audio"),
  playdoc: (sock, msg, from, args) => youtubeDownload(sock, msg, from, args, "audio", true),
  ytmp3: (sock, msg, from, args) => youtubeDownload(sock, msg, from, args, "audio"),
  song: (sock, msg, from, args) => youtubeDownload(sock, msg, from, args, "audio"),
  music: (sock, msg, from, args) => youtubeDownload(sock, msg, from, args, "audio"),
  facebook: (sock, msg, from, args) => sendDownload(sock, msg, from, args, false),
  instagram: (sock, msg, from, args) => sendDownload(sock, msg, from, args, false),
  tiktok: (sock, msg, from, args) => sendDownload(sock, msg, from, args, false),
  twitter: (sock, msg, from, args) => sendDownload(sock, msg, from, args, false),
  mediafire: (sock, msg, from, args) => sendDownload(sock, msg, from, args, false),
  gdrive: (sock, msg, from, args) => sendDownload(sock, msg, from, args, false),
  xnxx: adultSearchCommand("xnxx", (query) => `https://www.xnxx.com/search/${encodeURIComponent(query)}`),
  xxx: adultSearchCommand("xxx", (query) => `https://www.xvideos.com/?k=${encodeURIComponent(query)}`),
  pornhub: adultSearchCommand("pornhub", (query) => `https://www.pornhub.com/video/search?search=${encodeURIComponent(query)}`),
  editold: editOldMessage,
  edittext: editOldMessage,

  rentclone: async (sock, msg, from, args, sender) => {
    if (!isOwner(sender)) return sock.sendMessage(from, { text: "❌ Owner only." }, { quoted: msg });
    const mentions = msg?.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const number = mentions[0] ? getJidNumber(mentions[0]) : args[0];
    const duration = cloneManager.parseDuration(mentions[0] ? args[0] : args[1]);
    if (!cloneManager.normalizeNumber(number) || !duration) {
      return sock.sendMessage(from, { text: "⚠️ Usage: *!rentclone <country-code-number> <duration>*\nExample: *!rentclone 2348012345678 7d*\nAllowed duration: minutes, hours, days, or weeks; maximum 30d." }, { quoted: msg });
    }
    try {
      const result = await cloneManager.createRental(number, duration);
      const expiry = new Date(result.rental.expiresAt).toLocaleString("en-NG", { timeZone: "Africa/Lagos" });
      const pairing = result.code ? `\n🔑 Pairing code: *${result.code}*\nAsk that number to link it in WhatsApp → Linked Devices → Link with phone number instead.` : "\nThe saved clone session will reconnect automatically.";
      await sock.sendMessage(from, { text: `✅ Clone rental created\n\n🆔 ${result.rental.id}\n📱 +${result.rental.number}\n⏳ Expires: ${expiry}${pairing}\n\nNo automatic payment is included; this command provisions the session only.` }, { quoted: msg });
    } catch (error) {
      await sock.sendMessage(from, { text: `❌ Could not create clone rental: ${error.message}` }, { quoted: msg });
    }
  },

  rentlist: async (sock, msg, from, args, sender) => {
    if (!isOwner(sender)) return sock.sendMessage(from, { text: "❌ Owner only." }, { quoted: msg });
    const rentals = cloneManager.listRentals();
    if (!rentals.length) return sock.sendMessage(from, { text: "ℹ️ No active clone rentals." }, { quoted: msg });
    const text = rentals.map((rental) => `• *${rental.id}*\n  +${rental.number} — ${rental.status}\n  Expires in ${formatTime(rental.expiresAt - Date.now())}${rental.pairingCode ? `\n  Pairing: *${rental.pairingCode}*` : ""}`).join("\n\n");
    await sock.sendMessage(from, { text: `📋 *Active Clone Rentals*\n\n${text}` }, { quoted: msg });
  },

  stopclone: async (sock, msg, from, args, sender) => {
    if (!isOwner(sender)) return sock.sendMessage(from, { text: "❌ Owner only." }, { quoted: msg });
    if (!args[0]) return sock.sendMessage(from, { text: "⚠️ Usage: *!stopclone <clone id or number>*" }, { quoted: msg });
    const rental = await cloneManager.stopClone(args[0]);
    await sock.sendMessage(from, { text: rental ? `✅ Clone *${rental.id}* for +${rental.number} has been stopped.` : "❌ No matching clone rental found." }, { quoted: msg });
  },
};

module.exports = advancedCommands;