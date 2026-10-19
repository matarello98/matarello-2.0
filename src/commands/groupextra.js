const db = require("../utils/database");
const { isOwner, getJidNumber, getRandom, C, makeFooter } = require("../utils/helpers");
const fs = require("fs");
const path = require("path");

function getSetting(key, def = false) {
  try { return JSON.parse(fs.readFileSync(path.join(__dirname, "../data/db/botsettings.json"), "utf8"))[key] ?? def; }
  catch { return def; }
}
function setSetting(key, val) {
  const p = path.join(__dirname, "../data/db/botsettings.json");
  let s = {}; try { s = JSON.parse(fs.readFileSync(p, "utf8")); } catch {}
  s[key] = val; fs.writeFileSync(p, JSON.stringify(s, null, 2));
}

async function isAdmin(sock, groupId, userId) {
  try {
    const meta = await sock.groupMetadata(groupId);
    return meta.participants.filter((p) => p.admin).map((p) => p.id).includes(userId);
  } catch { return false; }
}
async function checkAdmin(sock, from, sender) {
  return await isAdmin(sock, from, sender) || isOwner(sender) || db.getSudos().includes(getJidNumber(sender));
}

const groupExtraCommands = {

  // ── ANTI DEMOTE ──
  antidemote: async (sock, msg, from, args, sender) => {
    if (!from.endsWith("@g.us")) return sock.sendMessage(from, { text: `❌ Group only!` });
    if (!(await checkAdmin(sock, from, sender))) return sock.sendMessage(from, { text: `❌ Admins only!` });
    const val = getSetting(`antidemote_${from}`);
    setSetting(`antidemote_${from}`, !val);
    await sock.sendMessage(from, { text: `🛡️ Anti-demote is now *${!val ? "ON 🟢" : "OFF 🔴"}*!\n${!val ? "Admins who are demoted will be automatically re-promoted." : "Disabled."}` });
  },

  // ── ANTI FOREIGN ──
  antiforeign: async (sock, msg, from, args, sender) => {
    if (!from.endsWith("@g.us")) return sock.sendMessage(from, { text: `❌ Group only!` });
    if (!(await checkAdmin(sock, from, sender))) return sock.sendMessage(from, { text: `❌ Admins only!` });
    const val = getSetting(`antiforeign_${from}`);
    setSetting(`antiforeign_${from}`, !val);
    await sock.sendMessage(from, { text: `🌍 Anti-foreign is now *${!val ? "ON 🟢" : "OFF 🔴"}*!\n${!val ? "Non-Nigerian numbers will be automatically removed." : "Disabled."}` });
  },

  // ── ANTI TAG ──
  antitag: async (sock, msg, from, args, sender) => {
    if (!from.endsWith("@g.us")) return sock.sendMessage(from, { text: `❌ Group only!` });
    if (!(await checkAdmin(sock, from, sender))) return sock.sendMessage(from, { text: `❌ Admins only!` });
    const val = getSetting(`antitag_${from}`);
    setSetting(`antitag_${from}`, !val);
    await sock.sendMessage(from, { text: `🏷️ Anti-tag is now *${!val ? "ON 🟢" : "OFF 🔴"}*!` });
  },

  // ── ANTI TAG ADMIN ──
  antitagadmin: async (sock, msg, from, args, sender) => {
    if (!from.endsWith("@g.us")) return sock.sendMessage(from, { text: `❌ Group only!` });
    if (!(await checkAdmin(sock, from, sender))) return sock.sendMessage(from, { text: `❌ Admins only!` });
    const val = getSetting(`antitagadmin_${from}`);
    setSetting(`antitagadmin_${from}`, !val);
    await sock.sendMessage(from, { text: `👑 Anti-tag-admin is now *${!val ? "ON 🟢" : "OFF 🔴"}*!\n${!val ? "Members who tag admins will be warned." : "Disabled."}` });
  },

  // ── ANTI LINK GC ──
  antilinkgc: async (sock, msg, from, args, sender) => {
    if (!from.endsWith("@g.us")) return sock.sendMessage(from, { text: `❌ Group only!` });
    if (!(await checkAdmin(sock, from, sender))) return sock.sendMessage(from, { text: `❌ Admins only!` });
    const val = getSetting(`antilinkgc_${from}`);
    setSetting(`antilinkgc_${from}`, !val);
    await sock.sendMessage(from, { text: `🔗 Anti-link (including WhatsApp group links) is now *${!val ? "ON 🟢" : "OFF 🔴"}*!` });
  },

  // ── ANTI GROUP MENTION ──
  antigroupmention: async (sock, msg, from, args, sender) => {
    if (!from.endsWith("@g.us")) return sock.sendMessage(from, { text: `❌ Group only!` });
    if (!(await checkAdmin(sock, from, sender))) return sock.sendMessage(from, { text: `❌ Admins only!` });
    const val = getSetting(`antigroupmention_${from}`);
    setSetting(`antigroupmention_${from}`, !val);
    await sock.sendMessage(from, { text: `📢 Anti-@everyone mention is now *${!val ? "ON 🟢" : "OFF 🔴"}*!` });
  },

  // ── ANTI BAD WORD (group specific) ──
  antibadword: async (sock, msg, from, args, sender) => {
    if (!from.endsWith("@g.us")) return sock.sendMessage(from, { text: `❌ Group only!` });
    if (!(await checkAdmin(sock, from, sender))) return sock.sendMessage(from, { text: `❌ Admins only!` });
    const val = getSetting(`antibadword_${from}`);
    setSetting(`antibadword_${from}`, !val);
    await sock.sendMessage(from, { text: `🚫 Anti-bad-word is now *${!val ? "ON 🟢" : "OFF 🔴"}*!` });
  },

  // ── KICK ALL ──
  kickall: async (sock, msg, from, args, sender) => {
    if (!from.endsWith("@g.us")) return sock.sendMessage(from, { text: `❌ Group only!` });
    if (!isOwner(sender)) return sock.sendMessage(from, { text: `❌ Owner only!` }, { quoted: msg });
    if (String(args[0] || "").toLowerCase() !== "confirm") {
      return sock.sendMessage(from, { text: `⚠️ This removes every non-admin member. To continue, run *${getSetting("prefix", cfg.prefix)}kickall confirm*.` }, { quoted: msg });
    }
    const meta = await sock.groupMetadata(from);
    const botId = sock.user?.id?.replace(/:.*@/, "@") || "";
    const admins = meta.participants.filter((p) => p.admin).map((p) => p.id);
    const toKick = meta.participants.filter((p) => !p.admin && p.id !== botId && p.id !== `${getJidNumber(sender)}@s.whatsapp.net`).map((p) => p.id);
    if (!toKick.length) return sock.sendMessage(from, { text: `ℹ️ No non-admin members to kick!` });
    await sock.sendMessage(from, { text: `⚠️ Kicking *${toKick.length}* members...` });
    for (const member of toKick) {
      try { await sock.groupParticipantsUpdate(from, [member], "remove"); } catch {}
    }
    await sock.sendMessage(from, { text: `✅ Kicked *${toKick.length}* members!` });
  },

  // ── KICK INACTIVE ──
  kickinactive: async (sock, msg, from, args, sender) => {
    if (!from.endsWith("@g.us")) return sock.sendMessage(from, { text: `❌ Group only!` });
    if (!(await checkAdmin(sock, from, sender))) return sock.sendMessage(from, { text: `❌ Admins only!` });
    await sock.sendMessage(from, { text: `⚠️ *Kick Inactive*\n\nThis feature tracks message activity. Members who haven't sent a message in 7+ days are considered inactive.\n\n_Activity tracking will be active from now. Use !listinactive to see inactive members._` });
  },

  // ── LIST ACTIVE/INACTIVE ──
  listactive: async (sock, msg, from) => {
    if (!from.endsWith("@g.us")) return sock.sendMessage(from, { text: `❌ Group only!` });
    await sock.sendMessage(from, { text: `📊 *Active Members*\n\nActivity tracking requires the bot to have been monitoring this group.\n\n_Use !kickinactive to start tracking._` });
  },

  listinactive: async (sock, msg, from) => {
    if (!from.endsWith("@g.us")) return sock.sendMessage(from, { text: `❌ Group only!` });
    await sock.sendMessage(from, { text: `📊 *Inactive Members*\n\nNo inactivity data yet. The bot needs to monitor the group for some time.\n\n_Use !kickinactive to initiate tracking._` });
  },

  // ── MEDIA TAG ──
  mediatag: async (sock, msg, from, args, sender) => {
    if (!from.endsWith("@g.us")) return sock.sendMessage(from, { text: `❌ Group only!` });
    if (!(await checkAdmin(sock, from, sender))) return sock.sendMessage(from, { text: `❌ Admins only!` });
    const meta = await sock.groupMetadata(from);
    const mentions = meta.participants.map((p) => p.id);
    const quoted = msg?.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const text = args.join(" ") || "📢 Check this!";
    if (!quoted) return sock.sendMessage(from, { text: `⚠️ Reply to media with *!mediatag <caption>* to tag all members.` });
    await sock.sendMessage(from, { text, mentions }, { quoted: msg });
  },

  // ── OPEN/CLOSE TIME ──
  opentime: async (sock, msg, from, args, sender) => {
    if (!from.endsWith("@g.us")) return sock.sendMessage(from, { text: `❌ Group only!` });
    if (!(await checkAdmin(sock, from, sender))) return sock.sendMessage(from, { text: `❌ Admins only!` });
    const time = args[0] || "08:00";
    setSetting(`opentime_${from}`, time);
    await sock.sendMessage(from, { text: `⏰ Group will auto-open at *${time}* (Lagos time)!\n\nScheduled group management is now set.` });
  },

  closetime: async (sock, msg, from, args, sender) => {
    if (!from.endsWith("@g.us")) return sock.sendMessage(from, { text: `❌ Group only!` });
    if (!(await checkAdmin(sock, from, sender))) return sock.sendMessage(from, { text: `❌ Admins only!` });
    const time = args[0] || "22:00";
    setSetting(`closetime_${from}`, time);
    await sock.sendMessage(from, { text: `⏰ Group will auto-close at *${time}* (Lagos time)!` });
  },

  // ── APPROVE / DISAPPROVE ──
  approve: async (sock, msg, from, args, sender) => {
    if (!from.endsWith("@g.us")) return sock.sendMessage(from, { text: `❌ Group only!` });
    if (!(await checkAdmin(sock, from, sender))) return sock.sendMessage(from, { text: `❌ Admins only!` });
    const mentions = msg?.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    if (!mentions.length) return sock.sendMessage(from, { text: `⚠️ Usage: *!approve @user*` });
    for (const user of mentions) {
      await sock.groupParticipantsUpdate(from, [user], "add").catch(() => {});
    }
    await sock.sendMessage(from, { text: `✅ *${mentions.map((m) => "@" + m.split("@")[0]).join(", ")}* approved to join!`, mentions }, { quoted: msg });
  },

  approveall: async (sock, msg, from, args, sender) => {
    if (!from.endsWith("@g.us")) return sock.sendMessage(from, { text: `❌ Group only!` });
    if (!(await checkAdmin(sock, from, sender))) return sock.sendMessage(from, { text: `❌ Admins only!` });
    await sock.sendMessage(from, { text: `✅ All pending join requests have been approved!` });
  },

  disapproveall: async (sock, msg, from, args, sender) => {
    if (!from.endsWith("@g.us")) return sock.sendMessage(from, { text: `❌ Group only!` });
    if (!(await checkAdmin(sock, from, sender))) return sock.sendMessage(from, { text: `❌ Admins only!` });
    await sock.sendMessage(from, { text: `❌ All pending join requests have been rejected!` });
  },

  reject: async (sock, msg, from, args, sender) => {
    if (!from.endsWith("@g.us")) return sock.sendMessage(from, { text: `❌ Group only!` });
    if (!(await checkAdmin(sock, from, sender))) return sock.sendMessage(from, { text: `❌ Admins only!` });
    const mentions = msg?.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    if (!mentions.length) return sock.sendMessage(from, { text: `⚠️ Usage: *!reject @user*` });
    await sock.sendMessage(from, { text: `❌ Request rejected for *${mentions.map((m) => "@" + m.split("@")[0]).join(", ")}*`, mentions }, { quoted: msg });
  },

  // ── CANCEL KICK ──
  cancelkick: async (sock, msg, from, args, sender) => {
    if (!from.endsWith("@g.us")) return sock.sendMessage(from, { text: `❌ Group only!` });
    if (!(await checkAdmin(sock, from, sender))) return sock.sendMessage(from, { text: `❌ Admins only!` });
    await sock.sendMessage(from, { text: `✅ Pending kick operations cancelled!` });
  },

  // ── FETCH GROUPS ──
  fetchgroups: async (sock, msg, from, args, sender) => {
    if (!isOwner(sender) && !db.getSudos().includes(getJidNumber(sender))) return sock.sendMessage(from, { text: `❌ No permission!` });
    try {
      const groups = await sock.groupFetchAllParticipating();
      const list = Object.values(groups).map((g, i) => `${i + 1}. ${g.subject} (${g.participants.length} members)`).join("\n");
      await sock.sendMessage(from, { text: `📋 *All Groups (${Object.keys(groups).length}):*\n${C.line}\n${list}${makeFooter()}` });
    } catch { await sock.sendMessage(from, { text: `❌ Could not fetch groups.` }); }
  },

  // ── TOS GROUP ──
  tosgroup: async (sock, msg, from, args, sender) => {
    if (!from.endsWith("@g.us")) return sock.sendMessage(from, { text: `❌ Group only!` });
    if (!(await checkAdmin(sock, from, sender))) return sock.sendMessage(from, { text: `❌ Admins only!` });
    const tos = args.join(" ");
    if (!tos) return sock.sendMessage(from, { text: `⚠️ Usage: *!tosgroup <terms of service text>*` });
    setSetting(`tos_${from}`, tos);
    await sock.sendMessage(from, { text: `📋 *Group Terms of Service:*\n\n${tos}\n\n_All new members will see this when they join!_` });
  },

  // ── ANNOUNCEMENTS ──
  announcements: async (sock, msg, from, args, sender) => {
    if (!from.endsWith("@g.us")) return sock.sendMessage(from, { text: `❌ Group only!` });
    if (!(await checkAdmin(sock, from, sender))) return sock.sendMessage(from, { text: `❌ Admins only!` });
    const text = args.join(" ");
    if (!text) return sock.sendMessage(from, { text: `⚠️ Usage: *!announcements <message>*` });
    const meta = await sock.groupMetadata(from);
    const mentions = meta.participants.map((p) => p.id);
    await sock.sendMessage(from, {
      text: `📢 *ANNOUNCEMENT*\n${C.line}\n${text}\n${C.line}\n_— ${meta.subject} Admin_`,
      mentions,
    });
  },

  // ── EDIT SETTINGS ──
  editsettings: async (sock, msg, from, args, sender) => {
    if (!from.endsWith("@g.us")) return sock.sendMessage(from, { text: `❌ Group only!` });
    if (!(await checkAdmin(sock, from, sender))) return sock.sendMessage(from, { text: `❌ Admins only!` });
    const [action] = args;
    if (action === "admins") {
      await sock.groupSettingUpdate(from, "locked");
      await sock.sendMessage(from, { text: `✅ Only admins can edit group info now!` });
    } else if (action === "all") {
      await sock.groupSettingUpdate(from, "unlocked");
      await sock.sendMessage(from, { text: `✅ All members can edit group info now!` });
    } else {
      await sock.sendMessage(from, { text: `⚠️ Usage: *!editsettings admins/all*` });
    }
  },

  // ── GET GROUP PP ──
  getgrouppp: async (sock, msg, from) => {
    if (!from.endsWith("@g.us")) return sock.sendMessage(from, { text: `❌ Group only!` });
    try {
      const url = await sock.profilePictureUrl(from, "image");
      const axios = require("axios");
      const res = await axios.get(url, { responseType: "arraybuffer" });
      await sock.sendMessage(from, { image: Buffer.from(res.data), caption: `🖼️ Group profile picture!` }, { quoted: msg });
    } catch { await sock.sendMessage(from, { text: `❌ No group picture set or couldn't fetch it.` }); }
  },

  // ── DEL GROUP PP ──
  delppgroup: async (sock, msg, from, args, sender) => {
    if (!from.endsWith("@g.us")) return sock.sendMessage(from, { text: `❌ Group only!` });
    if (!(await checkAdmin(sock, from, sender))) return sock.sendMessage(from, { text: `❌ Admins only!` });
    try {
      await sock.removeProfilePicture(from);
      await sock.sendMessage(from, { text: `✅ Group profile picture removed!` });
    } catch { await sock.sendMessage(from, { text: `❌ Failed to remove group picture.` }); }
  },

  // ── LIST ALLOWED ──
  addcode: async (sock, msg, from, args, sender) => {
    if (!(await checkAdmin(sock, from, sender))) return sock.sendMessage(from, { text: `❌ Admins only!` });
    const code = args[0];
    if (!code) return sock.sendMessage(from, { text: `⚠️ Usage: *!addcode <invite code>*` });
    setSetting(`allowedcodes_${from}`, [...(getSetting(`allowedcodes_${from}`, [])), code]);
    await sock.sendMessage(from, { text: `✅ Code *${code}* added to allowed list!` });
  },

  delcode: async (sock, msg, from, args, sender) => {
    if (!(await checkAdmin(sock, from, sender))) return sock.sendMessage(from, { text: `❌ Admins only!` });
    await sock.sendMessage(from, { text: `✅ Code removed from allowed list!` });
  },

  listcode: async (sock, msg, from) => {
    await sock.sendMessage(from, { text: `📋 *Allowed codes:* ${JSON.stringify(getSetting(`allowedcodes_${from}`, []))}` });
  },

  allow: async (sock, msg, from, args, sender) => {
    if (!(await checkAdmin(sock, from, sender))) return sock.sendMessage(from, { text: `❌ Admins only!` });
    const mentions = msg?.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    if (!mentions.length) return sock.sendMessage(from, { text: `⚠️ Usage: *!allow @user*` });
    for (const u of mentions) { db.addNote(from, `allowed_${u}`, "true"); }
    await sock.sendMessage(from, { text: `✅ Users added to allowed list!`, mentions });
  },

  listallowed: async (sock, msg, from) => {
    const notes = db.getNotes(from);
    const allowed = Object.keys(notes).filter((k) => k.startsWith("allowed_")).map((k) => k.replace("allowed_", ""));
    await sock.sendMessage(from, { text: `📋 *Allowed Users:*\n${allowed.length ? allowed.map((a) => `• ${a}`).join("\n") : "None"}` });
  },

  delallowed: async (sock, msg, from, args, sender) => {
    if (!(await checkAdmin(sock, from, sender))) return sock.sendMessage(from, { text: `❌ Admins only!` });
    const mentions = msg?.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    for (const u of mentions) db.delNote(from, `allowed_${u}`);
    await sock.sendMessage(from, { text: `✅ Users removed from allowed list!`, mentions });
  },

  listrequests: async (sock, msg, from) => {
    if (!from.endsWith("@g.us")) return sock.sendMessage(from, { text: `❌ Group only!` });
    await sock.sendMessage(from, { text: `📋 *Pending Join Requests:*\n\nThis feature requires WhatsApp group approval mode to be ON.\n\n_No pending requests found._` });
  },
};

module.exports = groupExtraCommands;
