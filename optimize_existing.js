const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
ffmpeg.setFfmpegPath(ffmpegPath);

const UPLOADS_DIR = path.join(__dirname, 'public', 'uploads');
const HLS_DIR = path.join(UPLOADS_DIR, 'hls');
if (!fs.existsSync(HLS_DIR)) fs.mkdirSync(HLS_DIR);

const DATA_FILE = path.join(__dirname, 'data', 'videos.json');
let db = { videos: [] };
try { db = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); } catch (e) {}

async function processToHls(videoObj) {
  return new Promise((resolve, reject) => {
    if (!videoObj.videoFile) return resolve(false);
    if (videoObj.hlsVideo) return resolve(false);

    const inputPath = path.join(UPLOADS_DIR, videoObj.videoFile);
    if (!fs.existsSync(inputPath)) return resolve(false);

    const outDir = path.join(HLS_DIR, videoObj._id);
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    ['v0', 'v1', 'v2'].forEach(d => {
      const dPath = path.join(outDir, d);
      if (!fs.existsSync(dPath)) fs.mkdirSync(dPath);
    });

    console.log(`Processing ${videoObj.title}...`);

    ffmpeg(inputPath)
      .addOptions([
        '-preset', 'veryfast',
        '-g', '48', '-sc_threshold', '0',
        '-filter_complex', '[0:v]split=3[v1][v2][v3]; [v1]scale=-2:1080[v1out]; [v2]scale=-2:720[v2out]; [v3]scale=-2:480[v3out]',
        '-map', '[v1out]', '-map', '0:a:0?',
        '-map', '[v2out]', '-map', '0:a:0?',
        '-map', '[v3out]', '-map', '0:a:0?',
        '-c:v', 'libx264', '-c:a', 'aac',
        '-b:v:0', '2500k',
        '-b:v:1', '1200k',
        '-b:v:2', '600k',
        '-f', 'hls',
        '-hls_time', '6',
        '-hls_playlist_type', 'vod',
        '-master_pl_name', 'master.m3u8',
        '-var_stream_map', 'v:0,a:0,name:1080p v:1,a:1,name:720p v:2,a:2,name:480p',
        '-hls_segment_filename', path.join(outDir, 'v%v', 'file_%03d.ts')
      ])
      .output(path.join(outDir, 'v%v', 'playlist.m3u8'))
      .on('end', () => {
        videoObj.hlsVideo = `hls/${videoObj._id}/master.m3u8`;
        resolve(true);
      })
      .on('error', (err, stdout, stderr) => {
        console.error('Error processing ID ' + videoObj._id, err);
        console.log("FFMPEG STDERR", stderr);
        resolve(false);
      })
      .run();
  });
}

(async () => {
  console.log("Starting optimization...");
  for (let i = 0; i < db.videos.length; i++) {
    const updated = await processToHls(db.videos[i]);
    if (updated) {
       fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
       console.log(`Finished ${db.videos[i].title}`);
    }
  }
  console.log("Optimization complete!");
})();
