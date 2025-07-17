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
