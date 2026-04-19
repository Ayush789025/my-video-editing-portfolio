<div align="center">
  <img src="public/ayush-logo.png" alt="Logo" width="120" />
  <h1>Lens & Frame Portfolio Platform 🚀</h1>
  <p><strong>A high-performance, custom-built monolithic web application designed to showcase high-fidelity motion graphics and video editing.</strong></p>
  
  [![Node.js](https://img.shields.io/badge/Node.js-18.x-43853D?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
  [![Express](https://img.shields.io/badge/Express.js-Backend-000000?style=flat&logo=express&logoColor=white)](https://expressjs.com/)
  [![FFmpeg](https://img.shields.io/badge/FFmpeg-Encoding-007808?style=flat&logo=ffmpeg&logoColor=white)](https://ffmpeg.org/)
  [![HLS.js](https://img.shields.io/badge/HLS-Adaptive%20Streaming-FF4A5C?style=flat)](https://github.com/video-dev/hls.js/)
  [![Vanilla JS](https://img.shields.io/badge/JavaScript-ES6%2B-F7DF1E?style=flat&logo=javascript&logoColor=black)](https://developer.mozilla.org/)
</div>

<br />

## 📖 Overview

Designed from the ground up without heavy frontend frameworks, this project is a **custom Video Portfolio CMS** built to handle raw, uncompressed 4K videos smoothly directly in the browser. 

Traditional portfolios rely on simple YouTube embeds. This application takes a more sophisticated approach: it features a **fully custom Node.js backend** that ingests heavy MP4 files, utilizes native system **FFmpeg** to transcode them asynchronously, and serves them to the frontend using **Smart Adaptive Bitrate (HLS)** streaming.

This ensures zero buffering, dynamic mobile resolution adjustments, and a truly premium user experience.

---

## ✨ Architectural Highlights (For Reviewers)

### 1. Smart Adaptive Bitrate Streaming (HLS)
When an admin uploads a large uncompressed video via the dashboard, the Node.js backend spawns a background worker (`fluent-ffmpeg`). It concurrently slices the asset into `1080p`, `720p`, and `480p` `.ts` segments and compiles a master `.m3u8` playlist. 
The vanilla JS frontend utilizes `hls.js` to constantly sniff the client's network speed and seamlessly swap stream resolutions on-the-fly.

### 2. Radical RAM & DOM Optimization
Video editors upload massive 4K 4:2:2 ProRes files. To prevent the browser's rendering thread from choking:
- **Instant DOM Unmounting:** Playing a new video aggressively unmounts previous active video nodes and restores lightweight thumbnail elements, freeing massive amounts of RAM.
- **Hardware-Overlay Optimization:** Custom CSS limits complex DOM clipping operations (`overflow: hidden` + `border-radius`) when a video plays, forcing Chromium to use its highly-efficient Hardware Video Overlay path rather than the CPU compositor. 

### 3. GPU Thread Management
The site features a beautiful, math-heavy animated `canvas` starfield background. To ensure 100% of the GPU's processing power is dedicated strictly to video decoding during playback, an event-bus pauses `requestAnimationFrame` hooks instantly when any video plays, guaranteeing 60FPS UI performance on low-end machines.

### 4. Custom Headless CMS (Flat-file)
Instead of adding the latency of a Postgres or Mongo database for a simple portfolio, data is persisted using a highly optimal, synchronous JSON-based datastore `videos.json`. It is protected by a lightweight Express Session authentication guard.

---

## 🛠️ Tech Stack

- **Frontend:** HTML5, CSS3 (Custom Responsive Grid), Vanilla JavaScript (ES6+), HLS.js
- **Backend:** Node.js, Express.js
- **Storage/Database:** Multer (DiskStorage), Flat-file JSON structure.
- **Media Processing:** FFmpeg, fluent-ffmpeg, ffmpeg-static.

---

## 🚀 Getting Started

If you want to run this application locally on your machine:

### Prerequisites:
- **Node.js** (v16.x or higher)
- **Git**

### Installation Steps:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Ayush789025/Portfolio-v2.git
   cd Portfolio-v2
   ```

2. **Install all dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm start
   ```

4. **Access the application:**
   - **Frontend:** [http://localhost:3000](http://localhost:3000)
   - **Admin Dashboard:** [http://localhost:3000/login](http://localhost:3000/login)

*(Note: Default Admin credentials are obfuscated via environment variables for security).*

---

## 💡 Why Vanilla JS?
In an era dominated by React and Vue, this project was deliberately built with Vanilla JavaScript to demonstrate a deep, fundamental understanding of browser APIs, DOM manipulation, hardware acceleration optimizations, and event-delegation mechanisms. 

---

<div align="center">
  <p>Built with ❤️ by <b>Ayush Sarkar</b></p>
  <p>Video Editor & Motion Designer</p>
</div>
