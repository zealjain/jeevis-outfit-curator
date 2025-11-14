// Minimal UI helpers
export const $ = sel => document.querySelector(sel);
export function toast(msg, ms=1800){
  const el = $("#toast"); el.textContent = msg; el.classList.add("show");
  setTimeout(()=>el.classList.remove("show"), ms);
}
export function setView(id){
  document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}
export function renderProgress(stepIndex, total){
  $("#progressText").textContent = `Step ${stepIndex+1} of ${total}`;
  $("#barFill").style.width = `${((stepIndex+1)/total)*100}%`;
}

export function card(option, isSelected, onSelect) {
  const div = document.createElement("div");
  div.className = "card" + (isSelected ? " selected" : "");
  div.tabIndex = 0; // make it keyboard focusable
  div.setAttribute("role", "button");
  div.setAttribute("aria-pressed", isSelected);
  div.setAttribute("aria-label", `${option.name}: ${option.desc}`);

  div.innerHTML = `
    <img src="${option.img}" alt="Photo of ${option.name}">
    <div class="body">
      <div class="name">${option.name}</div>
      <div class="desc">${option.desc}</div>
    </div>
  `;

  // Click or keyboard triggers selection
  div.addEventListener("click", onSelect);
  div.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect();
    }
  });

  return div;
}


// --- Confetti Engine (no deps) ------------------------------------
const Confetti = (() => {
  let canvas, ctx, W, H, dpr = Math.max(1, window.devicePixelRatio || 1);
  let particles = [];
  let running = false;
  let rafId = null;

  function resize() {
    if (!canvas) return;
    W = canvas.clientWidth;
    H = canvas.clientHeight;
    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function initCanvas() {
    canvas = document.getElementById("confetti");
    if (!canvas) return;
    ctx = canvas.getContext("2d");
    resize();
    window.addEventListener("resize", resize);
  }

  function rand(min, max) { return Math.random() * (max - min) + min; }

  function spawn(count = 80, burst = false) {
    if (!ctx) initCanvas();
    for (let i = 0; i < count; i++) {
      const angle = rand(-Math.PI, 0);
      const speed = burst ? rand(5, 9) : rand(3, 6);
      particles.push({
        x: rand(0, W),
        y: burst ? H * 0.6 : -10,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        g: rand(0.08, 0.15),
        size: rand(6, 10),
        rot: rand(0, Math.PI * 2),
        vr: rand(-0.15, 0.15),
        hue: rand(0, 360),
        alpha: 1,
        shape: Math.random() < 0.5 ? "rect" : "circle",
      });
    }
    start();
  }

  function draw() {
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);
    for (let p of particles) {
      p.vy += p.g;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      p.alpha = Math.max(0, p.alpha - 0.003);

      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = `hsl(${p.hue}, 85%, 60%)`;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);

      if (p.shape === "rect") {
        ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size * 0.6);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, p.size/2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
    ctx.globalAlpha = 1;

    // Cull finished/confetti off screen
    particles = particles.filter(p => p.alpha > 0 && p.y < H + 40 && p.x > -40 && p.x < W + 40);

    if (!particles.length) stop();
  }

  function loop() {
    draw();
    rafId = requestAnimationFrame(loop);
  }

  function start() {
    if (running) return;
    running = true;
    rafId = requestAnimationFrame(loop);
  }

  function stop() {
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
  }

  // Public API
  return {
    onceSmall() {
      initCanvas();
      spawn(70, false);
    },
    celebrate() {
      initCanvas();
      // Three quick bursts for extra party
      spawn(120, true);
      setTimeout(() => spawn(100, true), 220);
      setTimeout(() => spawn(90, true), 420);
    }
  };
})();

export function confettiOnce() {
  Confetti.onceSmall();
}

export function confettiCelebrate() {
  Confetti.celebrate();
}
