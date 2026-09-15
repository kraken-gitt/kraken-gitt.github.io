const glow = document.querySelector('.cursor-glow');
window.addEventListener('pointermove', (event) => { glow.style.left = `${event.clientX}px`; glow.style.top = `${event.clientY}px`; });
const observer = new IntersectionObserver((entries) => { entries.forEach((entry) => { if (entry.isIntersecting) entry.target.classList.add('visible'); }); }, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
const menu = document.querySelector('.menu-toggle');
const nav = document.querySelector('.nav-links');
menu.addEventListener('click', () => { const open = nav.classList.toggle('mobile-open'); menu.textContent = open ? '×' : '☰'; });
document.querySelectorAll('.nav-links a').forEach((link) => link.addEventListener('click', () => { nav.classList.remove('mobile-open'); menu.textContent = '☰'; }));
const output = document.querySelector('#terminal-output');
setTimeout(() => { [['20:41:13', 'INFO', 'adaptive shield recalibrated', 'cyan'], ['20:41:15', 'INFO', 'all systems nominal', 'green-text']].forEach(([time, type, text, color]) => { const line = document.createElement('p'); line.innerHTML = `<span class="dim">${time}</span> <span class="${color}">${type}</span> ${text}`; output.appendChild(line); }); }, 2600);

// Password strength: heuristic only, never transmitted.
const passwordInput = document.querySelector('#password-input');
const passwordMeter = document.querySelector('#password-meter');
const passwordScore = document.querySelector('#password-score');
const passwordStrength = document.querySelector('#password-strength');
const passwordTips = document.querySelector('#password-tips');
function evaluatePassword(value) {
  let score = 0;
  if (value.length >= 8) score += 20;
  if (value.length >= 12) score += 20;
  if (value.length >= 16) score += 15;
  if (/[a-z]/.test(value)) score += 10;
  if (/[A-Z]/.test(value)) score += 10;
  if (/\d/.test(value)) score += 10;
  if (/[^A-Za-z0-9]/.test(value)) score += 15;
  if (/(.)\1{2,}/.test(value)) score -= 15;
  if (/password|azerty|qwerty|123456/i.test(value)) score = Math.min(score, 15);
  score = Math.max(0, Math.min(100, score));
  const label = score < 30 ? 'FRAGILE' : score < 60 ? 'MOYEN' : score < 80 ? 'SOLIDE' : 'EXCELLENT';
  const color = score < 30 ? '#ff6a7c' : score < 60 ? '#e9c15b' : 'var(--acid)';
  passwordScore.textContent = `${score} / 100`; passwordStrength.textContent = value ? label : 'EN ATTENTE'; passwordMeter.style.width = `${score}%`; passwordMeter.style.background = color; passwordStrength.style.color = color;
  passwordTips.innerHTML = '';
  if (value.length < 12) passwordTips.insertAdjacentHTML('beforeend', '<li>Visez 12 caractères ou plus</li>');
  if (!/[A-Z]/.test(value) || !/[a-z]/.test(value)) passwordTips.insertAdjacentHTML('beforeend', '<li>Mélangez majuscules et minuscules</li>');
  if (!/\d/.test(value) || !/[^A-Za-z0-9]/.test(value)) passwordTips.insertAdjacentHTML('beforeend', '<li>Ajoutez chiffres et symboles</li>');
  if (!value) passwordTips.innerHTML = '<li>12 caractères ou plus recommandés</li><li>Ajoutez des chiffres et symboles</li>';
}
passwordInput.addEventListener('input', (event) => evaluatePassword(event.target.value));
document.querySelector('#toggle-password').addEventListener('click', (event) => { const visible = passwordInput.type === 'text'; passwordInput.type = visible ? 'password' : 'text'; event.currentTarget.textContent = visible ? '◉' : '◎'; });

// URL inspection is local and provides indicators, not a guarantee of safety.
const urlInput = document.querySelector('#url-input');
const urlResult = document.querySelector('#url-result');
function inspectUrl() {
  let value = urlInput.value.trim();
  if (!value) return;
  if (!/^https?:\/\//i.test(value)) value = `https://${value}`;
  try {
    const url = new URL(value); const issues = [];
    if (url.protocol !== 'https:') issues.push('connexion non chiffrée');
    if (url.hostname.includes('xn--')) issues.push('domaine internationalisé');
    if (/\d{1,3}(\.\d{1,3}){3}/.test(url.hostname)) issues.push('adresse IP directe');
    if (/[?&](login|verify|password|token)=/i.test(url.search)) issues.push('paramètre sensible');
    if (url.hostname.split('.').length > 4) issues.push('sous-domaines multiples');
    const level = issues.length >= 2 ? 'danger' : issues.length ? 'warn' : 'safe';
    const title = level === 'safe' ? 'SIGNAL FAVORABLE' : level === 'warn' ? 'À VÉRIFIER' : 'RISQUE ÉLEVÉ';
    urlResult.className = `tool-result ${level}`;
    urlResult.querySelector('strong').textContent = title;
    urlResult.querySelector('small').textContent = issues.length ? issues.join(' · ') : 'HTTPS actif · aucun indicateur suspect détecté.';
  } catch { urlResult.className = 'tool-result danger'; urlResult.querySelector('strong').textContent = 'FORMAT INVALIDE'; urlResult.querySelector('small').textContent = 'Utilisez une adresse comme https://exemple.com'; }
}
document.querySelector('#check-url').addEventListener('click', inspectUrl); urlInput.addEventListener('keydown', (event) => { if (event.key === 'Enter') inspectUrl(); });

// Secrets use the Web Crypto API when available.
const secretOutput = document.querySelector('#secret-output');
function randomSecret() { const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz' + (document.querySelector('#secret-numbers').checked ? '23456789' : '') + (document.querySelector('#secret-symbols').checked ? '!@#$%^&*_-+=' : ''); const bytes = new Uint32Array(24); crypto.getRandomValues(bytes); return Array.from(bytes, (byte) => chars[byte % chars.length]).join(''); }
function generateSecret() { secretOutput.textContent = randomSecret(); }
document.querySelector('#generate-secret').addEventListener('click', generateSecret); document.querySelector('#copy-secret').addEventListener('click', async () => { if (secretOutput.textContent === 'Cliquez pour générer') generateSecret(); await navigator.clipboard.writeText(secretOutput.textContent); const button = document.querySelector('#copy-secret'); button.textContent = '✓'; setTimeout(() => { button.textContent = '⧉'; }, 1200); });

// Command Center demo interactions.
const postureScore = document.querySelector('#posture-score');
const securityChecks = document.querySelectorAll('.security-check');
securityChecks.forEach((check) => check.addEventListener('change', () => {
  const completed = [...securityChecks].filter((item) => item.checked).length;
  postureScore.textContent = 82 + completed * 4;
}));
document.querySelectorAll('.sidebar-item').forEach((item) => item.addEventListener('click', () => {
  document.querySelectorAll('.sidebar-item').forEach((button) => button.classList.remove('active'));
  item.classList.add('active');
}));
