// ===== DOM =====
const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d", { alpha: true });

const startEl = document.getElementById("start");
const startBtn = document.getElementById("startBtn");

const audio = document.getElementById("audio");
const vol = document.getElementById("vol");
const muteBtn = document.getElementById("muteBtn");
const hintEl = document.getElementById("hint");

function hint(msg) {
  if (hintEl) hintEl.textContent = msg || "";
}

window.addEventListener("error", (e) => {
  hint("JS Error: " + (e?.message || "unknown"));
});

// ===== Audio =====
audio.loop = true;
audio.volume = Number(vol.value || 0.7);

function updateMuteIcon() {
  muteBtn.textContent = audio.muted || audio.volume === 0 ? "🔇" : "🔊";
}
updateMuteIcon();

vol.addEventListener("input", () => {
  audio.volume = Number(vol.value);
  audio.muted = audio.volume === 0;
  updateMuteIcon();
});

muteBtn.addEventListener("click", () => {
  audio.muted = !audio.muted;
  updateMuteIcon();
});

audio.addEventListener("error", () => hint("Không thấy music.mp3"));

function tryPlayMusic() {
  audio.load();
  audio
    .play()
    .then(() => hint("Music ON"))
    .catch(() => hint("Nhạc bị chặn/thiếu file"));
}

// ===== HiDPI resize =====
let W = 0,
  H = 0,
  DPR = 1;
function resize() {
  DPR = Math.min(2, window.devicePixelRatio || 1);
  W = Math.max(1, Math.floor(window.innerWidth));
  H = Math.max(1, Math.floor(window.innerHeight));
  canvas.width = Math.floor(W * DPR);
  canvas.height = Math.floor(H * DPR);
  canvas.style.width = W + "px";
  canvas.style.height = H + "px";
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

  buildSceneGeometry();
}
window.addEventListener("resize", resize);

// ===== Timeline (loop) =====
const T_DRAW = 4.4;
const T_HOLD1 = 2.0;
const T_TRANS = 1.0;
const T_HOLD2 = 2.4;
const T_TRANS2 = 1.0;
const T_TOTAL = T_DRAW + T_HOLD1 + T_TRANS + T_HOLD2 + T_TRANS2;

let started = false;
let t0 = 0;
let lastNow = 0;

// ===== Constants to keep tree + star aligned =====
const TOP_Y = -0.6;
const BOT_Y = 0.48;
// Star radius in "scale units" (khớp với buildStarPoints)
const STAR_R_OUT = 0.085;
const STAR_R_IN = 0.037;

// ===== Background stars =====
const bgStars = new Float32Array(240 * 4); // x,y,size,alpha
for (let i = 0; i < 240; i++) {
  bgStars[i * 4 + 0] = Math.random();
  bgStars[i * 4 + 1] = Math.random();
  bgStars[i * 4 + 2] = 0.6 + Math.random() * 1.6;
  bgStars[i * 4 + 3] = 0.2 + Math.random() * 0.55;
}

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}
function easeOutCubic(x) {
  x = clamp(x, 0, 1);
  return 1 - Math.pow(1 - x, 3);
}
function fillBackground(t) {
  const g = ctx.createRadialGradient(
    W * 0.3,
    H * 0.2,
    0,
    W * 0.3,
    H * 0.2,
    Math.max(W, H) * 0.95
  );
  g.addColorStop(0, "rgba(27,37,80,1)");
  g.addColorStop(0.35, "rgba(10,16,48,1)");
  g.addColorStop(1, "rgba(5,8,20,1)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  for (let i = 0; i < 240; i++) {
    const x = bgStars[i * 4 + 0] * W;
    const y = bgStars[i * 4 + 1] * H;
    const s = bgStars[i * 4 + 2];
    const a = bgStars[i * 4 + 3];
    const tw = 0.45 + 0.55 * Math.sin(t * 1.15 + bgStars[i * 4 + 0] * 10);
    ctx.globalAlpha = a * tw;
    ctx.fillStyle = "#fff";
    ctx.fillRect(x, y, s, s);
  }
  ctx.globalAlpha = 1;
}

// ===== Fireworks =====
const fireworks = [];
function rand(a, b) {
  return a + Math.random() * (b - a);
}

function spawnFirework(x, y) {
  const count = 110;
  const hue = Math.floor(Math.random() * 360);
  const parts = new Array(count);
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = rand(220, 560);
    parts[i] = {
      x,
      y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp,
      r: rand(1.1, 2.2),
      life: rand(0.85, 1.35),
      age: 0,
      hue,
    };
  }
  fireworks.push({ parts });
}

function updateFireworks(dt) {
  for (let k = fireworks.length - 1; k >= 0; k--) {
    const fw = fireworks[k];
    let alive = 0;
    for (const p of fw.parts) {
      p.age += dt;
      if (p.age >= p.life) continue;
      alive++;
      p.vy += 520 * dt; // gravity
      p.vx *= 1 - 0.6 * dt; // damping
      p.vy *= 1 - 0.2 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    if (alive === 0) fireworks.splice(k, 1);
  }
}

function drawFireworks() {
  for (const fw of fireworks) {
    for (const p of fw.parts) {
      if (p.age >= p.life) continue;
      const k = p.age / p.life;
      const a = (1 - k) * 0.95;

      ctx.globalAlpha = a * 0.32;
      ctx.fillStyle = `hsla(${p.hue}, 95%, 70%, 1)`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * 5.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = a;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}

// ===== Tree geometry (giống ảnh mẫu hơn: top nhọn + 2 tầng phình + eo) =====
function treeHalfWidth(t) {
  // làm top nhọn hơn (base nhỏ)
  const base = 0.035 + 0.3 * Math.pow(t, 0.92);

  // 2 tầng phình
  const b1 = 0.11 * Math.exp(-Math.pow((t - 0.34) / 0.1, 2));
  const b2 = 0.26 * Math.exp(-Math.pow((t - 0.74) / 0.14, 2));

  // notch tạo “eo” giống mẫu
  const notch = -0.075 * Math.exp(-Math.pow((t - 0.56) / 0.07, 2));

  // bo nhẹ
  const smooth = 0.01 * Math.sin(t * Math.PI * 2.6);

  return Math.max(0.04, base + b1 + b2 + notch + smooth);
}

function buildOutlineNormalized() {
  const pts = [];
  const topY = TOP_Y;
  const botY = BOT_Y;

  const N = 240;

  // left edge
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1);
    const y = topY + (botY - topY) * t;
    const x = -treeHalfWidth(t);
    pts.push({ x, y });
  }

  // base line dài & cong như mẫu
  const baseW = treeHalfWidth(1) * 1.65;
  const M = 180;
  for (let i = 0; i < M; i++) {
    const u = i / (M - 1);
    const x = -baseW + baseW * 2 * u;
    const y = botY + 0.028 * Math.sin(u * Math.PI);
    pts.push({ x, y });
  }

  // right edge
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1);
    const y = botY + (topY - botY) * t;
    const x = treeHalfWidth(1 - t);
    pts.push({ x, y });
  }

  return pts;
}

function buildStarPoints(cx, cy, rOuter, rInner, spikes = 5) {
  const pts = [];
  const step = Math.PI / spikes;
  let a = -Math.PI / 2;
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? rOuter : rInner;
    pts.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r });
    a += step;
  }
  pts.push(pts[0]);
  return pts;
}

// ===== Precomputed pixel arrays =====
let outlineNorm = buildOutlineNormalized();

let outlineX = null,
  outlineY = null,
  outlineN = 0;
let starX = null,
  starY = null,
  starN = 0;

let baseScale = 1;
let cx = 0,
  cy = 0;

function buildSceneGeometry() {
  // --- scale tự fit để không đụng top & còn chỗ cho chữ ---
  const topMargin = 40; // chừa trên cho sao
  const bottomMargin = 220; // chừa dưới cho chữ + smile

  // chiều cao normalized (từ TOP_Y -> BOT_Y) + phần sao nhô lên (STAR_R_OUT)
  const normHeight = BOT_Y - TOP_Y + STAR_R_OUT;

  const maxScaleByHeight = (H - topMargin - bottomMargin) / normHeight;
  const scaleByMinSide = Math.min(W, H) * 0.52;

  baseScale = Math.max(220, Math.min(scaleByMinSide, maxScaleByHeight)); // clamp nhẹ để không bé quá

  // --- đặt đáy cây theo targetBottom, nhưng nếu top bị sát quá thì đẩy xuống ---
  const bottomTarget = H * 0.62; // muốn cây xuống/ lên: chỉnh 0.62 -> 0.60 hoặc 0.65

  const cyFromBottom = bottomTarget - BOT_Y * baseScale;

  // điều kiện top: star top = (cy + TOP_Y*scale - STAR_R_OUT*scale) >= topMargin
  const cyMinFromTop = topMargin - TOP_Y * baseScale + STAR_R_OUT * baseScale;

  cy = Math.max(cyFromBottom, cyMinFromTop);
  cx = W * 0.5;

  // rebuild outline (vì treeHalfWidth vừa đổi)
  outlineNorm = buildOutlineNormalized();

  outlineN = outlineNorm.length;
  outlineX = new Float32Array(outlineN);
  outlineY = new Float32Array(outlineN);
  for (let i = 0; i < outlineN; i++) {
    outlineX[i] = cx + outlineNorm[i].x * baseScale;
    outlineY[i] = cy + outlineNorm[i].y * baseScale;
  }

  // star đúng đỉnh cây: dùng TOP_Y (không hardcode -0.7 nữa)
  const starCx = cx;
  const starCy = cy + TOP_Y * baseScale;

  const starPts = buildStarPoints(
    starCx,
    starCy,
    baseScale * STAR_R_OUT,
    baseScale * STAR_R_IN,
    5
  );

  starN = starPts.length;
  starX = new Float32Array(starN);
  starY = new Float32Array(starN);
  for (let i = 0; i < starN; i++) {
    starX[i] = starPts[i].x;
    starY[i] = starPts[i].y;
  }
}

function drawGlowPathPartial(X, Y, N, progress, color, baseWidth) {
  const n = Math.max(2, Math.floor((N - 1) * progress) + 1);
  if (n < 2) return;

  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  for (let k = 3; k >= 1; k--) {
    ctx.globalAlpha = 0.1 + k * 0.06;
    ctx.lineWidth = baseWidth + k * 2.6;
    ctx.strokeStyle = color;

    ctx.beginPath();
    ctx.moveTo(X[0], Y[0]);
    for (let i = 1; i < n; i++) ctx.lineTo(X[i], Y[i]);
    ctx.stroke();
  }

  ctx.globalAlpha = 0.95;
  ctx.lineWidth = baseWidth;
  ctx.strokeStyle = color;

  ctx.beginPath();
  ctx.moveTo(X[0], Y[0]);
  for (let i = 1; i < n; i++) ctx.lineTo(X[i], Y[i]);
  ctx.stroke();

  ctx.globalAlpha = 1;
}

function drawWipe(alpha, dir) {
  ctx.save();
  ctx.globalAlpha = alpha;

  const w = W * 1.2;
  const x = dir === 1 ? -w + alpha * w : W - alpha * w;

  const g = ctx.createLinearGradient(x, 0, x + w, 0);
  g.addColorStop(0, "rgba(5,8,20,0)");
  g.addColorStop(0.45, "rgba(5,8,20,0.85)");
  g.addColorStop(1, "rgba(5,8,20,1)");

  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  ctx.restore();
}

function drawCenteredText(line1, line2, alpha, yPx) {
  ctx.save();
  ctx.globalAlpha = alpha;

  ctx.shadowColor = "rgba(245,195,122,0.65)";
  ctx.shadowBlur = 22;

  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // chữ dựa theo min(W,H) để không bị khổng lồ trên màn wide
  const baseSize = Math.max(30, Math.min(86, Math.min(W, H) * 0.085));
  ctx.font = `700 ${baseSize}px "Mountains of Christmas", Georgia, "Times New Roman", serif`;
  ctx.fillText(line1, W / 2, yPx);

  if (line2) {
    ctx.shadowBlur = 14;
    ctx.globalAlpha = alpha * 0.92;
    ctx.fillStyle = "rgba(255,255,255,0.84)";
    ctx.font = `600 ${Math.max(
      14,
      baseSize * 0.42
    )}px system-ui, -apple-system, Segoe UI, Roboto, Arial`;
    ctx.fillText(line2, W / 2, yPx + baseSize * 0.72);
  }

  ctx.restore();
}

// ===== Main loop =====
function loop(now) {
  if (!started) {
    requestAnimationFrame(loop);
    return;
  }

  if (!lastNow) lastNow = now;
  const dt = Math.min(0.033, (now - lastNow) / 1000);
  lastNow = now;

  const t = (now - t0) / 1000;
  const tc = ((t % T_TOTAL) + T_TOTAL) % T_TOTAL;

  fillBackground(t);

  // phase
  let drawP = 0,
    merryA = 0,
    wishA = 0,
    wipeA = 0;

  if (tc < T_DRAW) {
    drawP = easeOutCubic(tc / T_DRAW);
  } else if (tc < T_DRAW + T_HOLD1) {
    drawP = 1;
    const u = (tc - T_DRAW) / T_HOLD1;
    merryA = clamp(u * 1.2, 0, 1);
  } else if (tc < T_DRAW + T_HOLD1 + T_TRANS) {
    drawP = 1;
    wipeA = (tc - (T_DRAW + T_HOLD1)) / T_TRANS;
  } else if (tc < T_DRAW + T_HOLD1 + T_TRANS + T_HOLD2) {
    drawP = 1;
    const u = (tc - (T_DRAW + T_HOLD1 + T_TRANS)) / T_HOLD2;
    wishA = clamp(u * 1.2, 0, 1);
  } else {
    drawP = 1;
    wipeA = (tc - (T_DRAW + T_HOLD1 + T_TRANS + T_HOLD2)) / T_TRANS2;
  }

  // tree + star
  const glowColor = "rgba(245,195,122,1)";
  const lineW = Math.max(2.6, baseScale * 0.01);

  drawGlowPathPartial(outlineX, outlineY, outlineN, drawP, glowColor, lineW);

  const starProg = clamp(drawP * 1.1, 0, 1);
  drawGlowPathPartial(
    starX,
    starY,
    starN,
    starProg,
    glowColor,
    Math.max(2.2, baseScale * 0.008)
  );

  // base line y (xấp xỉ) để đặt smile + text giống ảnh mẫu
  const baseLineY = cy + BOT_Y * baseScale;

  // “smile” ngay dưới base
  if (drawP > 0.83) {
    const u = (drawP - 0.83) / 0.17;
    ctx.save();
    ctx.globalAlpha = 0.25 + 0.65 * u;
    ctx.strokeStyle = "rgba(255,255,255,0.75)";
    ctx.lineWidth = Math.max(2, baseScale * 0.006);
    ctx.beginPath();
    const y = baseLineY + 0.11 * baseScale;
    ctx.arc(cx, y, baseScale * 0.1, 0, Math.PI, false);
    ctx.stroke();
    ctx.restore();
  }

  // TEXT: đặt theo base line (giống mẫu) + clamp để không tụt
  const yText = Math.min(H - 110, baseLineY + 0.3 * baseScale);

  if (merryA > 0) {
    drawCenteredText("Merry Christmas My Princess!!", "", merryA, yText);
  }
  if (wishA > 0) {
    drawCenteredText(
      "Wish you...",
      "Happiness • Health • Success",
      wishA,
      yText
    );
  }

  // wipes
  if (tc >= T_DRAW + T_HOLD1 && tc < T_DRAW + T_HOLD1 + T_TRANS) {
    drawWipe(wipeA, 1);
  }
  if (tc >= T_DRAW + T_HOLD1 + T_TRANS + T_HOLD2) {
    drawWipe(wipeA, -1);
  }

  // fireworks
  updateFireworks(dt);
  drawFireworks();

  requestAnimationFrame(loop);
}

// ===== Start =====
startBtn.addEventListener("click", () => {
  started = true;
  t0 = performance.now();
  lastNow = 0;

  canvas.style.pointerEvents = "auto";
  tryPlayMusic();
  updateMuteIcon();

  startEl.classList.add("hide");
  requestAnimationFrame(loop);
});

canvas.addEventListener("pointerdown", (e) => {
  if (!started) return;
  const rect = canvas.getBoundingClientRect();
  spawnFirework(e.clientX - rect.left, e.clientY - rect.top);
});

// init
resize();
hint("");
