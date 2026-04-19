/* stars.js — Premium animated starfield */
(function () {
  const canvas = document.getElementById('starfield');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let stars = [], W, H;

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function initStars() {
    stars = [];
    const n = Math.floor((W * H) / 4800);
    for (let i = 0; i < n; i++) {
      stars.push({
        x:     Math.random() * W,
        y:     Math.random() * H * 0.72, // mostly sky area
        r:     Math.random() * 1.5 + 0.15,
        base:  Math.random() * 0.65 + 0.15,
        speed: Math.random() * 0.004 + 0.001,
        phase: Math.random() * Math.PI * 2
      });
    }
  }

  let isPaused = false;
  window.addEventListener('playLocalVideoEvent', () => isPaused = true);
  window.addEventListener('stopLocalVideoEvent', () => isPaused = false);

  let t = 0;
  function draw() {
    requestAnimationFrame(draw);
    if(isPaused) return;
    
    ctx.clearRect(0, 0, W, H);
    t += 0.01;
    for (const s of stars) {
      const a = s.base * (0.55 + 0.45 * Math.sin(t * s.speed * 180 + s.phase));
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(185, 220, 255, ${a})`;
      ctx.fill();
    }
  }

  resize();
  initStars();
  draw();
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { resize(); initStars(); }, 150);
  });
})();
