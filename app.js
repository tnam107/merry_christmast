/**
 * MERRY CHRISTMAS APP - ULTIMATE VERSION
 * Code by: Your AI Assistant
 * Logic: Object Oriented Programming (OOP) for stability and performance.
 */

// --- CẤU HÌNH ---
const CONFIG = {
    fireworkChance: 0.05, // Tỷ lệ tự nổ pháo hoa
    particleCount: 40,    // Số hạt pháo hoa mỗi lần nổ
    floaterCount: 60,     // Số lượng vật thể bay (hoa, lá, tuyết)
    treeColor: '#f5c37a', // Màu cây
    ornamentCount: 45,    // Số quả châu trên cây
};

// --- DANH SÁCH LỜI CHÚC (Thêm nhiều câu hơn) ---
const MESSAGES = [
    { l1: "Merry Christmas! 🎄", l2: "Chúc cậu một mùa Giáng Sinh ấm áp." },
    { l1: "Tớ muốn nói là...", l2: "...cậu thực sự rất đặc biệt với tớ." },
    { l1: "Cảm ơn cậu nhé,", l2: "Vì đã xuất hiện và làm thế giới này rạng rỡ hơn ✨" },
    { l1: "Chúc cậu luôn vui vẻ,", l2: "Nụ cười của cậu đẹp như pháo hoa vậy!" },
    { l1: "Nhớ giữ ấm nha,", l2: "Đừng để bị ốm đấy, tớ lo. ❄️" },
    { l1: "Năm mới sắp đến rồi,", l2: "Mong mọi điều may mắn sẽ gõ cửa nhà cậu." },
    { l1: "Món quà nhỏ này...", l2: "...chứa đựng rất nhiều tình cảm của tớ." },
    { l1: "Đừng buồn phiền nhé,", l2: "Vì luôn có tớ ở đây ủng hộ cậu." },
    { l1: "Giáng Sinh an lành!", l2: "Mãi xinh đẹp và hạnh phúc như này nhé! ❤️" },
    { l1: "Hết rồi á?", l2: "Chưa đâu, bấm tiếp đi nào! 😜" },
    { l1: "Yêu đời lên nhé!", l2: "Merry Christmas My Crush!" }
];

// --- CLASSES (CÁC LỚP ĐỐI TƯỢNG) ---

/**
 * Lớp quản lý Vật thể bay (Hoa, Lá, Tuyết, Sao)
 */
class Floater {
    constructor(w, h) {
        this.icons = ['❄️', '🌟', '🍂', '🌸', '✨', '🍀', '🍁'];
        this.reset(w, h);
    }

    reset(w, h) {
        this.x = Math.random() * w;
        this.y = Math.random() * h;
        this.vx = (Math.random() - 0.5) * 1.5; // Tốc độ ngang
        this.vy = 0.5 + Math.random() * 1.5;   // Tốc độ rơi
        this.size = 12 + Math.random() * 20;   // Kích thước ngẫu nhiên
        this.icon = this.icons[Math.floor(Math.random() * this.icons.length)];
        this.rotation = Math.random() * Math.PI * 2;
        this.rotSpeed = (Math.random() - 0.5) * 0.05;
        this.opacity = 0.3 + Math.random() * 0.7;
    }

    update(w, h) {
        this.x += this.vx + Math.sin(this.y * 0.01) * 0.5; // Bay lượn sóng
        this.y += this.vy;
        this.rotation += this.rotSpeed;

        // Nếu rơi quá màn hình thì reset lên trên
        if (this.y > h + 30) {
            this.y = -30;
            this.x = Math.random() * w;
        }
        if (this.x > w + 30) this.x = -30;
        if (this.x < -30) this.x = w + 30;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.font = `${this.size}px Arial`; // Dùng font Arial cho icon hiển thị chuẩn
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(this.icon, 0, 0);
        ctx.restore();
    }
}

/**
 * Lớp quản lý Hạt pháo hoa
 */
class FireworkParticle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 4 + 2;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.life = 1.0; // Tuổi thọ (1.0 -> 0.0)
        this.decay = 0.015 + Math.random() * 0.02; // Tốc độ mờ
        this.color = color;
        this.gravity = 0.08;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity; // Chịu ảnh hưởng trọng lực
        this.vx *= 0.98; // Lực cản không khí
        this.vy *= 0.98;
        this.life -= this.decay;
    }

    draw(ctx) {
        if (this.life <= 0) return;
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

/**
 * Lớp Cây Thông (Tính toán hình học phức tạp)
 */
class ChristmasTree {
    constructor() {
        this.path = [];
        this.ornaments = [];
        this.widthFn = (t) => {
            // Hàm tính độ rộng thân cây theo chiều cao t (0->1)
            // Tạo dáng cây có eo và phình ra (3 tầng lá)
            const base = 0.1 + 0.4 * Math.pow(t, 0.8);
            const notches = 0.15 * Math.exp(-Math.pow((t - 0.3) / 0.1, 2)) +
                            0.25 * Math.exp(-Math.pow((t - 0.7) / 0.15, 2));
            return base + notches;
        };
    }

    // Tính toán lại dáng cây dựa trên kích thước màn hình
    rebuild(w, h) {
        // Cây chiếm khoảng không gian ở giữa, chừa chỗ cho UI bên dưới
        const availableHeight = h - 220; // Trừ đi phần nút bấm
        this.scale = Math.min(w * 0.5, availableHeight) * 0.85;
        this.cx = w / 2;
        this.cy = (h - 220) * 0.75; // Đặt gốc cây

        this.path = [];
        // Tính toán tọa độ viền trái
        for (let i = 0; i <= 100; i++) {
            const t = i / 100;
            const x = this.cx - this.widthFn(t) * this.scale * 0.5;
            const y = this.cy + (-0.8 + 1.2 * t) * this.scale;
            this.path.push({ x, y });
        }
        // Tính toán đáy cây (cong nhẹ)
        for (let i = 0; i <= 40; i++) {
            const u = i / 40;
            const x = this.cx + (-this.widthFn(1) * 0.5 + this.widthFn(1) * u) * this.scale;
            const y = this.cy + (0.4 + 0.05 * Math.sin(u * Math.PI)) * this.scale;
            this.path.push({ x, y });
        }
        // Tính toán viền phải
        for (let i = 0; i <= 100; i++) {
            const t = i / 100;
            const x = this.cx + this.widthFn(1 - t) * this.scale * 0.5;
            const y = this.cy + (-0.8 + 1.2 * (1 - t)) * this.scale;
            this.path.push({ x, y });
        }

        // Tạo lại vị trí các quả châu
        this.ornaments = [];
        for (let i = 0; i < CONFIG.ornamentCount; i++) {
            const t = 0.1 + Math.random() * 0.8;
            const side = Math.random() > 0.5 ? 1 : -1;
            const w = this.widthFn(t) * this.scale * 0.5 * (0.2 + Math.random() * 0.6);
            this.ornaments.push({
                x: this.cx + w * side,
                y: this.cy + (-0.8 + 1.2 * t) * this.scale,
                r: 3 + Math.random() * 5,
                color: `hsl(${Math.random() * 360}, 80%, 60%)`,
                phase: Math.random() * Math.PI * 2
            });
        }
    }

    draw(ctx, time) {
        // Vẽ dây đèn Neon (Viền cây)
        ctx.save();
        ctx.strokeStyle = CONFIG.treeColor;
        ctx.lineWidth = 4;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.shadowColor = "#ffc0cb";
        ctx.shadowBlur = 20;

        ctx.beginPath();
        if (this.path.length > 0) {
            ctx.moveTo(this.path[0].x, this.path[0].y);
            for (let i = 1; i < this.path.length; i++) {
                ctx.lineTo(this.path[i].x, this.path[i].y);
            }
        }
        ctx.stroke();
        ctx.restore();

        // Vẽ Ngôi sao đỉnh
        if (this.path.length > 0) {
            const topY = this.path[0].y;
            this.drawStar(ctx, this.cx, topY, 5, this.scale * 0.12, this.scale * 0.06);
        }

        // Vẽ quả châu nhấp nháy
        this.ornaments.forEach(o => {
            const alpha = 0.5 + 0.5 * Math.sin(time * 0.005 + o.phase);
            ctx.save();
            ctx.fillStyle = o.color;
            ctx.globalAlpha = alpha;
            ctx.shadowColor = o.color;
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
    }

    drawStar(ctx, cx, cy, spikes, r0, r1) {
        ctx.save();
        ctx.fillStyle = "#ffd700";
        ctx.shadowColor = "#ffd700";
        ctx.shadowBlur = 40;
        ctx.beginPath();
        let rot = Math.PI / 2 * 3;
        let x = cx;
        let y = cy;
        let step = Math.PI / spikes;

        ctx.moveTo(cx, cy - r0);
        for (let i = 0; i < spikes; i++) {
            x = cx + Math.cos(rot) * r0;
            y = cy + Math.sin(rot) * r0;
            ctx.lineTo(x, y);
            rot += step;

            x = cx + Math.cos(rot) * r1;
            y = cy + Math.sin(rot) * r1;
            ctx.lineTo(x, y);
            rot += step;
        }
        ctx.lineTo(cx, cy - r0);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }
}

// --- MAIN APPLICATION LOGIC ---

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const uiIntro = document.getElementById('intro-screen');
const uiMain = document.getElementById('main-ui');
const msgContent = document.getElementById('message-content');
const audio = document.getElementById('bg-music');
const btnMute = document.getElementById('btn-mute');

let width, height, pixelRatio;
let animationId;
let msgIndex = 0;
let isPlaying = false;

// Khởi tạo các đối tượng
const tree = new ChristmasTree();
const floaters = [];
const fireworks = [];

// Hàm khởi tạo hệ thống
function init() {
    resize();
    window.addEventListener('resize', resize);
    
    // Tạo các vật thể bay
    for(let i=0; i<CONFIG.floaterCount; i++) {
        floaters.push(new Floater(width, height));
    }

    // Sự kiện nút
    document.getElementById('btn-start').addEventListener('click', startGame);
    document.getElementById('btn-next').addEventListener('click', (e) => {
        e.stopPropagation(); // Ngăn click xuyên xuống canvas
        nextMessage();
        createFirework(width/2, height * 0.3); // Nổ pháo hoa trên cao
    });

    document.getElementById('btn-mute').addEventListener('click', () => {
        audio.muted = !audio.muted;
        btnMute.textContent = audio.muted ? '🔇' : '🔊';
    });

    // Click vào canvas nổ pháo hoa
    canvas.addEventListener('mousedown', (e) => {
        createFirework(e.clientX, e.clientY);
    });
    
    // Support mobile touch
    canvas.addEventListener('touchstart', (e) => {
        const touch = e.touches[0];
        createFirework(touch.clientX, touch.clientY);
    }, {passive: false});

    loop();
}

// Xử lý Resize màn hình
function resize() {
    pixelRatio = window.devicePixelRatio || 1;
    width = window.innerWidth;
    height = window.innerHeight;
    
    canvas.width = width * pixelRatio;
    canvas.height = height * pixelRatio;
    ctx.scale(pixelRatio, pixelRatio);
    
    // Tính lại dáng cây cho phù hợp màn hình mới
    tree.rebuild(width, height);
}

// Bắt đầu ứng dụng
function startGame() {
    uiIntro.classList.add('hidden');
    uiMain.classList.remove('hidden');
    isPlaying = true;
    
    // Thử phát nhạc
    audio.play().then(() => {
        btnMute.textContent = '🔊';
    }).catch(err => {
        console.log("Autoplay prevented");
        btnMute.textContent = '🔇';
    });

    showMessage();
    createFirework(width/2, height/2); // Pháo hoa chào mừng
}

// Hiển thị lời chúc
function showMessage() {
    if(msgIndex >= MESSAGES.length) msgIndex = 0;
    const msg = MESSAGES[msgIndex];
    
    // Hiệu ứng Fade out/in
    msgContent.style.animation = 'none';
    msgContent.offsetHeight; /* trigger reflow */
    msgContent.style.animation = 'textPop 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    
    msgContent.innerHTML = `
        <span class="msg-line-1">${msg.l1}</span>
        <span class="msg-line-2">${msg.l2}</span>
    `;
}

function nextMessage() {
    msgIndex++;
    showMessage();
}

// Tạo pháo hoa
function createFirework(x, y) {
    const colors = ['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    for(let i=0; i<CONFIG.particleCount; i++) {
        fireworks.push(new FireworkParticle(x, y, color));
    }
}

// Vòng lặp chính (Game Loop)
function loop() {
    const now = Date.now();
    
    // Xóa màn hình
    ctx.clearRect(0, 0, width, height);

    // 1. Vẽ Vật thể bay (Nền)
    floaters.forEach(f => {
        f.update(width, height);
        f.draw(ctx);
    });

    // 2. Vẽ Cây thông (nếu đã bắt đầu)
    if(isPlaying) {
        tree.draw(ctx, now);
    }

    // 3. Vẽ Pháo hoa
    for (let i = fireworks.length - 1; i >= 0; i--) {
        fireworks[i].update();
        fireworks[i].draw(ctx);
        if (fireworks[i].life <= 0) {
            fireworks.splice(i, 1);
        }
    }

    requestAnimationFrame(loop);
}

// Khởi chạy
init();