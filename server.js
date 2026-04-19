/**
 * server.js — Lens & Frame Portfolio Backend v2
 * Node.js + Express | JSON Database | Session Auth | Multer Upload
 */

const express = require('express');
const session = require('express-session');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const crypto  = require('crypto');
const ffmpeg  = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
ffmpeg.setFfmpegPath(ffmpegPath);

const app  = express();
const PORT = process.env.PORT || 3000;

/* ─────────────────────────────────────────────
   PATHS
───────────────────────────────────────────── */
const PUBLIC_DIR    = path.join(__dirname, 'public');
const UPLOADS_DIR   = path.join(PUBLIC_DIR, 'uploads');
const THUMBS_DIR    = path.join(UPLOADS_DIR, 'thumbs');
const HLS_DIR       = path.join(UPLOADS_DIR, 'hls');
const DATA_FILE     = path.join(__dirname, 'data', 'videos.json');

[UPLOADS_DIR, THUMBS_DIR, HLS_DIR].forEach(d => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

/* ─────────────────────────────────────────────
   ADMIN CREDENTIALS
   Change before deploying!
───────────────────────────────────────────── */
const ADMIN_USER = process.env.ADMIN_USERNAME || 'Ayush';
const ADMIN_PASS = process.env.ADMIN_PASSWORD || 'Babusona89025';

/* ─────────────────────────────────────────────
   MIDDLEWARE
───────────────────────────────────────────── */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(PUBLIC_DIR));

app.use(session({
  secret:            process.env.SESSION_SECRET || 'lens-frame-secret-key-2024',
  resave:            false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure:   false,          // true in production with HTTPS
    maxAge:   1000 * 60 * 60 * 24  // 24 hours
  }
}));

/* ─────────────────────────────────────────────
   MULTER — Video + Thumbnail storage
───────────────────────────────────────────── */
const makeStorage = (destDir) => multer.diskStorage({
  destination: (_, __, cb) => cb(null, destDir),
  filename:    (_, file, cb) => {
    const uid = crypto.randomBytes(10).toString('hex');
    cb(null, uid + path.extname(file.originalname).toLowerCase());
  }
});

const videoUpload = multer({
  storage:  makeStorage(UPLOADS_DIR),
  limits:   { fileSize: 500 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    const ok = ['.mp4','.mov','.avi','.mkv','.webm'];
    cb(ok.includes(path.extname(file.originalname).toLowerCase()) ? null : new Error('Video files only'), true);
  }
});

const thumbUpload = multer({
  storage: makeStorage(THUMBS_DIR),
  limits:  { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    const ok = ['.jpg','.jpeg','.png','.webp','.gif'];
    cb(ok.includes(path.extname(file.originalname).toLowerCase()) ? null : new Error('Image files only'), true);
  }
});

// Combined upload: thumbnail (image) + videoFile (video)
const combinedUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, file.fieldname === 'thumbnail' ? THUMBS_DIR : UPLOADS_DIR);
    },
    filename: (_, file, cb) => {
      const uid = crypto.randomBytes(10).toString('hex');
      cb(null, uid + path.extname(file.originalname).toLowerCase());
    }
  }),
  limits: { fileSize: 500 * 1024 * 1024 }
}).fields([
  { name: 'thumbnail', maxCount: 1 },
  { name: 'videoFile', maxCount: 1 }
]);

/* ─────────────────────────────────────────────
   DATABASE HELPERS
───────────────────────────────────────────── */
function readDB() {
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); }
  catch { return { videos: [] }; }
}
function writeDB(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}
function uid() { return crypto.randomBytes(10).toString('hex'); }

async function processToHls(videoObj) {
  return new Promise((resolve) => {
    if (!videoObj.videoFile) return resolve(false);
    
    // We do multi-resolution HLS for local MP4 files
    const inputPath = path.join(UPLOADS_DIR, videoObj.videoFile);
    if (!fs.existsSync(inputPath)) return resolve(false);

    const outDir = path.join(HLS_DIR, videoObj._id);
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    ['v0', 'v1', 'v2'].forEach(d => {
      const dPath = path.join(outDir, d);
      if(!fs.existsSync(dPath)) fs.mkdirSync(dPath);
    });

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
      .on('error', (err) => resolve(false))
      .run();
  });
}

/* ─────────────────────────────────────────────
   AUTH GUARD
───────────────────────────────────────────── */
function requireAuth(req, res, next) {
  if (req.session?.isAdmin) return next();
  res.status(401).json({ success: false, message: 'Unauthorized' });
}

/* ─────────────────────────────────────────────
   API ROUTES
───────────────────────────────────────────── */

/* Login */
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    req.session.isAdmin   = true;
    req.session.username  = username;
    return res.json({ success: true });
  }
  res.status(401).json({ success: false, message: 'Invalid username or password.' });
});

/* Logout */
app.post('/api/logout', (req, res) => {
  req.session.destroy(() => res.json({ success: true }));
});

/* Check auth */
app.get('/api/check-auth', (req, res) => {
  res.json({ authenticated: !!req.session?.isAdmin });
});

/* Get all videos (public) */
app.get('/api/videos', (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');

  const db = readDB();
  const sorted = [...db.videos].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ videos: sorted });
});

/* Add video (admin) */
app.post('/api/videos', requireAuth, (req, res) => {
  combinedUpload(req, res, (err) => {
    if (err) return res.status(400).json({ success: false, message: err.message });

    const { title, description, videoUrl } = req.body;
    if (!title?.trim() || !description?.trim()) {
      return res.status(400).json({ success: false, message: 'Title and description are required.' });
    }

    const thumbFile = req.files?.thumbnail?.[0];
    const videoFile = req.files?.videoFile?.[0];

    if (!videoUrl?.trim() && !videoFile) {
      return res.status(400).json({ success: false, message: 'Please provide a video URL or upload a video file.' });
    }

    const db  = readDB();
    const vid = {
      _id:         uid(),
      title:       title.trim(),
      description: description.trim(),
      videoUrl:    videoUrl?.trim() || '',
      videoFile:   videoFile?.filename || '',
      thumbnail:   thumbFile?.filename || '',
      createdAt:   new Date().toISOString()
    };

    db.videos.push(vid);
    writeDB(db);
    res.json({ success: true, video: vid });

    // Trigger async HLS conversion in the background without making the user wait
    if (vid.videoFile) {
        processToHls(vid).then(updated => {
            if (updated) {
               const currentDb = readDB();
               const index = currentDb.videos.findIndex(v => v._id === vid._id);
               if (index !== -1) {
                   currentDb.videos[index].hlsVideo = vid.hlsVideo;
                   writeDB(currentDb);
                   console.log(`Video ${vid._id} HLS Smart conversion complete.`);
               }
            }
        });
    }
  });
});

/* Delete video (admin) */
app.delete('/api/videos/:id', requireAuth, (req, res) => {
  const db  = readDB();
  const idx = db.videos.findIndex(v => v._id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Video not found.' });

  const [removed] = db.videos.splice(idx, 1);

  // Clean up uploaded files
  if (removed.videoFile) {
    const fp = path.join(UPLOADS_DIR, removed.videoFile);
    if (fs.existsSync(fp)) fs.unlinkSync(fp);
  }
  if (removed.thumbnail) {
    const tp = path.join(THUMBS_DIR, removed.thumbnail);
    if (fs.existsSync(tp)) fs.unlinkSync(tp);
  }

  writeDB(db);
  res.json({ success: true });
});

/* Contact form */
app.post('/api/contact', (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ success: false, message: 'All fields are required.' });
  }
  // TODO: Add nodemailer or email service here
  console.log(`\n[Contact Form]\nName: ${name}\nEmail: ${email}\nMessage: ${message}\n`);
  res.json({ success: true });
});

/* ─────────────────────────────────────────────
   HTML FILE ROUTING
───────────────────────────────────────────── */
app.get('/',          (_, res) => res.sendFile(path.join(PUBLIC_DIR, 'index.html')));
app.get('/login',     (_, res) => res.sendFile(path.join(PUBLIC_DIR, 'login.html')));
app.get('/dashboard', (_, res) => res.sendFile(path.join(PUBLIC_DIR, 'dashboard.html')));

app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) return res.status(404).json({ error: 'Not found' });
  const file = path.join(PUBLIC_DIR, req.path.endsWith('.html') ? req.path : req.path + '.html');
  if (fs.existsSync(file)) return res.sendFile(file);
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

/* ─────────────────────────────────────────────
   START
───────────────────────────────────────────── */
app.listen(PORT, () => {
  console.log(`\n  Lens & Frame running at http://localhost:${PORT}`);
  console.log(`  Admin login  → http://localhost:${PORT}/login.html`);
  console.log(`  Username: ${ADMIN_USER}`);
  console.log(`  Password: ${ADMIN_PASS}`);
  console.log(`\n  Change credentials in server.js before going live.\n`);
});
