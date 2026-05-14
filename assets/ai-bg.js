(function () {
  const canvas = document.getElementById('ai-bg');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let w, h, dpr, particles;
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    init();
  }

  function init() {
    const count = Math.max(48, Math.min(95, Math.floor(w * h / 11500)));
    particles = Array.from({ length: count }, (_, i) => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.34,
      vy: (Math.random() - 0.5) * 0.34,
      r: i % 7 === 0 ? 2.4 : 1.45,
      hue: i % 5 === 0 ? 44 : (i % 3 === 0 ? 184 : 198)
    }));
  }

  function drawLattice() {
    ctx.save();
    ctx.globalAlpha = 0.16;
    ctx.strokeStyle = '#8fefff';
    ctx.lineWidth = 1;
    const step = 68;
    for (let y = -step; y < h + step; y += step) {
      ctx.beginPath();
      for (let x = -step; x < w + step; x += step) {
        const yy = y + Math.sin((x + performance.now() * 0.018) * 0.012) * 12;
        if (x === -step) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  function frame() {
    ctx.clearRect(0, 0, w, h);
    drawLattice();

    for (const p of particles) {
      if (!prefersReduced) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < -20) p.x = w + 20; if (p.x > w + 20) p.x = -20;
        if (p.y < -20) p.y = h + 20; if (p.y > h + 20) p.y = -20;
      }
    }

    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i], b = particles[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 118) {
          const alpha = (1 - dist / 118) * 0.34;
          ctx.strokeStyle = `rgba(126, 242, 255, ${alpha})`;
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
    }

    for (const p of particles) {
      const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 15);
      glow.addColorStop(0, `hsla(${p.hue}, 95%, 70%, .95)`);
      glow.addColorStop(1, `hsla(${p.hue}, 95%, 70%, 0)`);
      ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(p.x, p.y, 15, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = p.hue === 44 ? '#ffd66b' : '#8ff6ff';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }

    if (!prefersReduced) requestAnimationFrame(frame);
  }

  window.addEventListener('resize', resize, { passive: true });
  resize();
  frame();
})();
