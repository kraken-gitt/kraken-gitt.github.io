const $ = (selector) => document.querySelector(selector);
const state = { books: JSON.parse(localStorage.getItem('krakloock_library') || '[]') };
const save = () => localStorage.setItem('krakloock_library', JSON.stringify(state.books));
const format = (name) => name.toLowerCase().endsWith('.epub') ? 'EPUB' : 'PDF';

function render() {
  const query = $('#search').value.toLowerCase().trim();
  const filter = $('#filter').value;
  const books = state.books.filter((book) => (filter === 'all' || book.format === filter) && (!query || `${book.name} ${book.format}`.toLowerCase().includes(query)));
  $('#hero-count').textContent = state.books.length;
  $('#empty').style.display = books.length ? 'none' : 'block';
  $('#book-grid').innerHTML = books.map((book) => `<article class="book-card"><div class="cover ${book.format.toLowerCase()}"><span>${book.format}</span><strong>${book.name.slice(0, 1).toUpperCase()}</strong></div><div class="book-info"><span class="book-format">${book.format} · LOCAL</span><h3>${book.name.replace(/\.(pdf|epub)$/i, '')}</h3><small>${(book.size / 1024 / 1024).toFixed(1)} MB · ajouté à votre catalogue</small><div><button class="read" data-id="${book.id}">Ouvrir ↗</button><button class="remove" data-id="${book.id}">Retirer</button></div></div></article>`).join('');
  document.querySelectorAll('.read').forEach((button) => button.addEventListener('click', () => openBook(state.books.find((book) => book.id === button.dataset.id))));
  document.querySelectorAll('.remove').forEach((button) => button.addEventListener('click', () => { state.books = state.books.filter((book) => book.id !== button.dataset.id); save(); render(); }));
}

function addFiles(files) {
  [...files].filter((file) => /\.pdf$|\.epub$/i.test(file.name)).forEach((file) => {
    const reader = new FileReader();
    reader.onload = () => { state.books.push({ id: crypto.randomUUID(), name: file.name, format: format(file.name), size: file.size, data: reader.result }); save(); render(); };
    reader.readAsDataURL(file);
  });
}

function openBook(book) { if (!book) return; $('#reader-title').textContent = book.name; $('#reader-frame').src = book.data; $('#reader').showModal(); }
$('#file-input').addEventListener('change', (event) => addFiles(event.target.files));
$('#dropzone').addEventListener('dragover', (event) => { event.preventDefault(); $('#dropzone').classList.add('drag'); });
$('#dropzone').addEventListener('dragleave', () => $('#dropzone').classList.remove('drag'));
$('#dropzone').addEventListener('drop', (event) => { event.preventDefault(); $('#dropzone').classList.remove('drag'); addFiles(event.dataTransfer.files); });
$('#search').addEventListener('input', render);
$('#filter').addEventListener('change', render);
$('#close-reader').addEventListener('click', () => $('#reader').close());
$('#clear').addEventListener('click', () => { if (confirm('Effacer tous les livres et données locales ?')) { state.books = []; save(); render(); } });
$('#export').addEventListener('click', () => { const blob = new Blob([JSON.stringify(state.books.map(({ data, ...book }) => book), null, 2)], { type: 'application/json' }); const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = 'krakloock-library.json'; link.click(); URL.revokeObjectURL(link.href); });
render();
