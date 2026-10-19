const normalizeNumber = (number) => String(number || "").replace(/[^0-9]/g, "");
const configuredOwners = String(
  process.env.OWNER_NUMBERS || process.env.OWNER_NUMBER || process.env.BOT_NUMBER || "",
);
const ownerNumbers = configuredOwners
  .split(",")
  .map(normalizeNumber)
  .filter(Boolean);
const botNumber = normalizeNumber(process.env.BOT_NUMBER || ownerNumbers[0] || "");

module.exports = {
  botName: "Matarello 2.0",
  prefix: ".",
  ownerNumber: ownerNumbers[0] || botNumber,
  ownerNumbers,
  botNumber,
  ownerName: process.env.OWNER_NAME || "Bot owner",
  creatorName: process.env.OWNER_NAME || "Bot owner",
  version: "2.0.0",
  cooldown: 0,
  maxWarn: 3,
  authDir: "./auth",
  dataDir: "./src/data/db",
  workWithSelf: false,
  selfMode: false,
  allowClonePairing: process.env.ALLOW_CLONE_PAIRING === "true",
};
