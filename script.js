// Starfield animation
const canvas = document.getElementById("starfield");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let stars = [];
for (let i = 0; i < 150; i++) {
  stars.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: Math.random() * 1.5,
    d: Math.random() * 0.5 + 0.2,
  });
}

function drawStars() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#ffffff";
  stars.forEach((star) => {
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
    ctx.fill();
  });
}

function updateStars() {
  stars.forEach((star) => {
    star.y += star.d;
    if (star.y > canvas.height) {
      star.y = 0;
      star.x = Math.random() * canvas.width;
    }
  });
}

function animate() {
  drawStars();
  updateStars();
  requestAnimationFrame(animate);
}
animate();

// Countdown clock
function updateCountdown() {
  const launchDate = new Date("January 1, 2036 00:00:00").getTime();
  const now = new Date().getTime();
  const distance = launchDate - now;

  if (distance < 0) {
    document.getElementById("launch-timer").innerHTML = "🚀 Launched!";
    return;
  }

  const days = Math.floor(distance / (1000 * 60 * 60 * 24));
  const years = Math.floor(days / 365);
  const remainingDays = days % 365;

  document.getElementById("launch-timer").innerHTML =
    `${years} years and ${remainingDays} days to go`;
}
setInterval(updateCountdown, 1000);
updateCountdown();

// Telemetry panel (static + randomized temp)
function updateTelemetry() {
  const statusEl = document.getElementById("status");
  const distanceEl = document.getElementById("distance");
  const velocityEl = document.getElementById("velocity");
  const powerEl = document.getElementById("power");
  const tempEl = document.getElementById("temperature");
  const aiEl = document.getElementById("ai");
  const delayEl = document.getElementById("delay");

  statusEl.textContent = "Standby";
  distanceEl.textContent = "0.00 AU";
  velocityEl.textContent = "0.00 km/s";
  powerEl.textContent = "100%";
  tempEl.textContent = `-${(55 + Math.random()).toFixed(1)}°C`;
  aiEl.textContent = "Idle";
  delayEl.textContent = "0.00 s";
}
setInterval(updateTelemetry, 3000);
updateTelemetry();
