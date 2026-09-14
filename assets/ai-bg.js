(function () {
  const canvas = document.getElementById('ai-bg');
  if (!canvas) return;

  const mqDisable = window.matchMedia('(max-width: 720px)');
  const mqReduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  const ctx = canvas.getContext('2d', { alpha: true });
  let w, h, dpr, particles, rafId, resizeTimer;
  let running = false;

  function buildGlowSprite(hue) {
    const size = 30, off = document.createElement('canvas');
    off.width = off.height = size;
    const octx = off.getContext('2d');
    const g = octx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
    g.addColorStop(0, `hsla(${hue}, 95%, 70%, .95)`);
    g.addColorStop(1, `hsla(${hue}, 95%, 70%, 0)`);
    octx.fillStyle = g;
    octx.beginPath(); octx.arc(size/2, size/2, size/2, 0, Math.PI * 2); octx.fill();
    return off;
  }
  const glowSprites = { 44: buildGlowSprite(44), 184: buildGlowSprite(184), 198: buildGlowSprite(198) };

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth; h = canvas.clientHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!particles) init();
  }

  function init() {
    const count = Math.max(48, Math.min(95, Math.floor(w * h / 11500)));
    particles = Array.from({ length: count }, (_, i) => ({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.34, vy: (Math.random() - 0.5) * 0.34,
      r: i % 7 === 0 ? 2.4 : 1.45,
      hue: i % 5 === 0 ? 44 : (i % 3 === 0 ? 184 : 198)
    }));
  }

  function drawLattice(t) {
    ctx.save();
    ctx.globalAlpha = 0.16; ctx.strokeStyle = '#8fefff'; ctx.lineWidth = 1;
    const step = 68;
    for (let y = -step; y < h + step; y += step) {
      ctx.beginPath();
      for (let x = -step; x < w + step; x += step) {
        const yy = y + Math.sin((x + t * 0.018) * 0.012) * 12;
        x === -step ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  function frame(t) {
    const reduced = mqReduced.matches;
    ctx.clearRect(0, 0, w, h);
    drawLattice(reduced ? 0 : t);

    if (!reduced) {
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < -20) p.x = w + 20; if (p.x > w + 20) p.x = -20;
        if (p.y < -20) p.y = h + 20; if (p.y > h + 20) p.y = -20;
      }
    }

    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i], b = particles[j];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        if (dist < 118) {
          ctx.strokeStyle = `rgba(126, 242, 255, ${(1 - dist / 118) * 0.34})`;
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
    }

    for (const p of particles) {
      const sprite = glowSprites[p.hue], s = 30;
      ctx.drawImage(sprite, p.x - s/2, p.y - s/2, s, s);
      ctx.fillStyle = p.hue === 44 ? '#ffd66b' : '#8ff6ff';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }

    if (running && !reduced) rafId = requestAnimationFrame(frame);
    else rafId = null;
  }

  function start() {
    if (mqDisable.matches) { canvas.style.display = 'none'; stop(); return; }
    canvas.style.display = '';
    resize();
    if (!running) { running = true; rafId = requestAnimationFrame(frame); }
    if (mqReduced.matches && !rafId) frame(0); // draw one static frame
  }

  function stop() {
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
  }

  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 120);
  }, { passive: true });

  mqDisable.addEventListener('change', start);
  mqReduced.addEventListener('change', start);
  document.addEventListener('visibilitychange', () => {
    document.hidden ? stop() : start();
  });

  start();
})();
