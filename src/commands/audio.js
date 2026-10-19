const { downloadMediaMessage } = require("@whiskeysockets/baileys");
const { FILTERS, processAudio, convertVideoToGif } = require("../services/audioService");
const { transcribeAudioBuffer } = require("../services/transcriptionService");

function formatForMime(mimeType = "") {
  if (mimeType.includes("mpeg")) return "mp3";
  if (mimeType.includes("mp4")) return "mp4";
  if (mimeType.includes("wav")) return "wav";
  return "ogg";
}

function getQuotedAudio(msg) {
  const quoted = msg?.message?.extendedTextMessage?.contextInfo?.quotedMessage;
  if (!quoted) return null;
  if (quoted.audioMessage) return { type: "audioMessage", media: quoted.audioMessage, format: formatForMime(quoted.audioMessage.mimetype || "") };
  if (quoted.videoMessage) return { type: "videoMessage", media: quoted.videoMessage, format: "mp4" };
  return null;
}

async function getAudio(sock, msg) {
  const direct = msg?.message?.audioMessage;
  const media = direct
    ? { type: "audioMessage", media: direct, format: formatForMime(direct.mimetype || ""), message: msg.message }
    : getQuotedAudio(msg);
  if (!media) return null;
  const buffer = await downloadMediaMessage(
    { message: media.message || { [media.type]: media.media }, key: msg.key },
    "buffer",
    {},
  );
  if (buffer.length > 25 * 1024 * 1024) throw new Error("The audio file is larger than the 25 MB processing limit.");
  return { ...media, buffer };
}

async function replyNeedAudio(sock, msg, from) {
  await sock.sendMessage(from, { text: "⚠️ Reply to a voice note or audio clip with this command." }, { quoted: msg });
}

async function transform(sock, msg, from, command, filter) {
  try {
    const input = await getAudio(sock, msg);
    if (!input) return replyNeedAudio(sock, msg, from);
    const audio = await processAudio(input.buffer, filter, { inputFormat: input.format });
    await sock.sendMessage(from, { audio, mimetype: "audio/ogg; codecs=opus", ptt: true }, { quoted: msg });
  } catch (error) {
    await sock.sendMessage(from, { text: `❌ Audio processing failed: ${error.message}` }, { quoted: msg });
  }
}

const audioCommands = Object.fromEntries(
  Object.entries(FILTERS).map(([command, filter]) => [
    command,
    (sock, msg, from) => transform(sock, msg, from, command, filter),
  ]),
);

audioCommands.toaudio = async (sock, msg, from) => transform(sock, msg, from, "toaudio", "");
audioCommands.speed = audioCommands.fast;
audioCommands.toaudiodoc = async (sock, msg, from) => {
  try {
    const input = await getAudio(sock, msg);
    if (!input) return replyNeedAudio(sock, msg, from);
    const audio = await processAudio(input.buffer, "", { inputFormat: input.format });
    await sock.sendMessage(from, {
      document: audio,
      mimetype: "audio/ogg",
      fileName: "matarello-audio.ogg",
    }, { quoted: msg });
  } catch (error) {
    await sock.sendMessage(from, { text: `❌ Audio conversion failed: ${error.message}` }, { quoted: msg });
  }
};
audioCommands.tovoice = async (sock, msg, from) => audioCommands.toaudio(sock, msg, from);
audioCommands.tts = async (sock, msg, from, args) => {
  const text = args.join(" ").trim();
  if (!text) return sock.sendMessage(from, { text: "⚠️ Usage: *.tts <text to speak>*" }, { quoted: msg });
  try {
    const audio = await require("../services/elevenlabs").generateVoiceNote(text);
    await sock.sendMessage(from, { audio, mimetype: "audio/ogg; codecs=opus", ptt: true }, { quoted: msg });
  } catch (error) {
    await sock.sendMessage(from, { text: `❌ Voice note failed: ${error.message}` }, { quoted: msg });
  }
};
audioCommands.sendvn = audioCommands.tts;
audioCommands.sendvo = audioCommands.tts;
audioCommands.totext = async (sock, msg, from) => {
  try {
    const input = await getAudio(sock, msg);
    if (!input) return replyNeedAudio(sock, msg, from);
    const transcript = await transcribeAudioBuffer(input.buffer, input.media.mimetype || "audio/ogg");
    if (!transcript) return sock.sendMessage(from, { text: "No speech was detected in that audio." }, { quoted: msg });
    await sock.sendMessage(from, { text: `📝 *Transcript:*\n${transcript}` }, { quoted: msg });
  } catch (error) {
    await sock.sendMessage(from, { text: `❌ Transcription failed: ${error.message}` }, { quoted: msg });
  }
};
audioCommands.toimage = async (sock, msg, from) => {
  const mediaCommands = require("./media");
  return mediaCommands.toimg(sock, msg, from);
};
audioCommands.tosticker = async (sock, msg, from) => {
  const mediaCommands = require("./media");
  return mediaCommands.sticker(sock, msg, from);
};
audioCommands.togif = async (sock, msg, from) => {
  try {
    const quoted = msg?.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const video = quoted?.videoMessage || msg?.message?.videoMessage;
    if (!video) {
      return sock.sendMessage(from, { text: "⚠️ Reply to a video or send one with *.togif*." }, { quoted: msg });
    }
    const message = quoted ? { videoMessage: video } : msg.message;
    const buffer = await downloadMediaMessage({ message, key: msg.key }, "buffer", {});
    if (buffer.length > 50 * 1024 * 1024) {
      return sock.sendMessage(from, { text: "❌ The source video is larger than the 50 MB conversion limit." }, { quoted: msg });
    }
    const gif = await convertVideoToGif(buffer);
    if (gif.length > 15 * 1024 * 1024) {
      return sock.sendMessage(from, { text: "❌ The GIF is larger than WhatsApp's 15 MB limit." }, { quoted: msg });
    }
    await sock.sendMessage(from, { video: gif, mimetype: "video/mp4", gifPlayback: true, caption: "🎞️ Converted to GIF" }, { quoted: msg });
  } catch (error) {
    await sock.sendMessage(from, { text: `❌ Conversion failed: ${error.message}` }, { quoted: msg });
  }
};
audioCommands.tovideonote = async (sock, msg, from) => {
  const quoted = msg?.message?.extendedTextMessage?.contextInfo?.quotedMessage;
  if (!quoted?.videoMessage) {
    return sock.sendMessage(from, { text: "⚠️ Reply to a video with *.tovideonote*." }, { quoted: msg });
  }
  try {
    const buffer = await downloadMediaMessage({ message: { videoMessage: quoted.videoMessage }, key: msg.key }, "buffer", {});
    await sock.sendMessage(from, { video: buffer, mimetype: "video/mp4", gifPlayback: false, ptv: true }, { quoted: msg });
  } catch (error) {
    await sock.sendMessage(from, { text: `❌ Could not create video note: ${error.message}` }, { quoted: msg });
  }
};
audioCommands.tovv = audioCommands.totext;
audioCommands.vv = audioCommands.totext;
audioCommands.vvp = audioCommands.totext;

module.exports = audioCommands;
