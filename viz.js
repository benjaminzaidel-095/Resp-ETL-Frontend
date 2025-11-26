(function () {
  const canvas = document.getElementById('cornerViz');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let DPR = window.devicePixelRatio || 1;
  let width = 0;
  let height = 0;
  const particles = [];
  const PARTICLE_COUNT = 28;
  const COLORS = ['#7ef0c4', '#34d399', '#10b981', '#86efac'];

  function resize() {
    DPR = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    width = Math.max(100, Math.floor(rect.width));
    height = Math.max(100, Math.floor(rect.height));
    canvas.width = Math.floor(width * DPR);
    canvas.height = Math.floor(height * DPR);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  function rand(min, max) { return Math.random() * (max - min) + min; }

  function createParticles() {
    particles.length = 0;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const p = {
        x: rand(0, width),
        y: rand(0, height),
        vx: rand(-0.25, 0.25),
        vy: rand(-0.25, 0.25),
        r: rand(3, 10),
        life: rand(60, 240),
        ttl: 0,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        phase: Math.random() * Math.PI * 2,
      };
      particles.push(p);
    }
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);

    // subtle background glow
    const g = ctx.createLinearGradient(0, 0, width, height);
    g.addColorStop(0, 'rgba(20, 60, 50, 0.03)');
    g.addColorStop(1, 'rgba(16, 50, 40, 0.02)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, width, height);

    for (let p of particles) {
      p.x += p.vx + Math.cos(p.phase + p.ttl * 0.02) * 0.15;
      p.y += p.vy + Math.sin(p.phase + p.ttl * 0.02) * 0.12;
      p.ttl++;
      if (p.x < -20) p.x = width + 10;
      if (p.x > width + 20) p.x = -10;
      if (p.y < -20) p.y = height + 10;
      if (p.y > height + 20) p.y = -10;

      const lifeRatio = Math.max(0, Math.sin((p.ttl / p.life) * Math.PI));
      const radius = p.r * (0.6 + lifeRatio * 0.8);

      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius * 2);
      grad.addColorStop(0, hexToRgba(p.color, 0.95 * lifeRatio));
      grad.addColorStop(0.6, hexToRgba(p.color, 0.25 * lifeRatio));
      grad.addColorStop(1, 'rgba(16,40,32,0)');

      ctx.beginPath();
      ctx.fillStyle = grad;
      ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // small connecting lines
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineWidth = 0.6;
    ctx.strokeStyle = 'rgba(34,211,153,0.08)';
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i];
        const b = particles[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < 50) {
          ctx.globalAlpha = 0.12 * (1 - d / 50);
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  function hexToRgba(hex, alpha) {
    const h = hex.replace('#', '');
    const bigint = parseInt(h, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r},${g},${b},${alpha})`;
  }

  let rafId = null;
  function loop() {
    draw();
    rafId = requestAnimationFrame(loop);
  }

  function start() {
    resize();
    createParticles();
    if (!rafId) loop();
  }

  window.addEventListener('resize', () => {
    // debounce a bit
    clearTimeout(window.__cornerVizResize);
    window.__cornerVizResize = setTimeout(() => {
      resize();
      // re-create particles so they fit new area
      createParticles();
    }, 150);
  });

  // slight pulse when a file is selected: listen for an attribute on body
  const observer = new MutationObserver((list) => {
    for (const m of list) {
      if (m.attributeName === 'data-file-ready') {
        // boost velocities briefly
        for (let p of particles) {
          p.vx += rand(-0.6, 0.6);
          p.vy += rand(-0.6, 0.6);
        }
      }
    }
  });
  observer.observe(document.body, { attributes: true });

  start();

  // expose a small API to pulse from page JS
  window.cornerVizPulse = function () {
    for (let p of particles) {
      p.vx += rand(-0.8, 0.8);
      p.vy += rand(-0.8, 0.8);
    }
  };
})();
