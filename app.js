const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d");
const startEl = document.getElementById("start");
const startBtn = document.getElementById("startBtn");
const nextMsgBtn = document.getElementById("nextMsgBtn"); // Nút bấm mới
const audio = document.getElementById("audio");
const vol = document.getElementById("vol");
const muteBtn = document.getElementById("muteBtn");

// ===== CẤU HÌNH =====
// Danh sách lời chúc (Đã thêm nhiều hơn)
const messages = [
  { l1: "Merry Christmas! 🎄", l2: "Giáng Sinh vui vẻ nha cậu." },
  { l1: "Tớ có một điều ước nhỏ...", l2: "...là cậu luôn được hạnh phúc." },
  { l1: "Cảm ơn cậu vì đã xuất hiện", l2: "và làm thế giới của tớ rực rỡ hơn. ✨" },
  { l1: "Chúc cậu xinh đẹp, rạng rỡ", l2: "Không chỉ Noel mà cả năm luôn nhé!" },
  { l1: "Đừng quên mặc ấm nha,", l2: "Trời lạnh lắm đó! ❄️" },
  { l1: "Mong mọi điều tốt đẹp nhất", l2: "sẽ đến với cậu trong năm mới." },
  { l1: "Món quà này tớ code tặng cậu", l2: "Hy vọng cậu sẽ thích nó! ❤️" },
  { l1: "Merry Christmas My Crush!", l2: "(Cậu cười lên xinh lắm á!)" }
];

let started = false;
let msgIndex = 0; // Biến theo dõi tin nhắn hiện tại (không dùng thời gian nữa)
let W, H, DPR;

// ===== HỆ THỐNG "BAY NHẢY" (Hovering Elements) =====
const floaters = [];
const floaterIcons = ['❄️', '🌟', '🍂', '🌸', '✨'];

function initFloaters() {
    floaters.length = 0;
    const count = 50; // Số lượng phần tử bay
    for(let i=0; i<count; i++) {
        floaters.push({
            x: Math.random() * W,
            y: Math.random() * H,
            speedY: 0.5 + Math.random() * 1.5, // Tốc độ rơi
            speedX: (Math.random() - 0.5) * 1, // Tốc độ bay ngang
            size: 10 + Math.random() * 20,
            icon: floaterIcons[Math.floor(Math.random() * floaterIcons.length)],
            rot: Math.random() * Math.PI * 2,
            rotSpeed: (Math.random() - 0.5) * 0.1
        });
    }
}

function updateAndDrawFloaters() {
    ctx.save();
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    floaters.forEach(f => {
        // Cập nhật vị trí
        f.y += f.speedY;
        f.x += f.speedX + Math.sin(f.y * 0.01) * 0.5; // Bay lượn sóng nhẹ
        f.rot += f.rotSpeed;

        // Lặp lại khi ra khỏi màn hình
        if(f.y > H + 50) { f.y = -50; f.x = Math.random() * W; }
        if(f.x > W + 50) f.x = -50;
        if(f.x < -50) f.x = W + 50;

        // Vẽ
        ctx.font = `${f.size}px serif`;
        ctx.globalAlpha = 0.6;
        ctx.translate(f.x, f.y);
        ctx.rotate(f.rot);
        ctx.fillText(f.icon, 0, 0);
        ctx.rotate(-f.rot);
        ctx.translate(-f.x, -f.y);
    });
    ctx.restore();
}


// ===== CÂY THÔNG SINH ĐỘNG HƠN =====
let baseScale, cx, cy;
let treePath = [];
let ornaments = []; // Danh sách các quả châu trang trí

function buildTree() {
  baseScale = Math.min(W, H) * 0.55; cx = W/2; cy = H * 0.65;
  treePath = [];
  
  // Hàm tạo dáng cây (đã điều chỉnh cho bầu bĩnh hơn chút)
  const widthFn = t => {
      const base = 0.04 + 0.35 * Math.pow(t, 0.9);
      const notches = 0.15 * Math.exp(-Math.pow((t-0.3)/0.1,2)) + 0.3 * Math.exp(-Math.pow((t-0.7)/0.15,2));
      return Math.max(0.04, base + notches - 0.08*Math.exp(-Math.pow((t-0.55)/0.08,2)));
  };

  // Xây dựng đường viền cây
  for(let i=0; i<=150; i++) { let t=i/150; treePath.push({x: cx - widthFn(t)*baseScale, y: cy + (-0.65 + 1.1*t)*baseScale}); }
  for(let i=0; i<=80; i++) { let u=i/80; treePath.push({x: cx + (-widthFn(1)*1.5 + widthFn(1)*3.0*u)*baseScale, y: cy + (0.45 + 0.03*Math.sin(u*Math.PI))*baseScale}); }
  for(let i=0; i<=150; i++) { let t=i/150; treePath.push({x: cx + widthFn(1-t)*baseScale, y: cy + (-0.65 + 1.1*(1-t))*baseScale}); }

  // Tạo quả châu trang trí ngẫu nhiên trên thân cây
  ornaments = [];
  for(let i=0; i<35; i++) {
      let t = Math.random() * 0.9 + 0.05; // Vị trí dọc theo cây (tránh đỉnh và đáy quá sát)
      let w = widthFn(t) * baseScale * (Math.random()*0.8); // Vị trí ngang ngẫu nhiên bên trong cây
      let xStr = Math.random() > 0.5 ? 1 : -1;
      ornaments.push({
          x: cx + w * xStr,
          y: cy + (-0.65 + 1.1*t)*baseScale,
          r: 3 + Math.random()*5, // Kích thước
          color: `hsl(${Math.random()*360}, 80%, 60%)`, // Màu ngẫu nhiên
          phase: Math.random() * Math.PI * 2 // Pha nhấp nháy
      });
  }
}

function drawTree(now) {
    // Vẽ cây phát sáng
    ctx.strokeStyle = "#f5c37a"; ctx.lineWidth = 4; ctx.lineCap = "round";
    ctx.shadowColor = "#ffc0cb"; ctx.shadowBlur = 25;
    ctx.beginPath(); ctx.moveTo(treePath[0].x, treePath[0].y);
    treePath.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.stroke(); ctx.shadowBlur = 0;

    // Vẽ ngôi sao đỉnh
    const topY = cy - 0.65*baseScale;
    ctx.fillStyle = "#ffd700"; ctx.shadowColor="#ffd700"; ctx.shadowBlur=30;
    drawStar(cx, topY, 5, baseScale*0.1, baseScale*0.05);
    ctx.fill(); ctx.shadowBlur=0;

    // Vẽ quả châu trang trí (nhấp nháy)
    ornaments.forEach(o => {
        const intensity = 0.5 + 0.5 * Math.sin(now * 0.003 + o.phase);
        ctx.globalAlpha = 0.8 + 0.2*intensity;
        ctx.fillStyle = o.color;
        ctx.shadowColor = o.color;
        ctx.shadowBlur = 10 * intensity;
        ctx.beginPath(); ctx.arc(o.x, o.y, o.r, 0, Math.PI*2); ctx.fill();
    });
    ctx.globalAlpha = 1; ctx.shadowBlur=0;
}
function drawStar(cx,cy,spikes,r0,r1){ctx.beginPath();let rot=Math.PI/2*3,x=cx,y=cy,step=Math.PI/spikes;for(let i=0;i<spikes;i++){x=cx+Math.cos(rot)*r0;y=cy+Math.sin(rot)*r0;ctx.lineTo(x,y);rot+=step;x=cx+Math.cos(rot)*r1;y=cy+Math.sin(rot)*r1;ctx.lineTo(x,y);rot+=step;}ctx.lineTo(cx,cy-r0);ctx.closePath();}


// ===== VẼ CHỮ (Font mới & Logic mới) =====
function drawMessage() {
    if(msgIndex >= messages.length) msgIndex = 0; // Lặp lại khi hết
    const msg = messages[msgIndex];

    ctx.save(); ctx.textAlign = "center"; 
    ctx.shadowColor = "rgba(0,0,0,0.5)"; ctx.shadowBlur = 5;

    // Dùng font Mountains of Christmas cho đồng bộ và đẹp
    const s1 = Math.min(60, W*0.1); 
    ctx.font = `${s1}px 'Mountains of Christmas', cursive`;
    ctx.fillStyle = "#f5c37a"; // Màu vàng sáng
    ctx.fillText(msg.l1, W/2, H*0.82);

    if(msg.l2) {
      ctx.font = `${s1*0.6}px 'Mountains of Christmas', cursive`;
      ctx.fillStyle = "#fff";
      ctx.fillText(msg.l2, W/2, H*0.82 + s1*0.9);
    }
    ctx.restore();
}


// ===== PHÁO HOA (Hiệu ứng click) =====
const fireworks = [];
function spawnFirework(x, y) {
  const colors = ['#ffc0cb', '#f5c37a', '#e0f7fa', '#ffd700'];
  const color = colors[Math.floor(Math.random()*colors.length)];
  for(let i=0; i<40; i++) {
    const a = Math.random()*Math.PI*2, s = Math.random()*5+2;
    fireworks.push({x, y, vx:Math.cos(a)*s, vy:Math.sin(a)*s, life:1, color});
  }
}
function updateDrawFireworks() {
    fireworks.forEach((p,i) => {
        p.x+=p.vx; p.y+=p.vy; p.vy+=0.05; p.life-=0.02;
        ctx.globalAlpha=p.life; ctx.fillStyle=p.color;
        ctx.beginPath(); ctx.arc(p.x,p.y,3*p.life,0,Math.PI*2); ctx.fill();
        if(p.life<=0) fireworks.splice(i,1);
    });
    ctx.globalAlpha=1;
}


// ===== VÒNG LẶP CHÍNH =====
function loop(now) {
  ctx.clearRect(0,0,W,H); // Xóa canvas để lộ background ảnh bên dưới
  
  if(started) {
      updateAndDrawFloaters(); // Vẽ các icon bay
      drawTree(now);          // Vẽ cây sinh động
      drawMessage();          // Vẽ tin nhắn hiện tại
      updateDrawFireworks();  // Vẽ pháo hoa nếu có click
  }

  requestAnimationFrame(loop);
}


// ===== SỰ KIỆN & KHỞI TẠO =====
function resize() {
  DPR = window.devicePixelRatio || 1;
  W = window.innerWidth; H = window.innerHeight;
  canvas.width = W * DPR; canvas.height = H * DPR;
  ctx.scale(DPR, DPR);
  buildTree();
  initFloaters();
}

// Click nút BẮT ĐẦU
startBtn.addEventListener("click", () => {
  started = true;
  startEl.classList.add("hide");
  nextMsgBtn.classList.remove("hide"); // Hiện nút chuyển tin nhắn
  audio.play().catch(()=>console.log("Cần tương tác để phát nhạc"));
});

// Click nút CHUYỂN TIN NHẮN (Mới)
nextMsgBtn.addEventListener("click", () => {
    msgIndex++; // Tăng index để sang câu tiếp theo
    spawnFirework(W/2, H*0.8); // Bắn pháo hoa nhỏ khi chuyển câu
});

// Click màn hình bắn pháo hoa
canvas.addEventListener("pointerdown", e => spawnFirework(e.clientX, e.clientY));

// Âm thanh
audio.loop = true; audio.volume = 0.7;
vol.addEventListener("input", () => audio.volume = vol.value);
muteBtn.addEventListener("click", () => audio.muted = !audio.muted);

window.addEventListener("resize", resize);
resize();
requestAnimationFrame(loop);