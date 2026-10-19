const db = require("../utils/database");
const { makeHeader, makeFooter, C, isOwner, getJidNumber, getRandom } = require("../utils/helpers");

async function isGroupAdmin(sock, groupId, userId) {
  try {
    const meta = await sock.groupMetadata(groupId);
    const admins = meta.participants.filter((p) => p.admin).map((p) => p.id);
    return admins.includes(userId);
  } catch { return false; }
}

async function checkAdmin(sock, msg, from, sender) {
  const isAdmin = await isGroupAdmin(sock, from, sender);
  const isSudo = db.getSudos().includes(getJidNumber(sender));
  return isAdmin || isOwner(sender) || isSudo;
}

const groupCommands = {
  kick: async (sock, msg, from, args, sender) => {
    if (!from.endsWith("@g.us")) return sock.sendMessage(from, { text: `❌ Group only command!` });
    if (!(await checkAdmin(sock, msg, from, sender))) return sock.sendMessage(from, { text: `❌ Admins only!` });
    const mentions = msg?.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    if (!mentions.length) return sock.sendMessage(from, { text: `⚠️ Usage: *!kick @user*` });
    for (const user of mentions) await sock.groupParticipantsUpdate(from, [user], "remove");
    await sock.sendMessage(from, { text: `👢 *${mentions.map((m) => m.split("@")[0]).join(", ")}* kicked!` }, { quoted: msg });
  },

  add: async (sock, msg, from, args, sender) => {
    if (!from.endsWith("@g.us")) return sock.sendMessage(from, { text: `❌ Group only!` });
    if (!(await checkAdmin(sock, msg, from, sender))) return sock.sendMessage(from, { text: `❌ Admins only!` });
    const number = args[0]?.replace(/[^0-9]/g, "");
    if (!number) return sock.sendMessage(from, { text: `⚠️ Usage: *!add <number>*` });
    try {
      await sock.groupParticipantsUpdate(from, [`${number}@s.whatsapp.net`], "add");
      await sock.sendMessage(from, { text: `✅ *+${number}* added!` }, { quoted: msg });
    } catch { await sock.sendMessage(from, { text: `❌ Failed to add *+${number}*.` }); }
  },

  promote: async (sock, msg, from, args, sender) => {
    if (!from.endsWith("@g.us")) return sock.sendMessage(from, { text: `❌ Group only!` });
    if (!(await checkAdmin(sock, msg, from, sender))) return sock.sendMessage(from, { text: `❌ Admins only!` });
    const mentions = msg?.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    if (!mentions.length) return sock.sendMessage(from, { text: `⚠️ Usage: *!promote @user*` });
    await sock.groupParticipantsUpdate(from, mentions, "promote");
    await sock.sendMessage(from, { text: `⭐ *${mentions.map((m) => m.split("@")[0]).join(", ")}* promoted to admin!` }, { quoted: msg });
  },

  demote: async (sock, msg, from, args, sender) => {
    if (!from.endsWith("@g.us")) return sock.sendMessage(from, { text: `❌ Group only!` });
    if (!(await checkAdmin(sock, msg, from, sender))) return sock.sendMessage(from, { text: `❌ Admins only!` });
    const mentions = msg?.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    if (!mentions.length) return sock.sendMessage(from, { text: `⚠️ Usage: *!demote @user*` });
    await sock.groupParticipantsUpdate(from, mentions, "demote");
    await sock.sendMessage(from, { text: `⬇️ *${mentions.map((m) => m.split("@")[0]).join(", ")}* demoted from admin!` }, { quoted: msg });
  },

  grouplink: async (sock, msg, from, args, sender) => {
    if (!from.endsWith("@g.us")) return sock.sendMessage(from, { text: `❌ Group only!` });
    if (!(await checkAdmin(sock, msg, from, sender))) return sock.sendMessage(from, { text: `❌ Admins only!` });
    const code = await sock.groupInviteCode(from);
    await sock.sendMessage(from, { text: `🔗 *Group Invite Link:*\nhttps://chat.whatsapp.com/${code}` }, { quoted: msg });
  },

  resetlink: async (sock, msg, from, args, sender) => {
    if (!from.endsWith("@g.us")) return sock.sendMessage(from, { text: `❌ Group only!` });
    if (!(await checkAdmin(sock, msg, from, sender))) return sock.sendMessage(from, { text: `❌ Admins only!` });
    await sock.groupRevokeInvite(from);
    const newCode = await sock.groupInviteCode(from);
    await sock.sendMessage(from, { text: `🔗 *New Link:* https://chat.whatsapp.com/${newCode}\n_Old link revoked!_` }, { quoted: msg });
  },

  groupinfo: async (sock, msg, from) => {
    if (!from.endsWith("@g.us")) return sock.sendMessage(from, { text: `❌ Group only!` });
    const meta = await sock.groupMetadata(from);
    const admins = meta.participants.filter((p) => p.admin).length;
    await sock.sendMessage(from, {
      text: `${makeHeader("GROUP INFO", "📊")}\n\n📛 *Name:* ${meta.subject}\n👥 *Members:* ${meta.participants.length}\n👑 *Admins:* ${admins}\n📅 *Created:* ${new Date(meta.creation * 1000).toDateString()}\n📝 *Desc:* ${meta.desc || "None"}\n${makeFooter()}`,
    }, { quoted: msg });
  },

  members: async (sock, msg, from) => {
    if (!from.endsWith("@g.us")) return sock.sendMessage(from, { text: `❌ Group only!` });
    const meta = await sock.groupMetadata(from);
    const list = meta.participants.map((p, i) => `${i + 1}. +${p.id.split("@")[0]}${p.admin ? " 👑" : ""}`).join("\n");
    await sock.sendMessage(from, { text: `👥 *Members (${meta.participants.length})*\n${C.line}\n${list}${makeFooter()}` });
  },

  admins: async (sock, msg, from) => {
    if (!from.endsWith("@g.us")) return sock.sendMessage(from, { text: `❌ Group only!` });
    const meta = await sock.groupMetadata(from);
    const admins = meta.participants.filter((p) => p.admin);
    const list = admins.map((a, i) => `${i + 1}. +${a.id.split("@")[0]} (${a.admin})`).join("\n");
    await sock.sendMessage(from, { text: `👑 *Admins (${admins.length})*\n${C.line}\n${list}${makeFooter()}` });
  },

  tagall: async (sock, msg, from, args, sender) => {
    if (!from.endsWith("@g.us")) return sock.sendMessage(from, { text: `❌ Group only!` });
    if (!(await checkAdmin(sock, msg, from, sender))) return sock.sendMessage(from, { text: `❌ Admins only!` });
    const meta = await sock.groupMetadata(from);
    const mentions = meta.participants.map((p) => p.id);
    const text = args.join(" ") || "📢 Attention everyone!";
    const mention_text = mentions.map((m) => `@${m.split("@")[0]}`).join(" ");
    await sock.sendMessage(from, { text: `${text}\n\n${mention_text}`, mentions }, { quoted: msg });
  },

  hidetag: async (sock, msg, from, args, sender) => {
    if (!from.endsWith("@g.us")) return sock.sendMessage(from, { text: `❌ Group only!` });
    if (!(await checkAdmin(sock, msg, from, sender))) return sock.sendMessage(from, { text: `❌ Admins only!` });
    const meta = await sock.groupMetadata(from);
    const mentions = meta.participants.map((p) => p.id);
    const text = args.join(" ") || "📢 Important update!";
    await sock.sendMessage(from, { text, mentions }, { quoted: msg });
  },

  warn: async (sock, msg, from, args, sender) => {
    if (!from.endsWith("@g.us")) return sock.sendMessage(from, { text: `❌ Group only!` });
    if (!(await checkAdmin(sock, msg, from, sender))) return sock.sendMessage(from, { text: `❌ Admins only!` });
    const mentions = msg?.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    if (!mentions.length) return sock.sendMessage(from, { text: `⚠️ Usage: *!warn @user*` });
    const target = mentions[0];
    const warns = db.addWarn(target, from);
    const maxWarn = 3;
    let extra = "";
    if (warns >= maxWarn) {
      await sock.groupParticipantsUpdate(from, [target], "remove");
      db.resetWarns(target, from);
      extra = `\n🚨 *Max warns reached! User has been kicked!*`;
    }
    await sock.sendMessage(from, {
      text: `⚠️ *@${target.split("@")[0]}* has been warned!\n📊 Warns: *${warns}/${maxWarn}*${extra}`,
      mentions: [target],
    }, { quoted: msg });
  },

  unwarn: async (sock, msg, from, args, sender) => {
    if (!from.endsWith("@g.us")) return sock.sendMessage(from, { text: `❌ Group only!` });
    if (!(await checkAdmin(sock, msg, from, sender))) return sock.sendMessage(from, { text: `❌ Admins only!` });
    const mentions = msg?.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    if (!mentions.length) return sock.sendMessage(from, { text: `⚠️ Usage: *!unwarn @user*` });
    const target = mentions[0];
    db.resetWarns(target, from);
    await sock.sendMessage(from, { text: `✅ Warns for *@${target.split("@")[0]}* have been reset!`, mentions: [target] }, { quoted: msg });
  },

  warnlist: async (sock, msg, from) => {
    if (!from.endsWith("@g.us")) return sock.sendMessage(from, { text: `❌ Group only!` });
    const db2 = require("../utils/database");
    const rawDb = require("fs").readFileSync(require("path").join(__dirname, "../data/db/warns.json"), "utf8");
    const warns = JSON.parse(rawDb);
    const groupWarns = Object.entries(warns).filter(([k]) => k.startsWith(from.split("@")[0]));
    if (!groupWarns.length) return sock.sendMessage(from, { text: `ℹ️ No warns in this group.` });
    const list = groupWarns.map(([k, v]) => `• +${k.split("_")[1]}: ${v} warn(s)`).join("\n");
    await sock.sendMessage(from, { text: `⚠️ *Warn List*\n${C.line}\n${list}${makeFooter()}` });
  },

  antilink: async (sock, msg, from, args, sender) => {
    if (!from.endsWith("@g.us")) return sock.sendMessage(from, { text: `❌ Group only!` });
    if (!(await checkAdmin(sock, msg, from, sender))) return sock.sendMessage(from, { text: `❌ Admins only!` });
    const val = args[0]?.toLowerCase() === "on";
    db.setAntilink(from, val);
    await sock.sendMessage(from, { text: `🔗 Anti-link is now *${val ? "ON 🟢" : "OFF 🔴"}*!` });
  },

  setwelcome: async (sock, msg, from, args, sender) => {
    if (!from.endsWith("@g.us")) return sock.sendMessage(from, { text: `❌ Group only!` });
    if (!(await checkAdmin(sock, msg, from, sender))) return sock.sendMessage(from, { text: `❌ Admins only!` });
    const text = args.join(" ");
    if (!text) return sock.sendMessage(from, { text: `⚠️ Usage: *!setwelcome <message>*\nUse {name} for user's name.` });
    db.setWelcome(from, text);
    await sock.sendMessage(from, { text: `✅ Welcome message set!\n\n_Preview:_\n${text.replace("{name}", "NewMember")}` });
  },

  setgoodbye: async (sock, msg, from, args, sender) => {
    if (!from.endsWith("@g.us")) return sock.sendMessage(from, { text: `❌ Group only!` });
    if (!(await checkAdmin(sock, msg, from, sender))) return sock.sendMessage(from, { text: `❌ Admins only!` });
    const text = args.join(" ");
    if (!text) return sock.sendMessage(from, { text: `⚠️ Usage: *!setgoodbye <message>*\nUse {name} for user's name.` });
    db.setGoodbye(from, text);
    await sock.sendMessage(from, { text: `✅ Goodbye message set!` });
  },

  opengroup: async (sock, msg, from, args, sender) => {
    if (!from.endsWith("@g.us")) return sock.sendMessage(from, { text: `❌ Group only!` });
    if (!(await checkAdmin(sock, msg, from, sender))) return sock.sendMessage(from, { text: `❌ Admins only!` });
    await sock.groupSettingUpdate(from, "not_announcement");
    await sock.sendMessage(from, { text: `🔓 Group is now *OPEN* — all members can send messages!` });
  },

  closegroup: async (sock, msg, from, args, sender) => {
    if (!from.endsWith("@g.us")) return sock.sendMessage(from, { text: `❌ Group only!` });
    if (!(await checkAdmin(sock, msg, from, sender))) return sock.sendMessage(from, { text: `❌ Admins only!` });
    await sock.groupSettingUpdate(from, "announcement");
    await sock.sendMessage(from, { text: `🔒 Group is now *CLOSED* — only admins can send messages!` });
  },

  setgdesc: async (sock, msg, from, args, sender) => {
    if (!from.endsWith("@g.us")) return sock.sendMessage(from, { text: `❌ Group only!` });
    if (!(await checkAdmin(sock, msg, from, sender))) return sock.sendMessage(from, { text: `❌ Admins only!` });
    const text = args.join(" ");
    if (!text) return sock.sendMessage(from, { text: `⚠️ Usage: *!setgdesc <description>*` });
    await sock.groupUpdateDescription(from, text);
    await sock.sendMessage(from, { text: `✅ Group description updated!` }, { quoted: msg });
  },

  setgname: async (sock, msg, from, args, sender) => {
    if (!from.endsWith("@g.us")) return sock.sendMessage(from, { text: `❌ Group only!` });
    if (!(await checkAdmin(sock, msg, from, sender))) return sock.sendMessage(from, { text: `❌ Admins only!` });
    const name = args.join(" ");
    if (!name) return sock.sendMessage(from, { text: `⚠️ Usage: *!setgname <name>*` });
    await sock.groupUpdateSubject(from, name);
    await sock.sendMessage(from, { text: `✅ Group name updated to *${name}*!` }, { quoted: msg });
  },

  delete: async (sock, msg, from, args, sender) => {
    if (!(await checkAdmin(sock, msg, from, sender))) return sock.sendMessage(from, { text: `❌ Admins only!` });
    const quoted = msg?.message?.extendedTextMessage?.contextInfo;
    if (!quoted?.stanzaId) return sock.sendMessage(from, { text: `⚠️ Reply to a message to delete it!` });
    const key = { remoteJid: from, fromMe: false, id: quoted.stanzaId, participant: quoted.participant };
    await sock.sendMessage(from, { delete: key });
  },

  purge: async (sock, msg, from, args, sender) => {
    if (!from.endsWith("@g.us")) return sock.sendMessage(from, { text: `❌ Group only!` });
    if (!(await checkAdmin(sock, msg, from, sender))) return sock.sendMessage(from, { text: `❌ Admins only!` });
    await sock.sendMessage(from, { text: `🗑️ Purge command noted — manual deletion required for bulk messages.` });
  },
};

module.exports = groupCommands;
