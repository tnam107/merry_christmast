const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d", { alpha: true });
const startEl = document.getElementById("start");
const startBtn = document.getElementById("startBtn");
const audio = document.getElementById("audio");
const vol = document.getElementById("vol");
const muteBtn = document.getElementById("muteBtn");

// ===== LỜI CHÚC (NHẸ NHÀNG, TINH TẾ) =====
const messages = [
  { line1: "Merry Christmas! 🎄", line2: "Giáng Sinh vui vẻ và ấm áp nhé cậu." },
  { line1: "Tớ thấy rất vui...", line2: "...vì mùa Noel này có thêm một người bạn như cậu." },
  { line1: "Chúc cậu luôn rạng rỡ,", line2: "Lúc nào cũng giữ được nụ cười trên môi nhé." },
  { line1: "Cảm ơn cậu rất nhiều,", line2: "Vì đã luôn mang lại năng lượng tích cực cho tớ." },
  { line1: "Dù bận rộn đến mấy,", line2: "Cũng nhớ dành thời gian để yêu chiều bản thân mình nha." },
  { line1: "Mong là món quà nhỏ này...", line2: "...có thể làm cậu mỉm cười một chút. ✨" }
];

const T_DRAW = 4.4, T_HOLD_MSG = 3.8, T_TRANS_MSG = 1.0;
const T_TOTAL = T_DRAW + (T_HOLD_MSG + T_TRANS_MSG) * messages.length;
let started = false, t0 = 0, lastNow = 0;
const TOP_Y = -0.6, BOT_Y = 0.48, STAR_R_OUT = 0.085, STAR_R_IN = 0.037;

// Resize
let W, H, DPR;
function resize() {
  DPR = Math.min(2, window.devicePixelRatio || 1);
  W = window.innerWidth; H = window.innerHeight;
  canvas.width = Math.floor(W * DPR); canvas.height = Math.floor(H * DPR);
  canvas.style.width = W + "px"; canvas.style.height = H + "px";
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  buildSceneGeometry();
}
window.addEventListener("resize", resize);

// Background Stars
const bgStars = new Float32Array(240 * 4);
for(let i=0; i<240; i++) {
  bgStars[i*4+0] = Math.random(); bgStars[i*4+1] = Math.random();
  bgStars[i*4+2] = 0.6 + Math.random()*1.6; bgStars[i*4+3] = 0.2 + Math.random()*0.5;
}

function fillBackground(t) {
  const g = ctx.createRadialGradient(W*0.3, H*0.2, 0, W*0.3, H*0.2, Math.max(W,H)*0.95);
  g.addColorStop(0, "#1b2550"); g.addColorStop(1, "#050814");
  ctx.fillStyle = g; ctx.fillRect(0,0,W,H);
  for(let i=0; i<240; i++) {
    const tw = 0.5 + 0.5 * Math.sin(t * 1.2 + bgStars[i*4]);
    ctx.globalAlpha = bgStars[i*4+3] * tw; ctx.fillStyle = "#fff";
    ctx.fillRect(bgStars[i*4]*W, bgStars[i*4+1]*H, bgStars[i*4+2], bgStars[i*4+2]);
  }
  ctx.globalAlpha = 1;
}

// Tree Geometry
function treeHalfWidth(t) {
  const base = 0.035 + 0.3 * Math.pow(t, 0.92);
  const b = 0.11 * Math.exp(-Math.pow((t-0.34)/0.1, 2)) + 0.26 * Math.exp(-Math.pow((t-0.74)/0.14, 2));
  return Math.max(0.04, base + b - 0.07 * Math.exp(-Math.pow((t-0.56)/0.07, 2)));
}

let outlineX, outlineY, outlineN, starX, starY, starN, baseScale, cx, cy;
function buildSceneGeometry() {
  baseScale = Math.min(W, H) * 0.5; cx = W * 0.5; cy = H * 0.6;
  const pts = [];
  for(let i=0; i<=200; i++) { let t=i/200; pts.push({x: -treeHalfWidth(t)*baseScale, y: (TOP_Y + (BOT_Y-TOP_Y)*t)*baseScale}); }
  for(let i=0; i<=100; i++) { let u=i/100; pts.push({x: (-treeHalfWidth(1)*1.6 + treeHalfWidth(1)*3.2*u)*baseScale, y: (BOT_Y + 0.02*Math.sin(u*Math.PI))*baseScale}); }
  for(let i=0; i<=200; i++) { let t=i/200; pts.push({x: treeHalfWidth(1-t)*baseScale, y: (BOT_Y + (TOP_Y-BOT_Y)*t)*baseScale}); }
  outlineN = pts.length; outlineX = new Float32Array(outlineN); outlineY = new Float32Array(outlineN);
  pts.forEach((p, i) => { outlineX[i] = cx + p.x; outlineY[i] = cy + p.y; });

  const sPts = []; const step = Math.PI/5; const sCx = cx, sCy = cy + TOP_Y*baseScale;
  for(let i=0; i<11; i++) { const r = (i%2===0 ? STAR_R_OUT : STAR_R_IN)*baseScale; sPts.push({x: sCx + Math.cos(-Math.PI/2 + i*step)*r, y: sCy + Math.sin(-Math.PI/2 + i*step)*r}); }
  starN = sPts.length; starX = new Float32Array(starN); starY = new Float32Array(starN);
  sPts.forEach((p, i) => { starX[i] = p.x; starY[i] = p.y; });
}

function drawPath(X, Y, N, prog, color, lw) {
  const n = Math.floor((N-1)*prog); if(n<2) return;
  ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.lineCap = "round";
  ctx.shadowColor = color; ctx.shadowBlur = 10;
  ctx.beginPath(); ctx.moveTo(X[0], Y[0]);
  for(let i=1; i<=n; i++) ctx.lineTo(X[i], Y[i]);
  ctx.stroke(); ctx.shadowBlur = 0;
}

function drawCenteredText(l1, l2, a, y) {
  ctx.save(); ctx.globalAlpha = a; ctx.textAlign = "center"; ctx.fillStyle = "#fff";
  ctx.shadowColor = "rgba(245, 195, 122, 0.8)"; ctx.shadowBlur = 20;
  const s1 = Math.max(30, W*0.06); ctx.font = `600 ${s1}px 'Dancing Script', cursive`;
  ctx.fillText(l1, W/2, y);
  if(l2) {
    ctx.font = `400 ${s1*0.4}px system-ui`; ctx.globalAlpha = a*0.7;
    ctx.fillText(l2, W/2, y + s1*0.8);
  }
  ctx.restore();
}

// Fireworks
const fireworks = [];
function spawnFirework(x, y) {
  const parts = []; const hue = Math.random()*360;
  for(let i=0; i<80; i++) {
    const a = Math.random()*Math.PI*2, s = 2 + Math.random()*4;
    parts.push({x, y, vx: Math.cos(a)*s, vy: Math.sin(a)*s, age: 0, life: 60+Math.random()*40});
  }
  fireworks.push({parts, hue});
}

function loop(now) {
  if(!started) { requestAnimationFrame(loop); return; }
  const dt = (now - (lastNow || now))/1000; lastNow = now;
  const tc = ((now - t0)/1000) % T_TOTAL;
  fillBackground(now/1000);

  let drawP = 1, msgIdx = -1, msgA = 0;
  if(tc < T_DRAW) drawP = tc/T_DRAW;
  else {
    const tM = tc - T_DRAW, cyc = T_HOLD_MSG + T_TRANS_MSG;
    msgIdx = Math.floor(tM/cyc);
    const tIn = tM % cyc;
    if(tIn < T_HOLD_MSG) msgA = Math.min(1, tIn*1.5) * Math.min(1, (T_HOLD_MSG-tIn)*2);
  }

  const col = "#f5c37a";
  drawPath(outlineX, outlineY, outlineN, drawP, col, 2.5);
  drawPath(starX, starY, starN, Math.min(1, drawP*1.2), col, 2);

  if(msgIdx >= 0 && msgIdx < messages.length) {
    drawCenteredText(messages[msgIdx].line1, messages[msgIdx].line2, msgA, H*0.8);
  }

  fireworks.forEach((fw, i) => {
    fw.parts.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.vy += 0.05; p.age++;
      ctx.globalAlpha = (fw.parts[0].life - p.age)/fw.parts[0].life;
      ctx.fillStyle = `hsl(${fw.hue}, 80%, 70%)`;
      ctx.fillRect(p.x, p.y, 2, 2);
    });
    if(fw.parts[0].age > fw.parts[0].life) fireworks.splice(i, 1);
  });

  requestAnimationFrame(loop);
}

startBtn.addEventListener("click", () => {
  started = true; t0 = performance.now(); startEl.classList.add("hide");
  audio.play(); requestAnimationFrame(loop);
});
canvas.addEventListener("pointerdown", e => spawnFirework(e.clientX, e.clientY));
resize();