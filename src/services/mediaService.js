const fs = require("fs");
const os = require("os");
const path = require("path");
const { promisify } = require("util");
const { execFile } = require("child_process");

const execFileAsync = promisify(execFile);
const MAX_MEDIA_BYTES = 50 * 1024 * 1024;

function cleanQuery(value) {
  return String(value || "").trim().replace(/\s+/g, " ").slice(0, 180);
}

function isYouTubeUrl(value) {
  try {
    const url = new URL(value);
    return ["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be", "www.youtu.be"].includes(url.hostname.toLowerCase());
  } catch {
    return false;
  }
}

function mediaMime(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if ([".mp3", ".m4a", ".ogg", ".wav", ".opus"].includes(ext)) return "audio/mpeg";
  if ([".mp4", ".mkv", ".webm", ".mov"].includes(ext)) return "video/mp4";
  return "application/octet-stream";
}

async function downloadWithYtDlp(input, mode = "video") {
  const source = mode === "audio" ? `ytsearch1:${cleanQuery(input)}` : input;
  if (!source || (mode === "video" && !isYouTubeUrl(source))) {
    throw new Error("Use a valid YouTube URL for .youtube.");
  }

  const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "matarello-media-"));
  const outputTemplate = path.join(tempDir, "%(title).80s-%(id)s.%(ext)s");
  const args = [
    "--no-playlist",
    "--no-warnings",
    "--restrict-filenames",
    "--max-filesize", "50M",
    "-o", outputTemplate,
  ];

  if (mode === "audio") {
    args.push("-x", "--audio-format", "mp3", "--audio-quality", "5");
  } else {
    args.push(
      "-f",
      "bv*[ext=mp4][filesize<50M]+ba[ext=m4a][filesize<50M]/b[ext=mp4][filesize<50M]/b[filesize<50M]",
      "--merge-output-format", "mp4",
    );
  }
  args.push(source);

  try {
    await execFileAsync("yt-dlp", args, { timeout: 120_000, maxBuffer: 2 * 1024 * 1024 });
    const files = (await fs.promises.readdir(tempDir))
      .filter((file) => !file.endsWith(".part") && !file.endsWith(".ytdl"))
      .map((file) => path.join(tempDir, file));
    if (!files.length) throw new Error("The extractor did not produce a media file.");
    const filePath = files[0];
    const stat = await fs.promises.stat(filePath);
    if (stat.size > MAX_MEDIA_BYTES) throw new Error("The resulting file is larger than the 50 MB WhatsApp limit.");
    return {
      buffer: await fs.promises.readFile(filePath),
      fileName: path.basename(filePath),
      mime: mediaMime(filePath),
      mode,
    };
  } finally {
    await fs.promises.rm(tempDir, { recursive: true, force: true }).catch(() => {});
  }
}

module.exports = { cleanQuery, isYouTubeUrl, downloadWithYtDlp, MAX_MEDIA_BYTES };