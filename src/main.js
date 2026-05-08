import './style.css';

const app = document.querySelector('#app');

function toReadableTitle(slug) {
  return slug
    .split('-')
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(' ');
}

function markdownToHtml(markdown) {
  const escaped = markdown
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');

  const lines = escaped.split('\n');
  const html = [];

  for (const line of lines) {
    if (line.startsWith('### ')) {
      html.push(`<h3>${line.slice(4)}</h3>`);
      continue;
    }
    if (line.startsWith('## ')) {
      html.push(`<h2>${line.slice(3)}</h2>`);
      continue;
    }
    if (line.startsWith('# ')) {
      html.push(`<h1>${line.slice(2)}</h1>`);
      continue;
    }
    if (line.startsWith('- ')) {
      html.push(`<li>${line.slice(2)}</li>`);
      continue;
    }
    if (line.trim() === '') {
      html.push('<br>');
      continue;
    }
    html.push(`<p>${line}</p>`);
  }

  const merged = html.join('\n');
  return merged.replace(/(<li>.*<\/li>\n?)+/g, (listBlock) => `<ul>${listBlock}</ul>`);
}

function renderApp(posts) {
  app.innerHTML = `
    <main class="page">
      <header class="page-header">
        <h1>My Hobby Experiments</h1>
        <p>Click a card to open full description and gallery.</p>
      </header>
      <section id="cards" class="cards"></section>
    </main>
    <dialog id="post-modal" class="modal">
      <article class="modal-content">
        <button id="close-modal" class="close-button" aria-label="Close">x</button>
        <h2 id="post-title"></h2>
        <section id="post-markdown" class="post-markdown"></section>
        <section id="post-photos" class="photo-grid"></section>
      </article>
    </dialog>
  `;

  const cards = document.querySelector('#cards');
  const dialog = document.querySelector('#post-modal');
  const closeButton = document.querySelector('#close-modal');
  const postTitle = document.querySelector('#post-title');
  const postMarkdown = document.querySelector('#post-markdown');
  const postPhotos = document.querySelector('#post-photos');

  closeButton.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) {
      dialog.close();
    }
  });

  if (posts.length === 0) {
    cards.innerHTML = '<p class="empty-state">No posts found. Add markdown files in content/posts.</p>';
    return;
  }

  for (const post of posts) {
    const cover = post.photos[0]
      ? `/content/images/${post.slug}/${post.photos[0]}`
      : '';
    const title = toReadableTitle(post.slug);

    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'card';
    card.innerHTML = `
      ${
        cover
          ? `<img class="card-cover" src="${cover}" alt="${title} cover">`
          : '<div class="card-placeholder">No cover</div>'
      }
      <div class="card-body">
        <h3>${title}</h3>
        <p>${post.photos.length} photos</p>
      </div>
    `;

    card.addEventListener('click', async () => {
      const markdownUrl = `/content/posts/${post.markdownFile}`;
      const markdownText = await fetch(markdownUrl).then((response) => response.text());

      postTitle.textContent = title;
      postMarkdown.innerHTML = markdownToHtml(markdownText);
      postPhotos.innerHTML = post.photos.length
        ? post.photos
            .map(
              (photoName) =>
                `<img src="/content/images/${post.slug}/${photoName}" alt="${title} photo">`,
            )
            .join('')
        : '<p class="empty-state">No photos for this post yet.</p>';

      dialog.showModal();
    });

    cards.appendChild(card);
  }
}

async function start() {
  const posts = await fetch('/data/posts.json').then((response) => response.json());
  renderApp(posts);
}

start().catch((error) => {
  console.error('Failed to load posts:', error);
  app.innerHTML =
    '<p class="empty-state">Unable to load content. Check /public/data/posts.json generation.</p>';
});
