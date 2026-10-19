const { spawn } = require("child_process");

let cachedVoiceId = process.env.ELEVENLABS_VOICE_ID || "";

async function providerRequest(path, options = {}) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (apiKey) {
    return fetch(`https://api.elevenlabs.io${path}`, {
      ...options,
      headers: { ...(options.headers || {}), "xi-api-key": apiKey },
      signal: AbortSignal.timeout(45_000),
    });
  }

  if (process.env.REPLIT_CONNECTORS_HOSTNAME) {
    const { ReplitConnectors } = await import("@replit/connectors-sdk");
    return new ReplitConnectors().proxy("elevenlabs", path, {
      ...options,
      signal: AbortSignal.timeout(45_000),
    });
  }
  throw new Error("Voice generation needs ELEVENLABS_API_KEY in the host's secret manager.");
}

async function getVoiceId() {
  if (cachedVoiceId) return cachedVoiceId;
  const response = await providerRequest("/v1/voices");
  if (!response.ok) throw new Error(`ElevenLabs voice lookup failed (${response.status}).`);
  const payload = await response.json();
  cachedVoiceId = payload.voices?.[0]?.voice_id || "";
  if (!cachedVoiceId) throw new Error("No usable voice is available. Set ELEVENLABS_VOICE_ID in the host secrets.");
  return cachedVoiceId;
}

function convertMp3ToVoiceNote(mp3) {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn("ffmpeg", [
      "-hide_banner", "-loglevel", "error", "-f", "mp3", "-i", "pipe:0",
      "-vn", "-c:a", "libopus", "-b:a", "32k", "-vbr", "on",
      "-application", "voip", "-f", "ogg", "pipe:1",
    ], { stdio: ["pipe", "pipe", "pipe"] });
    const chunks = [];
    let stderr = "";
    let finished = false;
    const timer = setTimeout(() => ffmpeg.kill("SIGKILL"), 30_000);
    ffmpeg.stdout.on("data", (chunk) => chunks.push(chunk));
    ffmpeg.stderr.on("data", (chunk) => { stderr += chunk.toString(); });
    ffmpeg.on("error", (error) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      reject(new Error(error.code === "ENOENT" ? "FFmpeg is required to encode WhatsApp voice notes." : error.message));
    });
    ffmpeg.on("close", (code) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      if (code !== 0) return reject(new Error(stderr.trim() || `FFmpeg exited with code ${code}.`));
      resolve(Buffer.concat(chunks));
    });
    ffmpeg.stdin.end(mp3);
  });
}

async function generateVoiceNote(text) {
  const content = String(text || "").trim().slice(0, 1200);
  if (!content) throw new Error("Enter the text to speak.");
  const voiceId = await getVoiceId();
  const response = await providerRequest(`/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: content,
      model_id: "eleven_multilingual_v2",
      voice_settings: { stability: 0.5, similarity_boost: 0.75 },
    }),
  });
  if (!response.ok) {
    const detail = (await response.text()).slice(0, 400);
    throw new Error(`ElevenLabs voice generation failed (${response.status})${detail ? `: ${detail}` : ""}`);
  }
  return convertMp3ToVoiceNote(Buffer.from(await response.arrayBuffer()));
}

module.exports = { generateVoiceNote };
