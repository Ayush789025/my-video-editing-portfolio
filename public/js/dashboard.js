/* dashboard.js — Admin Dashboard */

/* ── Auth guard ── */
(async () => {
  try {
    const r = await fetch('/api/check-auth');
    const d = await r.json();
    if (!d.authenticated) window.location.href = '/login.html';
  } catch { window.location.href = '/login.html'; }
})();

/* ── Panel switching ── */
const dsLinks = document.querySelectorAll('.ds-link[data-panel]');
const panels  = document.querySelectorAll('.d-panel');

function showPanel(id) {
  panels.forEach(p => p.classList.remove('active'));
  dsLinks.forEach(l => l.classList.remove('active'));
  document.getElementById(`panel-${id}`)?.classList.add('active');
  document.querySelector(`.ds-link[data-panel="${id}"]`)?.classList.add('active');
}

dsLinks.forEach(l => l.addEventListener('click', () => showPanel(l.dataset.panel)));
document.getElementById('go-add-btn')?.addEventListener('click', () => showPanel('add'));
document.getElementById('cancel-add')?.addEventListener('click', () => showPanel('library'));

/* ── Logout ── */
document.getElementById('logout-btn')?.addEventListener('click', async () => {
  await fetch('/api/logout', { method: 'POST' });
  window.location.href = '/login.html';
});

/* ── Ripple ── */
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.btn');
  if (!btn) return;
  const rect = btn.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height) * 1.8;
  const wave = document.createElement('span');
  wave.className = 'ripple-wave';
  wave.style.cssText = `
    width:${size}px;height:${size}px;
    left:${e.clientX-rect.left-size/2}px;top:${e.clientY-rect.top-size/2}px;
    position:absolute;pointer-events:none;border-radius:50%;
    background:rgba(255,255,255,0.13);transform:scale(0);
    animation:rippleOut .5s ease-out forwards;
  `;
  btn.style.position = btn.style.position || 'relative';
  btn.style.overflow = 'hidden';
  btn.appendChild(wave);
  wave.addEventListener('animationend', () => wave.remove());
});

/* ── Source tabs ── */
const srcTabs   = document.querySelectorAll('.src-tab');
const srcPanels = document.querySelectorAll('.src-panel');
srcTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    srcTabs.forEach(t => t.classList.remove('active'));
    srcPanels.forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(`src-${tab.dataset.src}-panel`)?.classList.add('active');
  });
});

/* ── Drop zones ── */
function initDropZone(zoneId, inputId, nameDisplayId, onFile) {
  const zone    = document.getElementById(zoneId);
  const input   = document.getElementById(inputId);
  const display = document.getElementById(nameDisplayId);
  if (!zone || !input) return;

  zone.addEventListener('click', (e) => {
    if (!e.target.classList.contains('remove-preview')) input.click();
  });
  zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag-over'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) { assignFile(input, file, display, onFile); }
  });
  input.addEventListener('change', () => {
    if (input.files[0]) assignFile(input, input.files[0], display, onFile);
  });
}

function assignFile(input, file, display, cb) {
  const dt = new DataTransfer();
  dt.items.add(file);
  input.files = dt.files;
  if (display) display.textContent = file.name;
  if (cb) cb(file);
}

/* Thumbnail drop zone with preview */
initDropZone('thumb-zone', 'av-thumb', 'thumb-name', (file) => {
  const preview     = document.getElementById('thumb-preview');
  const previewWrap = document.getElementById('thumb-preview-wrap');
  const reader = new FileReader();
  reader.onload = e => {
    preview.src = e.target.result;
    previewWrap.style.display = 'flex';
  };
  reader.readAsDataURL(file);
});

document.getElementById('remove-thumb')?.addEventListener('click', () => {
  document.getElementById('av-thumb').value = '';
  document.getElementById('thumb-name').textContent = 'No file chosen';
  document.getElementById('thumb-preview-wrap').style.display = 'none';
  document.getElementById('thumb-preview').src = '';
});

/* Video drop zone */
initDropZone('video-zone', 'av-file', 'video-name', null);

/* ── Library load ── */
async function loadLibrary() {
  const list = document.getElementById('lib-list');
  if (!list) return;
  try {
    const res  = await fetch('/api/videos?t=' + new Date().getTime());
    const data = await res.json();
    if (!data.videos?.length) {
      list.innerHTML = `<p style="color:var(--text-3);font-size:0.84rem;padding:2rem 0;letter-spacing:0.05em;">No videos yet. Add your first video.</p>`;
      return;
    }
    list.innerHTML = '';
    data.videos.forEach(v => list.appendChild(buildLibItem(v)));
  } catch {
    list.innerHTML = `<p style="color:#f87171;font-size:0.84rem;">Error loading library.</p>`;
  }
}

function buildLibItem(v) {
  const item = document.createElement('div');
  item.className = 'lib-item';
  item.dataset.id = v._id;

  const thumbSrc = v.thumbnail ? `/uploads/thumbs/${v.thumbnail}` : '';
  const thumbHtml = thumbSrc
    ? `<img class="lib-thumb" src="${esc(thumbSrc)}" alt="${esc(v.title)}" loading="lazy"/>`
    : `<div class="lib-thumb-placeholder">No Thumb</div>`;

  item.innerHTML = `
    ${thumbHtml}
    <div class="lib-meta">
      <h4>${esc(v.title)}</h4>
      <p>${esc(v.description)}</p>
    </div>
    <div class="lib-actions">
      <button class="btn-del" data-id="${v._id}">Delete</button>
    </div>`;

  item.querySelector('.btn-del').addEventListener('click', () => deleteVideo(v._id));
  return item;
}

async function deleteVideo(id) {
  if (!confirm('Delete this video permanently?')) return;
  try {
    const res  = await fetch(`/api/videos/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      document.querySelector(`.lib-item[data-id="${id}"]`)?.remove();
      const list = document.getElementById('lib-list');
      if (list && !list.children.length) {
        list.innerHTML = `<p style="color:var(--text-3);font-size:0.84rem;padding:2rem 0;">No videos yet.</p>`;
      }
    }
  } catch { alert('Delete failed. Please try again.'); }
}

/* ── Add video form ── */
const addForm = document.getElementById('add-form');
if (addForm) {
  addForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn    = addForm.querySelector('button[type=submit]');
    const status = document.getElementById('add-status');
    btn.disabled = true;
    btn.textContent = 'Publishing...';
    status.className = 'form-status';
    status.textContent = '';

    // Validate thumbnail
    const thumbFile = document.getElementById('av-thumb').files[0];
    const urlVal    = document.getElementById('av-url')?.value?.trim();
    const fileVal   = document.getElementById('av-file')?.files[0];
    const activeTab = document.querySelector('.src-tab.active')?.dataset?.src;

    if (activeTab === 'url' && !urlVal) {
      status.className = 'form-status error';
      status.textContent = 'Please enter a video URL.';
      btn.disabled = false; btn.textContent = 'Publish Video';
      return;
    }
    if (activeTab === 'file' && !fileVal) {
      status.className = 'form-status error';
      status.textContent = 'Please upload a video file.';
      btn.disabled = false; btn.textContent = 'Publish Video';
      return;
    }

    const fd = new FormData(addForm);
    // Clear the unused source
    if (activeTab === 'url') fd.delete('videoFile');
    else fd.delete('videoUrl');

    try {
      const res  = await fetch('/api/videos', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.success) {
        status.className = 'form-status success';
        status.textContent = 'Video published successfully.';
        addForm.reset();
        document.getElementById('thumb-name').textContent = 'No file chosen';
        document.getElementById('video-name').textContent = 'No file chosen';
        document.getElementById('thumb-preview-wrap').style.display = 'none';
        document.getElementById('thumb-preview').src = '';
        await loadLibrary();
        setTimeout(() => showPanel('library'), 1200);
      } else {
        throw new Error(data.message || 'Publish failed.');
      }
    } catch (err) {
      status.className = 'form-status error';
      status.textContent = err.message;
    } finally {
      btn.disabled = false;
      btn.textContent = 'Publish Video';
    }
  });
}

function esc(s) {
  const d = document.createElement('div');
  d.appendChild(document.createTextNode(s || ''));
  return d.innerHTML;
}

/* Init */
loadLibrary();
