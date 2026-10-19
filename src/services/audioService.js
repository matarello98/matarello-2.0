const { spawn } = require("child_process");

const FILTERS = {
  "8d": "apulsator=hz=0.08",
  baby: "asetrate=48000*1.25,aresample=48000,atempo=0.8",
  bass: "equalizer=f=100:width_type=o:width=1:g=10",
  boost: "volume=1.5",
  deepbass: "equalizer=f=70:width_type=o:width=1:g=14",
  demon: "asetrate=48000*0.72,aresample=48000",
  echo: "aecho=0.8:0.88:60:0.4",
  fast: "atempo=1.35",
  karaoke: "stereotools=mlev=0.03",
  pitchdown: "asetrate=48000*0.8,aresample=48000",
  pitchup: "asetrate=48000*1.25,aresample=48000",
  reverb: "aecho=0.8:0.7:90|150:0.25|0.15",
  reverse: "areverse",
  robot: "tremolo=f=40:d=0.75",
  slow: "atempo=0.8",
  superboost: "volume=2.5",
  underwater: "lowpass=f=500,highpass=f=100",
  vocalboost: "equalizer=f=1500:width_type=o:width=1:g=5",
};

function processAudio(buffer, filter = "", { inputFormat = "ogg", outputFormat = "ogg" } = {}) {
  return new Promise((resolve, reject) => {
    const args = ["-hide_banner", "-loglevel", "error", "-f", inputFormat, "-i", "pipe:0"];
    if (filter) args.push("-af", filter);
    args.push("-vn", "-c:a", "libopus", "-b:a", "48k", "-f", outputFormat, "pipe:1");
    const ffmpeg = spawn("ffmpeg", args, { stdio: ["pipe", "pipe", "pipe"] });
    const chunks = [];
    let stderr = "";
    let finished = false;
    const timer = setTimeout(() => ffmpeg.kill("SIGKILL"), 45_000);
    ffmpeg.stdout.on("data", (chunk) => chunks.push(chunk));
    ffmpeg.stderr.on("data", (chunk) => { stderr += chunk.toString(); });
    ffmpeg.on("error", (error) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      reject(new Error(error.code === "ENOENT" ? "FFmpeg is not installed on this host." : error.message));
    });
    ffmpeg.on("close", (code) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      if (code !== 0) return reject(new Error(stderr.trim() || `FFmpeg exited with code ${code}.`));
      const output = Buffer.concat(chunks);
      if (!output.length) return reject(new Error("FFmpeg produced no audio."));
      resolve(output);
    });
    ffmpeg.stdin.end(buffer);
  });
}

function convertVideoToGif(buffer) {
  return new Promise((resolve, reject) => {
    const args = [
      "-hide_banner", "-loglevel", "error", "-i", "pipe:0",
      "-t", "12", "-an", "-vf", "fps=12,scale=480:-2:flags=lanczos,format=yuv420p",
      "-c:v", "libx264", "-preset", "veryfast", "-movflags", "frag_keyframe+empty_moov",
      "-f", "mp4", "pipe:1",
    ];
    const ffmpeg = spawn("ffmpeg", args, { stdio: ["pipe", "pipe", "pipe"] });
    const chunks = [];
    let stderr = "";
    let finished = false;
    const timer = setTimeout(() => ffmpeg.kill("SIGKILL"), 45_000);
    ffmpeg.stdout.on("data", (chunk) => chunks.push(chunk));
    ffmpeg.stderr.on("data", (chunk) => { stderr += chunk.toString(); });
    ffmpeg.on("error", (error) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      reject(new Error(error.code === "ENOENT" ? "FFmpeg is not installed on this host." : error.message));
    });
    ffmpeg.on("close", (code) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      if (code !== 0) return reject(new Error(stderr.trim() || `FFmpeg exited with code ${code}.`));
      const output = Buffer.concat(chunks);
      if (!output.length) return reject(new Error("FFmpeg produced no GIF."));
      resolve(output);
    });
    ffmpeg.stdin.end(buffer);
  });
}

module.exports = { FILTERS, processAudio, convertVideoToGif };
