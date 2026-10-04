// Background school of small arrows (boids) that swim together and flee from the mouse.
(function () {
  const canvas = document.createElement("canvas");
  canvas.className = "bg-field";
  canvas.setAttribute("aria-hidden", "true");
  document.body.prepend(canvas);
  const ctx = canvas.getContext("2d");

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const DENSITY = 9000;   // one fish per N square pixels
  const MAX_FISH = 260;
  const LEN = 5;          // half length of each arrow
  const ALPHA = 0.07;     // base opacity
  const VIEW = 90;        // how far a fish sees its neighbours
  const SPACE = 20;       // personal space
  const MIN_SPEED = 0.5, MAX_SPEED = 1.4;
  const FLEE_RADIUS = 130;
  const INK = [26, 26, 26];
  const ACCENT = [255, 90, 54];
  const OFF = -1e4;

  let w, h, fish = [];
  let mouseX = OFF, mouseY = OFF;
  let time = 0;
  const grid = new Map();

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const count = Math.min(MAX_FISH, Math.round((w * h) / DENSITY));
    // Spawn in a few schools that already swim in the same direction
    let school = 0;
    while (fish.length < count) {
      school++;
      const sx = Math.random() * w, sy = Math.random() * h;
      const heading = Math.random() * Math.PI * 2;
      const size = 20 + ((Math.random() * 25) | 0);
      for (let i = 0; i < size && fish.length < count; i++) {
        const a = heading + (Math.random() - 0.5) * 0.6;
        const s = MIN_SPEED + Math.random() * (MAX_SPEED - MIN_SPEED);
        fish.push({
          x: sx + (Math.random() - 0.5) * 160,
          y: sy + (Math.random() - 0.5) * 160,
          vx: Math.cos(a) * s, vy: Math.sin(a) * s, scared: 0, school,
        });
      }
    }
    fish.length = count;
  }

  function buildGrid() {
    grid.clear();
    for (const f of fish) {
      const key = ((f.x / VIEW) | 0) + "," + ((f.y / VIEW) | 0);
      let cell = grid.get(key);
      if (!cell) grid.set(key, (cell = []));
      cell.push(f);
    }
  }

  function step() {
    time += 0.002;
    buildGrid();
    for (const f of fish) {
      let ax = 0, ay = 0, cx = 0, cy = 0, sx = 0, sy = 0, n = 0;
      const gx = (f.x / VIEW) | 0, gy = (f.y / VIEW) | 0;
      for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
          const cell = grid.get((gx + i) + "," + (gy + j));
          if (!cell) continue;
          for (const o of cell) {
            if (o === f) continue;
            const dx = o.x - f.x, dy = o.y - f.y;
            const d2 = dx * dx + dy * dy;
            if (d2 > VIEW * VIEW) continue;
            if (d2 < SPACE * SPACE) {        // separation (from every fish)
              const d = Math.sqrt(d2) || 1;
              sx -= dx / d; sy -= dy / d;
            }
            if (o.school !== f.school) continue;
            ax += o.vx; ay += o.vy;          // alignment (own school only)
            cx += o.x; cy += o.y;            // cohesion (own school only)
            n++;
          }
        }
      }

      f.vx += sx * 0.05;
      f.vy += sy * 0.05;
      if (n) {
        f.vx += (ax / n - f.vx) * 0.05 + (cx / n - f.x) * 0.0012;
        f.vy += (ay / n - f.vy) * 0.05 + (cy / n - f.y) * 0.0012;
      }

      // Each school slowly picks its own heading, so schools roam independently
      const heading = Math.sin(time * 0.9 + f.school * 1.7) * Math.PI + Math.cos(time * 0.6 + f.school * 2.3) * Math.PI;
      f.vx += Math.cos(heading) * 0.03;
      f.vy += Math.sin(heading) * 0.03;

      // Gentle wandering so the school never freezes
      f.vx += (Math.random() - 0.5) * 0.03;
      f.vy += (Math.random() - 0.5) * 0.03;

      // Flee from the mouse
      const mx = f.x - mouseX, my = f.y - mouseY;
      const md = Math.hypot(mx, my) || 1;
      let fear = 0;
      if (md < FLEE_RADIUS) {
        fear = 1 - md / FLEE_RADIUS;
        f.vx += (mx / md) * fear * 0.6;
        f.vy += (my / md) * fear * 0.6;
      }
      f.scared += (fear - f.scared) * 0.08;

      // Clamp speed (scared fish swim faster)
      const speed = Math.hypot(f.vx, f.vy) || 1;
      const max = MAX_SPEED + f.scared * 2.5;
      const clamped = Math.max(MIN_SPEED, Math.min(max, speed));
      f.vx = (f.vx / speed) * clamped;
      f.vy = (f.vy / speed) * clamped;

      f.x += f.vx;
      f.y += f.vy;

      // Wrap around the screen edges
      if (f.x < -10) f.x = w + 10; else if (f.x > w + 10) f.x = -10;
      if (f.y < -10) f.y = h + 10; else if (f.y > h + 10) f.y = -10;
    }
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    ctx.lineWidth = 1.2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    for (const f of fish) {
      const k = Math.min(1, f.scared * 2);
      const r = INK[0] + (ACCENT[0] - INK[0]) * k;
      const g = INK[1] + (ACCENT[1] - INK[1]) * k;
      const b = INK[2] + (ACCENT[2] - INK[2]) * k;
      ctx.strokeStyle = `rgba(${r | 0},${g | 0},${b | 0},${ALPHA + k * 0.3})`;

      const speed = Math.hypot(f.vx, f.vy) || 1;
      const c = f.vx / speed, s = f.vy / speed;
      const tipX = f.x + c * LEN, tipY = f.y + s * LEN;
      ctx.beginPath();
      ctx.moveTo(f.x - c * LEN, f.y - s * LEN);
      ctx.lineTo(tipX, tipY);
      ctx.moveTo(tipX - c * 3.5 + s * 2.5, tipY - s * 3.5 - c * 2.5);
      ctx.lineTo(tipX, tipY);
      ctx.lineTo(tipX - c * 3.5 - s * 2.5, tipY - s * 3.5 + c * 2.5);
      ctx.stroke();
    }
  }

  function frame() {
    step();
    draw();
    requestAnimationFrame(frame);
  }

  window.addEventListener("resize", () => { resize(); if (reduceMotion) draw(); });
  resize();

  if (reduceMotion) {
    // Let the school settle into formation, then draw it once
    for (let i = 0; i < 200; i++) step();
    draw();
    return;
  }

  window.addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse") return;
    mouseX = e.clientX;
    mouseY = e.clientY;
  }, { passive: true });
  document.documentElement.addEventListener("mouseleave", () => { mouseX = OFF; mouseY = OFF; });

  requestAnimationFrame(frame);
})();
