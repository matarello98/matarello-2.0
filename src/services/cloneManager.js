const fs = require("fs");
const path = require("path");
const pino = require("pino");
const {
  default: makeWASocket,
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
} = require("@whiskeysockets/baileys");
const cfg = require("../config");
const db = require("../utils/database");

const CLONE_DIR = path.join(__dirname, "../../auth/clones");
const logger = pino({ level: "silent" });
const sessions = new Map();
let messageHandler = null;
let groupHandler = null;

if (!fs.existsSync(CLONE_DIR)) fs.mkdirSync(CLONE_DIR, { recursive: true });

function setHandlers(handlers) {
  messageHandler = handlers.handleMessage;
  groupHandler = handlers.handleGroupUpdate;
}

function normalizeNumber(value) {
  const number = String(value || "").replace(/\D/g, "");
  return number.length >= 7 ? number : null;
}

function parseDuration(value) {
  const match = String(value || "").trim().toLowerCase().match(/^(\d+(?:\.\d+)?)(m|h|d|w)$/);
  if (!match) return null;
  const amount = Number(match[1]);
  const multipliers = { m: 60_000, h: 3_600_000, d: 86_400_000, w: 604_800_000 };
  const duration = amount * multipliers[match[2]];
  if (!Number.isFinite(duration) || duration < 60_000 || duration > 30 * 86_400_000) return null;
  return duration;
}

function formatCode(code) {
  return code?.match(/.{1,4}/g)?.join("-") || code || null;
}

function safeCloneId(number) {
  return `CLONE-${number}-${Date.now().toString(36).toUpperCase()}`;
}

async function stopSocket(id) {
  const session = sessions.get(id);
  if (!session) return;
  session.stopping = true;
  sessions.delete(id);
  try { session.sock.ws?.close(); } catch {}
}

async function startClone(rental, requestPairing = true) {
  if (rental.expiresAt <= Date.now()) {
    db.removeCloneRental(rental.id);
    return { rental, expired: true };
  }
  if (sessions.has(rental.id)) return { rental, session: sessions.get(rental.id) };

  const authDir = path.join(CLONE_DIR, rental.id);
  fs.mkdirSync(authDir, { recursive: true });
  const { state, saveCreds } = await useMultiFileAuthState(authDir);
  const { version } = await fetchLatestBaileysVersion();
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
    connectTimeoutMs: 60_000,
    defaultQueryTimeoutMs: undefined,
    keepAliveIntervalMs: 10_000,
    qrMaxRetries: 10,
    retryRequestDelayMs: 250,
    getMessage: async () => ({ conversation: "" }),
  });

  const session = { sock, rental, stopping: false };
  sessions.set(rental.id, session);

  sock.ev.on("creds.update", saveCreds);
  sock.ev.on("connection.update", async ({ connection, lastDisconnect }) => {
    const active = sessions.get(rental.id);
    if (!active || active.stopping) return;
    if (connection === "open") {
      rental.status = "active";
      rental.pairingCode = null;
      db.saveCloneRental(rental);
      console.log(`✅ Clone ${rental.id} connected for +${rental.number}`);
    }
    if (connection === "close") {
      const reason = lastDisconnect?.error?.output?.statusCode;
      sessions.delete(rental.id);
      if (rental.expiresAt <= Date.now() || reason === DisconnectReason.loggedOut || reason === 401) {
        rental.status = rental.expiresAt <= Date.now() ? "expired" : "logged_out";
        db.saveCloneRental(rental);
        console.log(`ℹ️ Clone ${rental.id} stopped (${rental.status}).`);
        return;
      }
      console.log(`🔄 Clone ${rental.id} disconnected; reconnecting in 5 seconds.`);
      setTimeout(() => startClone(rental, false).catch((error) => {
        console.error(`Clone ${rental.id} reconnect failed:`, error.message);
      }), 5_000);
    }
  });

  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify" || !messageHandler) return;
    for (const message of messages) await messageHandler(sock, message);
  });
  sock.ev.on("group-participants.update", async (update) => {
    if (groupHandler) await groupHandler(sock, update);
  });

  if (!state.creds.registered && requestPairing) {
    await new Promise((resolve) => setTimeout(resolve, 2_500));
    const code = formatCode(await sock.requestPairingCode(rental.number));
    rental.status = "awaiting_pairing";
    rental.pairingCode = code;
    db.saveCloneRental(rental);
    console.log(`🔑 Clone ${rental.id} pairing code for +${rental.number}: ${code}`);
    return { rental, code };
  }

  return { rental };
}

async function createRental(number, durationMs) {
  const normalized = normalizeNumber(number);
  if (!normalized) throw new Error("Enter a valid phone number with country code.");
  const existing = Object.values(db.getCloneRentals()).find((item) => item.number === normalized && item.expiresAt > Date.now());
  if (existing) throw new Error(`That number already has active clone ${existing.id}.`);
  const rental = {
    id: safeCloneId(normalized),
    number: normalized,
    createdAt: Date.now(),
    expiresAt: Date.now() + durationMs,
    status: "starting",
    pairingCode: null,
  };
  db.saveCloneRental(rental);
  try {
    return await startClone(rental);
  } catch (error) {
    db.removeCloneRental(rental.id);
    throw error;
  }
}

async function stopClone(idOrNumber) {
  const value = String(idOrNumber || "").trim();
  const rentals = db.getCloneRentals();
  const rental = rentals[value] || Object.values(rentals).find((item) => item.number === normalizeNumber(value));
  if (!rental) return null;
  await stopSocket(rental.id);
  db.removeCloneRental(rental.id);
  return rental;
}

function listRentals() {
  const now = Date.now();
  const active = [];
  for (const rental of Object.values(db.getCloneRentals())) {
    if (rental.expiresAt <= now) {
      stopSocket(rental.id);
      db.removeCloneRental(rental.id);
    } else {
      active.push(rental);
    }
  }
  return active.sort((a, b) => a.expiresAt - b.expiresAt);
}

async function initializeClones() {
  for (const rental of listRentals()) {
    try {
      await startClone(rental, true);
    } catch (error) {
      console.error(`Clone ${rental.id} failed to start:`, error.message);
    }
  }
}

setInterval(() => {
  for (const rental of listRentals()) {
    if (rental.expiresAt <= Date.now()) stopSocket(rental.id);
  }
}, 30_000).unref();

module.exports = {
  setHandlers,
  normalizeNumber,
  parseDuration,
  createRental,
  stopClone,
  listRentals,
  initializeClones,
};