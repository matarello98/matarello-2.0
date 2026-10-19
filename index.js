require("./src/utils/signalLogRedaction")();

const {
  default: makeWASocket,
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  makeInMemoryStore,
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const path = require("path");
const fs = require("fs");
const { handleMessage, handleGroupUpdate } = require("./src/handlers/messageHandler");
const cloneManager = require("./src/services/cloneManager");
const cfg = require("./src/config");

const AUTH_DIR = path.join(__dirname, "auth");
const DATA_DB_DIR = path.join(__dirname, "src/data/db");

[AUTH_DIR, DATA_DB_DIR].forEach((d) => { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); });
cloneManager.setHandlers({ handleMessage, handleGroupUpdate });

const logger = pino({ level: "silent" });

// ── COLORFUL BANNER ──
function printBanner() {
  const c = {
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    green: "\x1b[32m",
    cyan: "\x1b[36m",
    yellow: "\x1b[33m",
    magenta: "\x1b[35m",
    red: "\x1b[31m",
    blue: "\x1b[34m",
    white: "\x1b[37m",
    bgGreen: "\x1b[42m",
    bgMagenta: "\x1b[45m",
  };
  console.log(`\n${c.magenta}${c.bright}╔══════════════════════════════════════════╗${c.reset}`);
  console.log(`${c.magenta}${c.bright}║${c.reset}   ${c.cyan}${c.bright}🔥 MATARELLO 2.0 — WhatsApp Bot 🔥${c.reset}   ${c.magenta}${c.bright}║${c.reset}`);
  console.log(`${c.magenta}${c.bright}╠══════════════════════════════════════════╣${c.reset}`);
  console.log(`${c.magenta}${c.bright}║${c.reset}  ${c.green}👑 Owner: ${cfg.ownerName}${c.reset}        ${c.magenta}${c.bright}║${c.reset}`);
  console.log(`${c.magenta}${c.bright}║${c.reset}  ${c.yellow}📱 Number: ${cfg.botNumber ? `+${cfg.botNumber}` : "linked session"}${c.reset}        ${c.magenta}${c.bright}║${c.reset}`);
  console.log(`${c.magenta}${c.bright}║${c.reset}  ${c.cyan}⌨️  Prefix: ${cfg.prefix}${c.reset}                       ${c.magenta}${c.bright}║${c.reset}`);
  console.log(`${c.magenta}${c.bright}║${c.reset}  ${c.blue}🇳🇬 Version: ${cfg.version}${c.reset}                   ${c.magenta}${c.bright}║${c.reset}`);
  console.log(`${c.magenta}${c.bright}╚══════════════════════════════════════════╝${c.reset}\n`);
}

async function startBot() {
  printBanner();

  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  if (!state.creds.registered && !cfg.botNumber) {
    throw new Error("Set BOT_NUMBER to the WhatsApp account's country-code number (digits only) in the host's environment/secrets before first pairing.");
  }
  const { version } = await fetchLatestBaileysVersion();

  console.log(`\x1b[36m📡 Connecting to WhatsApp (Baileys v${version.join(".")})\x1b[0m`);

  const sock = makeWASocket({
    version,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger),
    },
    logger,
    printQRInTerminal: false,
    browser: ["Ubuntu", "Chrome", "20.0.04"],
    markOnlineOnConnect: true,
    syncFullHistory: false,
    connectTimeoutMs: 60000,
    defaultQueryTimeoutMs: undefined,
    keepAliveIntervalMs: 10000,
    qrMaxRetries: 10,
    retryRequestDelayMs: 250,
    getMessage: async () => ({ conversation: "" }),
  });

  // ── PAIRING CODE (8-digit, phone number login) ──
  if (!state.creds.registered) {
    const phoneNumber = cfg.botNumber;
    console.log(`\x1b[33m⏳ Requesting pairing code for +${phoneNumber}...\x1b[0m`);
    await new Promise((r) => setTimeout(r, 3000));
    try {
      const code = await sock.requestPairingCode(phoneNumber);
      const formatted = code?.match(/.{1,4}/g)?.join("-") || code;
      console.log(`\n\x1b[42m\x1b[30m╔══════════════════════════════════╗\x1b[0m`);
      console.log(`\x1b[42m\x1b[30m║  🔑 YOUR 8-DIGIT PAIRING CODE:  ║\x1b[0m`);
      console.log(`\x1b[42m\x1b[30m║                                  ║\x1b[0m`);
      console.log(`\x1b[42m\x1b[30m║     \x1b[1m${formatted.padStart(8)}\x1b[0m\x1b[42m\x1b[30m                   ║\x1b[0m`);
      console.log(`\x1b[42m\x1b[30m║                                  ║\x1b[0m`);
      console.log(`\x1b[42m\x1b[30m╚══════════════════════════════════╝\x1b[0m`);
      console.log(`\n\x1b[33m📲 Steps to link:\x1b[0m`);
      console.log(`\x1b[37m  1. Open WhatsApp on your phone (+${phoneNumber})\x1b[0m`);
      console.log(`\x1b[37m  2. Go to ⋮ (Menu) → Linked Devices\x1b[0m`);
      console.log(`\x1b[37m  3. Tap "Link a Device"\x1b[0m`);
      console.log(`\x1b[37m  4. Tap "Link with phone number instead"\x1b[0m`);
      console.log(`\x1b[37m  5. Enter the code above: ${formatted}\x1b[0m\n`);
    } catch (e) {
      console.error(`\x1b[31m❌ Failed to get pairing code: ${e.message}\x1b[0m`);
    }
  }

  // ── CONNECTION EVENTS ──
  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === "close") {
      const reason = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = reason !== DisconnectReason.loggedOut && reason !== 401;
      console.log(`\x1b[31m🔌 Connection closed. Reason: ${lastDisconnect?.error?.message || "Unknown"}\x1b[0m`);
      if (shouldReconnect) {
        console.log(`\x1b[33m🔄 Reconnecting in 5 seconds...\x1b[0m`);
        setTimeout(startBot, 5000);
      } else {
        console.log(`\x1b[31m🚪 Logged out! Delete the ./auth folder and restart to reconnect.\x1b[0m`);
      }
    } else if (connection === "open") {
      const linkedNumber = String(sock.user?.id || "").split(":")[0].split("@")[0].replace(/\D/g, "");
      if (linkedNumber) {
        if (!cfg.botNumber) cfg.botNumber = linkedNumber;
        if (!cfg.ownerNumber) cfg.ownerNumber = linkedNumber;
        if (!cfg.ownerNumbers.includes(linkedNumber)) cfg.ownerNumbers.push(linkedNumber);
      }
      console.log(`\n\x1b[32m╔══════════════════════════════════════╗\x1b[0m`);
      console.log(`\x1b[32m║  ✅ MATARELLO 2.0 IS CONNECTED! 🔥  ║\x1b[0m`);
      console.log(`\x1b[32m║  Ready to receive commands!          ║\x1b[0m`);
      console.log(`\x1b[32m╚══════════════════════════════════════╝\x1b[0m\n`);
    } else if (connection === "connecting") {
      console.log(`\x1b[33m⚡ Connecting to WhatsApp...\x1b[0m`);
    }
  });

  // ── SAVE CREDENTIALS ──
  sock.ev.on("creds.update", saveCreds);

  // ── INCOMING MESSAGES ──
  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;
    for (const msg of messages) {
      await handleMessage(sock, msg);
    }
  });

  // ── GROUP UPDATES (join/leave) ──
  sock.ev.on("group-participants.update", async (update) => {
    await handleGroupUpdate(sock, update);
  });

  await cloneManager.initializeClones();
  return sock;
}

startBot().catch((err) => {
  console.error(`\x1b[31m💥 Fatal error:\x1b[0m`, err);
  process.exit(1);
});
