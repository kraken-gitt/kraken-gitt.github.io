const form = document.querySelector('#search-form');
const results = document.querySelector('#results');
const username = document.querySelector('#username');
const title = document.querySelector('#result-title');
const sourceGrid = document.querySelector('#source-grid');
const state = document.querySelector('#search-state');
const connect = document.querySelector('#connect');
const endpoint = document.querySelector('#endpoint');
const sources = ['GitHub','GitLab','Reddit','X / Twitter','Instagram','YouTube','Twitch','Medium','Dev.to','Keybase','Mastodon','Telegram'];

function demo(value) {
  state.innerHTML = '<span class="state-icon">◌</span><div><strong>Aperçu local généré</strong><small>Ces cartes sont un aperçu : aucune présence n’est confirmée sans backend Krakloock.</small></div>';
  sourceGrid.innerHTML = sources.map((name) => `<div class="source-chip demo"><div>${name}<span>APERÇU / NON VÉRIFIÉ</span></div><a href="#" aria-label="Aperçu ${name}">Ouvrir ↗</a></div>`).join('');
}

function renderReal(items) {
  sourceGrid.innerHTML = items.map((item) => `<div class="source-chip ${item.status === 'Claimed' ? 'verified' : ''}"><div>${item.site}<span>${item.status.toUpperCase()}</span></div><a href="${item.url || '#'}" target="_blank" rel="noreferrer">Ouvrir ↗</a></div>`).join('') || '<div class="source-chip">Aucun résultat retourné</div>';
  state.innerHTML = '<span class="state-icon">✓</span><div><strong>Résultats Krakloock reçus</strong><small>Statuts retournés par votre moteur backend.</small></div>';
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const value = username.value.trim();
  if (!value) return;
  title.textContent = `Résultats pour @${value}`;
  results.classList.remove('hidden');
  const api = endpoint.value.trim();
  if (!/^https:\/\//i.test(api)) {
    demo(value);
    results.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return;
  }
  state.innerHTML = '<span class="state-icon">…</span><div><strong>Recherche en cours</strong><small>Le moteur Krakloock analyse les sources publiques.</small></div>';
  try {
    const response = await fetch(`${api.replace(/\/$/, '')}/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: value,
        authorized: document.querySelector('#authorized')?.checked === true,
        include_nsfw: document.querySelector('#include-nsfw')?.checked === true,
      }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || 'Backend error');
    renderReal(data.results);
  } catch (error) {
    state.innerHTML = '<span class="state-icon">!</span><div><strong>Backend indisponible</strong><small>Affichage de l’aperçu local — aucun résultat réel n’a été inventé.</small></div>';
    demo(value);
  }
  results.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

connect.addEventListener('click', () => {
  const value = endpoint.value.trim();
  if (!/^https:\/\//i.test(value)) {
    endpoint.focus();
    endpoint.setCustomValidity('Utilisez un endpoint HTTPS autorisé.');
    endpoint.reportValidity();
    return;
  }
  endpoint.setCustomValidity('');
  connect.textContent = 'Endpoint enregistré ✓';
  connect.style.background = 'var(--cyan)';
});
