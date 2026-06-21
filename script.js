// media.by_mia — gallery, lightbox, nav, filtering

document.getElementById('year').textContent = new Date().getFullYear();

// Nav toggle
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');
navToggle.addEventListener('click', () => navLinks.classList.toggle('open'));
navLinks.querySelectorAll('a').forEach(a =>
  a.addEventListener('click', () => navLinks.classList.remove('open'))
);

// Placeholder showcase items — replace "label" text or swap classes with real <img> later
const items = [
  { category: 'portrait',  label: 'Editorial Portrait, SLC' },
  { category: 'wedding',   label: 'Mountain Elopement, Park City' },
  { category: 'landscape', label: 'Salt Flats at Sunset' },
  { category: 'family',    label: 'Generations, Provo Canyon' },
  { category: 'wedding',   label: 'First Look, Sundance' },
  { category: 'landscape', label: 'Zion at Golden Hour' },
  { category: 'portrait',  label: 'Senior Session, Capitol Hill' },
  { category: 'family',    label: 'Autumn Family, Millcreek' },
  { category: 'landscape', label: 'Arches at Dawn' },
];

const grid = document.getElementById('galleryGrid');
items.forEach((item, i) => {
  const el = document.createElement('div');
  el.className = `gallery-item ph-${item.category}`;
  el.dataset.category = item.category;
  el.innerHTML = `
    <div class="gallery-caption">
      <small>${item.category}</small>
      <span>${item.label}</span>
    </div>`;
  el.addEventListener('click', () => openLightbox(item));
  grid.appendChild(el);
});

// Filtering
const filterBar = document.getElementById('filterBar');
filterBar.addEventListener('click', (e) => {
  const btn = e.target.closest('.filter-btn');
  if (!btn) return;
  filterBar.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const filter = btn.dataset.filter;
  document.querySelectorAll('.gallery-item').forEach(el => {
    el.classList.toggle('hidden', filter !== 'all' && el.dataset.category !== filter);
  });
});

// Lightbox
const lightbox = document.getElementById('lightbox');
const lightboxFrame = document.getElementById('lightboxFrame');
const lightboxClose = document.getElementById('lightboxClose');

function openLightbox(item) {
  lightboxFrame.className = `lightbox-frame ph-${item.category}`;
  lightboxFrame.innerHTML = `<div class="gallery-caption"><small>${item.category}</small><span>${item.label}</span></div>`;
  lightboxFrame.style.display = 'flex';
  lightboxFrame.style.alignItems = 'flex-end';
  lightbox.classList.add('open');
}

lightboxClose.addEventListener('click', () => lightbox.classList.remove('open'));
lightbox.addEventListener('click', (e) => {
  if (e.target === lightbox) lightbox.classList.remove('open');
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') lightbox.classList.remove('open');
});

// Location preset → fill custom field placeholder hint
const locationPreset = document.getElementById('locationPreset');
const locationCustom = document.getElementById('locationCustom');
locationPreset.addEventListener('change', () => {
  if (locationPreset.value && locationPreset.value !== 'Other — specify below') {
    locationCustom.placeholder = `Anywhere specific within ${locationPreset.value.split('—')[0].trim()}?`;
  }
});
