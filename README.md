# Lens & Frame — Premium Video Portfolio v2

## Folder Structure

```
lens-and-frame/
├── public/
│   ├── index.html          — Portfolio homepage
│   ├── login.html          — Admin login
│   ├── dashboard.html      — Admin dashboard
│   ├── css/
│   │   ├── style.css       — Main styles (all animations, rounded UI)
│   │   └── admin.css       — Admin panel styles
│   ├── js/
│   │   ├── stars.js        — Animated starfield
│   │   ├── main.js         — Homepage + video cards + hover preview
│   │   └── dashboard.js    — Admin CRUD + file upload
│   └── uploads/
│       └── thumbs/         — Thumbnail images (auto-created)
├── data/
│   └── videos.json         — JSON database
├── server.js               — Node.js + Express backend
├── package.json
└── README.md
```

## Setup (3 Steps)

### 1. Install Node.js
Download from https://nodejs.org (LTS version)

### 2. Open terminal in project folder, run:
```
npm install
npm start
```

### 3. Open browser:
```
http://localhost:3000
```

## Admin Panel
- URL: http://localhost:3000/login.html
- Username: `admin`
- Password: `changeme123`

## Change Credentials
Open `server.js`, find these lines and edit:
```js
const ADMIN_USER = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASSWORD || 'changeme123';
```

## Adding Videos
1. Go to admin panel → Add Video
2. Enter title and description
3. Upload a thumbnail image (required — browse button)
4. Either paste YouTube/Vimeo URL OR upload a video file
5. Click Publish — video appears on homepage instantly

## Video Hover Preview
When a visitor hovers over a YouTube/Vimeo video card for 600ms,
a muted autoplay preview starts automatically. Moving the mouse away
stops the preview and restores the thumbnail.

## Supported Video Types
- YouTube (https://youtube.com/watch?v=...)
- Vimeo (https://vimeo.com/123456789)
- Direct video file upload (MP4, MOV, AVI, MKV, WebM — up to 500MB)
