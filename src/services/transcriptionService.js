const MAX_TRANSCRIPTION_BYTES = 10 * 1024 * 1024;

async function requestTranscription(form, apiKey) {
  const headers = apiKey ? { "xi-api-key": apiKey } : {};
  const url = apiKey
    ? "https://api.elevenlabs.io/v1/speech-to-text"
    : null;

  if (url) {
    return fetch(url, { method: "POST", headers, body: form });
  }

  if (process.env.REPLIT_CONNECTORS_HOSTNAME) {
    const { ReplitConnectors } = await import("@replit/connectors-sdk");
    const connectors = new ReplitConnectors();
    return connectors.proxy("elevenlabs", "/v1/speech-to-text", {
      method: "POST",
      body: form,
    });
  }
  throw new Error("Voice transcription needs ELEVENLABS_API_KEY in the host's secret manager.");
}

async function transcribeAudioBuffer(buffer, mimeType = "audio/ogg") {
  if (!buffer?.length) throw new Error("The voice note did not contain audio data.");
  if (buffer.length > MAX_TRANSCRIPTION_BYTES) {
    throw new Error("The audio file is too large to transcribe.");
  }

  const form = new FormData();
  const safeMimeType = String(mimeType || "audio/ogg").split(";")[0];
  const extension = safeMimeType.includes("mpeg") ? "mp3"
    : safeMimeType.includes("wav") ? "wav"
      : safeMimeType.includes("mp4") ? "m4a" : "ogg";
  form.append("file", new Blob([buffer], { type: safeMimeType }), `audio.${extension}`);
  form.append("model_id", "scribe_v1");

  // Replit uses its managed connector. External hosts can provide the
  // provider key through their secret manager without putting it in source.
  const response = await requestTranscription(form, process.env.ELEVENLABS_API_KEY);
  const raw = await response.text();
  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    payload = {};
  }

  if (!response.ok) {
    const detail = payload.detail?.message || payload.detail || `Speech-to-text failed (${response.status}).`;
    throw new Error(
      response.status === 401 && !process.env.ELEVENLABS_API_KEY
        ? `${detail} Check the ElevenLabs connection or ELEVENLABS_API_KEY.`
        : detail,
    );
  }

  const text = String(payload.text || "").trim();
  return text || null;
}

async function transcribeVoiceNote(msg) {
  const audioMessage = msg?.message?.audioMessage;
  if (!audioMessage) return null;
  const { downloadMediaMessage } = require("@whiskeysockets/baileys");
  const buffer = await downloadMediaMessage(msg, "buffer", {});
  return transcribeAudioBuffer(buffer, audioMessage.mimetype || "audio/ogg");
}

module.exports = { transcribeVoiceNote, transcribeAudioBuffer, MAX_TRANSCRIPTION_BYTES };