const glow = document.querySelector('.cursor-glow');
window.addEventListener('pointermove', (event) => { glow.style.left = `${event.clientX}px`; glow.style.top = `${event.clientY}px`; });
const observer = new IntersectionObserver((entries) => { entries.forEach((entry) => { if (entry.isIntersecting) entry.target.classList.add('visible'); }); }, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
const menu = document.querySelector('.menu-toggle');
const nav = document.querySelector('.nav-links');
menu.addEventListener('click', () => { const open = nav.classList.toggle('mobile-open'); menu.textContent = open ? '×' : '☰'; });
document.querySelectorAll('.nav-links a').forEach((link) => link.addEventListener('click', () => { nav.classList.remove('mobile-open'); menu.textContent = '☰'; }));
const output = document.querySelector('#terminal-output');
const extraLines = [
  ['20:41:13', 'INFO', 'adaptive shield recalibrated', 'cyan'],
  ['20:41:15', 'INFO', 'all systems nominal', 'green-text']
];
setTimeout(() => { extraLines.forEach(([time, type, text, color]) => { const line = document.createElement('p'); line.innerHTML = `<span class="dim">${time}</span> <span class="${color}">${type}</span> ${text}`; output.appendChild(line); }); }, 2600);
