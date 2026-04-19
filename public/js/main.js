
function scrollSection(sectionId) {
  const el = document.getElementById(sectionId);
  const offset = 80;

  if (el) {
    const top =
      el.getBoundingClientRect().top + window.pageYOffset - offset;

    window.scrollTo({
      top: top,
      behavior: "smooth"
    });
  }
}
/* main.js — Portfolio Frontend Logic */

/* ── Scroll helper ── */


/* ── Navbar scroll class ── */
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  if (navbar) navbar.classList.toggle('stuck', window.scrollY > 50);
}, { passive: true });

/* ── Active nav link ── */
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-link');
const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      navLinks.forEach(l => l.classList.remove('active'));
      const l = document.querySelector(`.nav-link[href="#${e.target.id}"]`);
      if (l) l.classList.add('active');
    }
  });
}, { threshold: 0.4 });
sections.forEach(s => sectionObserver.observe(s));

/* ── Mobile drawer ── */
const hamburger = document.getElementById('hamburger');
const mobileDrawer = document.getElementById('mobile-drawer');
const mobileOverlay = document.getElementById('mobile-overlay');

function openDrawer() { mobileDrawer?.classList.add('open'); mobileOverlay?.classList.add('show'); }
function closeDrawer() { mobileDrawer?.classList.remove('open'); mobileOverlay?.classList.remove('show'); }

hamburger?.addEventListener('click', openDrawer);
mobileOverlay?.addEventListener('click', closeDrawer);
document.getElementById('drawer-close')?.addEventListener('click', closeDrawer);
document.querySelectorAll('.drawer-link').forEach(l => l.addEventListener('click', closeDrawer));

/* ── Ripple effect ── */
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.btn');
  if (!btn) return;
  const rect = btn.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height) * 1.8;
  const wave = document.createElement('span');
  wave.className = 'ripple-wave';
  wave.style.cssText = `
    width: ${size}px; height: ${size}px;
    left: ${e.clientX - rect.left - size / 2}px;
    top:  ${e.clientY - rect.top - size / 2}px;
    position: absolute; pointer-events: none;
    border-radius: 50%;
    background: rgba(255,255,255,0.13);
    transform: scale(0);
    animation: rippleOut 0.5s ease-out forwards;
  `;
  btn.style.position = btn.style.position || 'relative';
  btn.style.overflow = 'hidden';
  btn.appendChild(wave);
  wave.addEventListener('animationend', () => wave.remove());
});

/* ── Scroll reveal ── */
const revealObs = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('in-view');
      revealObs.unobserve(e.target);
    }
  });
}, { threshold: 0.1 });
document.querySelectorAll('.scroll-reveal').forEach(el => revealObs.observe(el));

/* ── Counter animation ── */
function runCounters() {
  document.querySelectorAll('.stat-value[data-count]').forEach(el => {
    const target = parseInt(el.dataset.count, 10);
    let cur = 0;
    const inc = Math.ceil(target / 55);
    const id = setInterval(() => {
      cur = Math.min(cur + inc, target);
      el.textContent = cur;
      if (cur >= target) clearInterval(id);
    }, 28);
  });
}
const statsEl = document.querySelector('.stats-row');
if (statsEl) {
  const co = new IntersectionObserver((en) => {
    if (en[0].isIntersecting) { runCounters(); co.disconnect(); }
  }, { threshold: 0.5 });
  co.observe(statsEl);
}

/* ── Embed URL helper ── */
function toEmbedUrl(url) {
  if (!url) return null;
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([A-Za-z0-9_-]{11})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}?rel=0&modestbranding=1`;
  const vim = url.match(/vimeo\.com\/(\d+)/);
  if (vim) return `https://player.vimeo.com/video/${vim[1]}?title=0&byline=0`;
  return url;
}

/* ── Load Videos ── */
async function loadVideos() {
  const grid = document.getElementById('video-grid');
  if (!grid) return;
  try {
    const res = await fetch('/api/videos?t=' + new Date().getTime());
    const data = await res.json();
    if (!data.videos?.length) {
      grid.innerHTML = `<div class="empty-state"><h3>No videos yet</h3><p>Content is coming soon. Check back later.</p></div>`;
      return;
    }
    grid.innerHTML = '';
    data.videos.forEach((v, i) => {
      const card = buildVideoCard(v, i);
      grid.appendChild(card);
    });
  } catch {
    grid.innerHTML = `<div class="empty-state"><h3>Could not load videos</h3><p>Please refresh and try again.</p></div>`;
  }
}

function buildVideoCard(v, index) {
  const card = document.createElement('div');
  card.className = 'video-card';
  card.style.animationDelay = `${index * 0.08}s`;

  const embedUrl = toEmbedUrl(v.videoUrl);
  const thumbSrc = v.thumbnail
    ? `/uploads/thumbs/${v.thumbnail}`
    : '';
  const hasFile = !v.videoUrl && v.videoFile;

  const thumbHtml = thumbSrc
    ? `<img class="vc-thumb" src="${thumbSrc}" alt="${esc(v.title)}" loading="lazy"/>`
    : `<div class="vc-thumb" style="background:var(--bg-2);position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:var(--text-3);font-size:0.72rem;letter-spacing:0.1em;text-transform:uppercase;">No Thumbnail</div>`;

  let mediaHtml = '';

  if (embedUrl) {
    // URL-based video with hover preview
    mediaHtml = `
      <div class="vc-media" id="vcm-${v._id}">
        ${thumbHtml}
        <div class="vc-overlay" onclick="playVideo(event,'${embedUrl}','${v._id}')">
          <div class="play-btn-wrap">
            <div class="play-icon-circle">
              <svg width="18" height="18" viewBox="0 0 18 18"><polygon points="4,2 16,9 4,16"/></svg>
            </div>
          </div>
        </div>
      </div>`;
  } else if (hasFile) {
    mediaHtml = `
      <div class="vc-media" id="vcm-${v._id}" ${v.hlsVideo ? `data-hls="${v.hlsVideo}"` : ''}>
        ${thumbHtml}
        <div class="vc-overlay" onclick="playLocalVideo(event,'${v.videoFile}','${v._id}','${thumbSrc}')">
          <div class="play-btn-wrap">
            <div class="play-icon-circle">
              <svg width="18" height="18" viewBox="0 0 18 18"><polygon points="4,2 16,9 4,16"/></svg>
            </div>
          </div>
        </div>
      </div>`;
  } else {
    mediaHtml = `
      <div class="vc-media">
        <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:var(--bg-2);color:var(--text-3);font-size:0.75rem;letter-spacing:0.1em;">No Video Source</div>
      </div>`;
  }

  card.innerHTML = `
    ${mediaHtml}
    <div class="vc-info">
      <h3>${esc(v.title)}</h3>
      <p>${esc(v.description)}</p>
    </div>`;

  // Hover preview for URL videos
  if (embedUrl) {
    let previewTimer = null;
    let previewLoaded = false;

    card.addEventListener('mouseenter', () => {
      if (previewLoaded) return;
      previewTimer = setTimeout(() => {
        const wrap = document.getElementById(`vcm-${v._id}`);
        if (!wrap || wrap.dataset.playing) return;
        // Create muted autoplay preview iframe
        const previewUrl = embedUrl.includes('youtube')
          ? embedUrl + '&autoplay=1&mute=1&controls=0&loop=1&playlist=' + embedUrl.match(/embed\/([^?]+)/)?.[1]
          : embedUrl + '&autoplay=1&muted=1&loop=1&background=1';
        const preview = document.createElement('iframe');
        preview.className = 'vc-preview-frame';
        preview.src = previewUrl;
        preview.allow = 'autoplay';
        preview.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;border:none;border-radius:0;pointer-events:none;';
        wrap.appendChild(preview);
        previewLoaded = true;
      }, 600);
    });

    card.addEventListener('mouseleave', () => {
      clearTimeout(previewTimer);
      if (previewLoaded) {
        const wrap = document.getElementById(`vcm-${v._id}`);
        const preview = wrap?.querySelector('.vc-preview-frame');
        if (preview) {
          preview.src = ''; // stop playback
          preview.remove();
          previewLoaded = false;
        }
      }
    });
  }

  return card;
}

function resetOtherVideos(currentId) {
  document.querySelectorAll('.vc-media').forEach(mediaWrap => {
    if (mediaWrap.id === `vcm-${currentId}`) return;
    
    const media = mediaWrap.querySelector('video, iframe');
    if (media) {
      if (media.tagName === 'VIDEO') {
         media.pause();
         media.removeAttribute('src');
         media.load();
      } else {
         media.src = '';
      }

      // Revert to the thumbnail HTML completely freeing RAM
      if (mediaWrap.dataset.originalHtml) {
        mediaWrap.innerHTML = mediaWrap.dataset.originalHtml;
        mediaWrap.dataset.playing = '0';
      }
    }
  });
}

function playVideo(e, embedUrl, id) {
  e.stopPropagation();

  // Completely destroy other playing videos from RAM and restore thumbnails
  resetOtherVideos(id);

  const wrap = document.getElementById(`vcm-${id}`);
  if (!wrap) return;
  
  // Save thumbnail state to RAM before playing
  if (!wrap.dataset.originalHtml) {
    wrap.dataset.originalHtml = wrap.innerHTML;
  }

  wrap.dataset.playing = '1';
  const iframe = document.createElement('iframe');
  iframe.src = embedUrl + (embedUrl.includes('?') ? '&' : '?') + 'autoplay=1';
  iframe.allow = 'autoplay; fullscreen; picture-in-picture';
  iframe.allowFullscreen = true;
  // Added hardware acceleration
  iframe.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;border:none;transform:translateZ(0);will-change:transform;';
  wrap.innerHTML = '';
  wrap.appendChild(iframe);
}

function playLocalVideo(e, filename, id, poster) {
  e.stopPropagation();

  // Completely destroy other playing videos from RAM and restore thumbnails
  resetOtherVideos(id);
  
  // Pause canvas and background elements globally to free 100% GPU
  window.dispatchEvent(new Event('playLocalVideoEvent'));

  const wrap = document.getElementById(`vcm-${id}`);
  if (!wrap) return;
  
  // Save thumbnail state to RAM before playing
  if (!wrap.dataset.originalHtml) {
    wrap.dataset.originalHtml = wrap.innerHTML;
  }

  const video = document.createElement('video');
  video.controls = true;
  video.autoplay = true;
  video.playsInline = true;
  video.preload = "metadata";
  if (poster) video.poster = poster;
  
  // Clean fallback CSS safely without breaking Hardware Overlays
  video.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;background:#000;object-fit:contain;';
  
  // Listen for video pause or end to resume background animations
  video.addEventListener('pause', () => window.dispatchEvent(new Event('stopLocalVideoEvent')));
  video.addEventListener('ended', () => window.dispatchEvent(new Event('stopLocalVideoEvent')));
  video.addEventListener('play', () => window.dispatchEvent(new Event('playLocalVideoEvent')));
  
  const hlsUrl = wrap.dataset.hls;
  
  if (hlsUrl && typeof Hls !== 'undefined' && Hls.isSupported()) {
      // Stream adaptively with dynamic resolution detection
      const hls = new Hls();
      hls.loadSource(`/uploads/${hlsUrl}`);
      hls.attachMedia(video);
  } else if (hlsUrl && video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native Apple/Safari Adaptive streaming
      video.src = `/uploads/${hlsUrl}`;
  } else {
      // Standard MP4 fallback
      const src = document.createElement('source');
      src.src = `/uploads/${filename}`;
      const ext = filename.split('.').pop().toLowerCase();
      if(ext === 'mp4') src.type = 'video/mp4';
      else if(ext === 'webm') src.type = 'video/webm';
      else if(ext === 'mov') src.type = 'video/quicktime';
      else if(ext === 'avi') src.type = 'video/x-msvideo';
      video.appendChild(src);
  }

  wrap.innerHTML = '';
  wrap.appendChild(video);
}

window.playVideo = playVideo;
window.playLocalVideo = playLocalVideo;

function esc(s) {
  const d = document.createElement('div');
  d.appendChild(document.createTextNode(s || ''));
  return d.innerHTML;
}

/* Init */
document.addEventListener("DOMContentLoaded", function () {
  loadVideos();

  // Pause the background video when it is scrolled out of view to free up GPU and prevent stutter
  const bgVideo = document.querySelector('.avc-video');
  if (bgVideo) {
    const ob = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) bgVideo.play().catch(()=>{});
        else bgVideo.pause();
      });
    }, { threshold: 0.1 });
    ob.observe(bgVideo);
  }

  (function () {
    emailjs.init("L5kmGI7fM3S83KpAW");
  })();

  const form = document.getElementById("contact-form");

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();

      const status = document.getElementById("cf-status");

      status.className = "form-status";
      status.textContent = "Sending...";
      status.classList.add("show");

      form.classList.add("loading");

      // Capture values before form.reset() clears them
      const senderName    = form.querySelector('#cf-name').value;
      const senderEmail   = form.querySelector('#cf-email').value;
      const senderMessage = form.querySelector('#cf-msg').value;

      emailjs.sendForm("service_portfolio", "template_portfolio", this)
        .then(() => {
          // Send auto-reply to the user
          return emailjs.send("service_portfolio", "template_tlx1fsb", {
            name:    senderName,
            email:   senderEmail,
            message: senderMessage,
          });
        })
        .then(() => {
          status.textContent = "";
          status.classList.remove("show");

          const popup = document.getElementById("success-popup");
          const circle = popup.querySelector(".success-circle");
          const check = popup.querySelector(".success-check");

          // Reset SVG animations so they replay fresh every time
          popup.classList.remove("show");
          circle.style.animation = "none";
          check.style.animation = "none";
          void popup.offsetHeight; // force reflow

          circle.style.animation = "";
          check.style.animation = "";
          popup.classList.add("show");

          setTimeout(() => {
            popup.classList.remove("show");
          }, 3000);
          form.reset();
          form.classList.remove("loading");
        })
        .catch((error) => {
          const errMsg = error?.text || error?.message || JSON.stringify(error) || "Unknown error";
          status.textContent = "❌ Error: " + errMsg;
          status.classList.add("error");
          form.classList.remove("loading");
          console.error("EmailJS Error:", error);
        });
    });
  }
});