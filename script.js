// Scroll animation
gsap.registerPlugin(ScrollTrigger);

gsap.utils.toArray('.fade-in').forEach(section => {
  gsap.to(section, {
    opacity: 1,
    y: 0,
    duration: 1,
    scrollTrigger: {
      trigger: section,
      start: 'top 80%',
    }
  });
});

// Toggle extra content
document.querySelectorAll('.toggle-btn').forEach(button => {
  button.addEventListener('click', () => {
    const content = button.nextElementSibling;
    content.classList.toggle('hidden');
    button.textContent = content.classList.contains('hidden') ? 'More Info' : 'Less Info';
  });
});

// Glow effect when nav links are clicked
document.querySelectorAll('.navbar a').forEach(link => {
  link.addEventListener('click', e => {
    const targetId = link.getAttribute('href').substring(1);
    const target = document.getElementById(targetId);
    if (target) {
      target.classList.add('pulse-highlight');
      setTimeout(() => target.classList.remove('pulse-highlight'), 1000);
    }
  });
});

// Starfield animation
const canvas = document.getElementById('starfield');
const ctx = canvas.getContext('2d');
let stars = [];

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function createStars(count) {
  stars = [];
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.5,
      velocity: Math.random() * 0.5 + 0.1
    });
  }
}

function animateStars() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'white';
  for (let star of stars) {
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.radius, 0, 2 * Math.PI);
    ctx.fill();
    star.y += star.velocity;
    if (star.y > canvas.height) {
      star.y = 0;
      star.x = Math.random() * canvas.width;
    }
  }
  requestAnimationFrame(animateStars);
}

window.addEventListener('resize', () => {
  resizeCanvas();
  createStars(200);
});

resizeCanvas();
createStars(200);
animateStars();
