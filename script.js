// Starfield Canvas Background with Shooting Stars
const canvas = document.getElementById('starfield');
const ctx = canvas.getContext('2d');
let stars = [], shootingStars = [];

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

function createStars(count) {
  stars = [];
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.2,
      alpha: Math.random(),
      speed: 0.15 + Math.random() * 0.35
    });
  }
}

function drawStars() {
  // Clear canvas slightly for trailing effect
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw static stars
  stars.forEach(star => {
    ctx.globalAlpha = star.alpha;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.radius, 0, 2 * Math.PI);
    ctx.fillStyle = "white";
    ctx.fill();

    star.y += star.speed;
    if (star.y > canvas.height) star.y = 0;
  });

  ctx.globalAlpha = 1;
}

function createShootingStar() {
  const startX = Math.random() * canvas.width;
  const startY = Math.random() * canvas.height * 0.5;
  const length = 200 + Math.random() * 100;
  shootingStars.push({
    x: startX,
    y: startY,
    length: length,
    speed: 8 + Math.random() * 4,
    angle: Math.PI / 4,
    alpha: 1
  });
}

function drawShootingStars() {
  for (let i = 0; i < shootingStars.length; i++) {
    const star = shootingStars[i];
    const x = star.x;
    const y = star.y;
    const endX = x - star.length * Math.cos(star.angle);
    const endY = y - star.length * Math.sin(star.angle);

    ctx.strokeStyle = `rgba(102, 252, 241, ${star.alpha})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    star.x += star.speed;
    star.y += star.speed;
    star.alpha -= 0.01;

    if (star.alpha <= 0) {
      shootingStars.splice(i, 1);
      i--;
    }
  }
}

function animate() {
  drawStars();
  drawShootingStars();
  requestAnimationFrame(animate);
}

createStars(200);
animate();

// Generate a new shooting star every 3–6 seconds
setInterval(() => {
  createShootingStar();
}, 3000 + Math.random() * 3000);