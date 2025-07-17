// Canvas setup
const canvas = document.getElementById('starfield');
const ctx = canvas.getContext('2d');
let stars = [], shootingStars = [];

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Generate stars
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
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'white';
  stars.forEach(star => {
    ctx.globalAlpha = star.alpha;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.radius, 0, 2 * Math.PI);
    ctx.fill();
    star.y += star.speed;
    if (star.y > canvas.height) star.y = 0;
  });
  ctx.globalAlpha = 1;
}

// Shooting stars
function createShootingStar() {
  shootingStars.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height * 0.5,
    length: 150 + Math.random() * 100,
    speed: 6 + Math.random() * 3,
    angle: Math.PI / 4,
    alpha: 1
  });
}

function drawShootingStars() {
  for (let i = 0; i < shootingStars.length; i++) {
    const star = shootingStars[i];
    const endX = star.x - star.length * Math.cos(star.angle);
    const endY = star.y - star.length * Math.sin(star.angle);

    ctx.strokeStyle = `rgba(102, 252, 241, ${star.alpha})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(star.x, star.y);
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

// Animate
function animate() {
  drawStars();
  drawShootingStars();
  requestAnimationFrame(animate);
}

createStars(200);
animate();
setInterval(() => createShootingStar(), 3000 + Math.random() * 3000);

// Countdown
function updateCountdown() {
  const launchDate = new Date('2036-01-01T00:00:00Z');
  const now = new Date();
  const diff = launchDate - now;

  const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
  const days = Math.floor((diff / (1000 * 60 * 60 * 24)) % 365.25);
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  document.getElementById('countdown-timer').innerText =
    `${years}y ${days}d ${hours}h ${minutes}m ${seconds}s`;
}
setInterval(updateCountdown, 1000);
updateCountdown();