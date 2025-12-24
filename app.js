const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d");
const startEl = document.getElementById("start");
const startBtn = document.getElementById("startBtn");
const msgContainer = document.getElementById("msgContainer");
const messageBox = document.getElementById("messageBox");
const nextMsgBtn = document.getElementById("nextMsgBtn");
const audio = document.getElementById("audio");
const muteBtn = document.getElementById("muteBtn");

let W, H, DPR;
let started = false;
let msgIndex = 0;

// ===== DANH SÁCH LỜI CHÚC (Thêm nhiều hơn) =====
const messages = [
    { l1: "Merry Christmas! 🎄", l2: "Giáng Sinh an lành nhé cậu." },
    { l1: "Tớ có một điều ước nhỏ...", l2: "...là thấy cậu luôn mỉm cười." },
    { l1: "Cảm ơn cậu đã xuất hiện,", l2: "Làm thế giới của tới thêm màu sắc ✨" },
    { l1: "Chúc cậu luôn xinh đẹp,", l2: "Rạng rỡ không chỉ hôm nay mà cả năm tới." },
    { l1: "Nhớ mặc thật ấm nha,", l2: "Đừng để bị cảm lạnh đó! ❄️" },
    { l1: "Mong mọi điều may mắn nhất", l2: "Sẽ đến với cậu trong năm mới." },
    { l1: "Món quà này tớ tự làm,", l2: "Hy vọng cậu sẽ thích nó! ❤️" },
    { l1: "Merry Christmas !!!", l2: "(Bấm vào màn hình thử xem!)" }
];

function showMessage() {
    if(msgIndex >= messages.length) msgIndex = 0;
    const msg = messages[msgIndex];
    messageBox.innerHTML = `<span class="msg-line1">${msg.l1}</span><span class="msg-line2">${msg.l2}</span>`;
    // Hiệu ứng nảy nhẹ khi đổi tin nhắn
    messageBox.style.animation = 'none';
    messageBox.offsetHeight; /* trigger reflow */
    messageBox.style.animation = 'bounceGlow 0.5s ease-out';
}


// ===== HỆ THỐNG 1: CÁC PHẦN TỬ BAY LƯỢN (Background sống động) =====
const floaters = [];
const floaterIcons = ['❄️', '🌟', '🍂', '🌸', '✨', '🍃'];

function initFloaters() {
    floaters.length = 0;
    const count = Math.min(W*H/15000, 60); // Số lượng tùy theo kích thước màn hình
    for(let i=0; i<count; i++) {
        floaters.push({
            x: Math.random() * W,
            y: Math.random() * H,
            speedY: 0.3 + Math.random() * 1.2, // Tốc độ rơi chậm
            speedX: (Math.random() - 0.5) * 0.8, // Bay ngang nhẹ
            size: 12 + Math.random() * 18,
            icon: floaterIcons[Math.floor(Math.random() * floaterIcons.length)],
            rot: Math.random() * Math.PI * 2,
            rotSpeed: (Math.random() - 0.5) * 0.05,
            opacity: 0.4 + Math.random()*0.4
        });
    }
}

function drawFloaters() {
    ctx.save();
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    floaters.forEach(f => {
        f.y += f.speedY; f.x += f.speedX + Math.sin(f.y*0.02)*0.3; f.rot += f.rotSpeed;
        if(f.y > H + 30) { f.y = -30; f.x = Math.random() * W; } // Lặp lại khi rơi xuống đáy
        if(f.x > W+30) f.x = -30; if(f.x < -30) f.x = W+30;

        ctx.globalAlpha = f.opacity;
        ctx.font = `${f.size}px serif`;
        ctx.translate(f.x, f.y); ctx.rotate(f.rot);
        ctx.fillText(f.icon, 0, 0);
        ctx.rotate(-f.rot); ctx.translate(-f.x, -f.y);
    });
    ctx.restore();
}


// ===== HỆ THỐNG 2: PHÁO HOA (Click hiệu ứng) =====
const fireworks = [];
function spawnFirework(x, y) {
  const colors = ['#ffc0cb', '#f5c37a', '#87ceeb', '#ffd700', '#ff69b4'];
  const particleCount = 30 + Math.random()*20;
  for(let i=0; i<particleCount; i++) {
    const a = Math.random()*Math.PI*2, s = Math.random()*4+2;
    fireworks.push({
        x, y, 
        vx: Math.cos(a)*s, vy: Math.sin(a)*s, 
        life: 1, decay: 0.015 + Math.random()*0.02,
        color: colors[Math.floor(Math.random()*colors.length)],
        size: 2 + Math.random()*3
    });
  }
}
function drawFireworks() {
    fireworks.forEach((p,i) => {
        p.x+=p.vx; p.y+=p.vy; p.vy+=0.08; // Trọng lực
        p.life -= p.decay;
        ctx.globalAlpha = p.life; ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size*p.life, 0, Math.PI*2); ctx.fill();
        if(p.life<=0) fireworks.splice(i,1);
    });
    ctx.globalAlpha=1;
}


// ===== HỆ THỐNG 3: CÂY THÔNG SINH ĐỘNG (Thêm quả châu) =====
let treeScale, cx, cy, treePath = [], ornaments = [];

function buildTreeGeometry() {
  treeScale = Math.min(W, H) * 0.5; cx = W/2; cy = H * 0.6;
  treePath = []; ornaments = [];

  // Hàm tạo dáng cây bầu bĩnh
  const wFn = t => {
      const b = 0.05 + 0.35*Math.pow(t,0.9);
      const n = 0.15*Math.exp(-Math.pow((t-0.3)/0.1,2)) + 0.3*Math.exp(-Math.pow((t-0.7)/0.15,2));
      return Math.max(0.05, b + n - 0.08*Math.exp(-Math.pow((t-0.55)/0.08,2)));
  };

  // Tạo đường viền
  for(let i=0; i<=120; i++){ let t=i/120; treePath.push({x:cx-wFn(t)*treeScale,y:cy+(-0.65+1.1*t)*treeScale}); }
  for(let i=0; i<=60; i++){ let u=i/60; treePath.push({x:cx+(-wFn(1)*1.5+wFn(1)*3*u)*treeScale,y:cy+(0.45+0.04*Math.sin(u*Math.PI))*treeScale}); }
  for(let i=0; i<=120; i++){ let t=i/120; treePath.push({x:cx+wFn(1-t)*treeScale,y:cy+(-0.65+1.1*(1-t))*treeScale}); }

  // Tạo quả châu trang trí (Ornaments)
  for(let i=0; i<40; i++) {
      const t = Math.random()*0.85 + 0.1; // Vị trí dọc thân cây
      const side = Math.random() > 0.5 ? 1 : -1;
      const w = wFn(t) * treeScale * (0.2 + Math.random()*0.7); // Vị trí ngang bên trong
      ornaments.push({
          x: cx + w*side, 
          y: cy + (-0.65 + 1.1*t)*treeScale,
          r: 4 + Math.random()*5,
          hue: Math.random()*360,
          phase: Math.random()*Math.PI*2
      });
  }
}

function drawTree(now) {
    // Vẽ đường viền phát sáng
    ctx.strokeStyle = "#f5c37a"; ctx.lineWidth = 5; ctx.lineCap = "round";
    ctx.shadowColor = "#ffc0cb"; ctx.shadowBlur = 30;
    ctx.beginPath(); ctx.moveTo(treePath[0].x, treePath[0].y);
    treePath.forEach(p => ctx.lineTo(p.x, p.y)); ctx.stroke(); ctx.shadowBlur = 0;

    // Vẽ ngôi sao đỉnh
    ctx.fillStyle="#ffd700"; ctx.shadowColor="#ffd700"; ctx.shadowBlur=40;
    drawStar(cx, cy-0.65*treeScale, 5, treeScale*0.12, treeScale*0.06); ctx.fill(); ctx.shadowBlur=0;

    // Vẽ quả châu nhấp nháy
    ornaments.forEach(o => {
        const flicker = 0.6 + 0.4*Math.sin(now*0.004 + o.phase);
        ctx.fillStyle = `hsla(${o.hue}, 80%, 60%, ${flicker})`;
        ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 15*flicker;
        ctx.beginPath(); ctx.arc(o.x, o.y, o.r, 0, Math.PI*2); ctx.fill();
    });
    ctx.shadowBlur=0;
}
function drawStar(cx,cy,spikes,r0,r1){ctx.beginPath();let rot=Math.PI/2*3,x,y,step=Math.PI/spikes;for(let i=0;i<spikes;i++){x=cx+Math.cos(rot)*r0;y=cy+Math.sin(rot)*r0;ctx.lineTo(x,y);rot+=step;x=cx+Math.cos(rot)*r1;y=cy+Math.sin(rot)*r1;ctx.lineTo(x,y);rot+=step;}ctx.lineTo(cx,cy-r0);ctx.closePath();}


// ===== VÒNG LẶP CHÍNH =====
function loop(now) {
  ctx.clearRect(0,0,W,H);
  if(started) {
      drawFloaters(now);   // 1. Vẽ nền bay lượn
      drawTree(now);       // 2. Vẽ cây sinh động
      drawFireworks();     // 3. Vẽ pháo hoa (nếu có)
  }
  requestAnimationFrame(loop);
}


// ===== XỬ LÝ SỰ KIỆN =====
function resize() {
  W = window.innerWidth; H = window.innerHeight;
  DPR = Math.min(2, window.devicePixelRatio||1);
  canvas.width = W*DPR; canvas.height = H*DPR; ctx.scale(DPR, DPR);
  buildTreeGeometry(); initFloaters();
}

startBtn.addEventListener("click", () => {
  started = true;
  startEl.classList.add("hide");
  msgContainer.classList.remove("hide");
  showMessage(); // Hiện tin nhắn đầu tiên
  audio.play().catch(()=>{});
  spawnFirework(W/2, H/2); // Bắn pháo hoa mở màn
});

nextMsgBtn.addEventListener("click", (e) => {
    e.stopPropagation(); // Ngăn không cho click xuyên qua canvas
    msgIndex++; 
    showMessage();
    spawnFirework(W/2, H*0.8); // Pháo hoa khi chuyển tin
});

// Click vào canvas để bắn pháo hoa
canvas.addEventListener("pointerdown", e => spawnFirework(e.clientX, e.clientY));
muteBtn.addEventListener("click", () => { audio.muted = !audio.muted; muteBtn.textContent = audio.muted ? "🔇" : "🔊"; });

window.addEventListener("resize", resize);
resize();
requestAnimationFrame(loop);