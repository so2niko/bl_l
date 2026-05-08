import './style.css';

const app = document.querySelector('#app');

function toReadableTitle(slug) {
  return slug
    .split('-')
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(' ');
}

function getRoute() {
  const hashPath = window.location.hash.replace(/^#/, '');
  const parts = hashPath.split('/').filter(Boolean);
  if (parts[0] === 'post' && parts[1]) {
    return { page: 'post', slug: decodeURIComponent(parts[1]) };
  }
  return { page: 'list' };
}

function toPostUrl(slug) {
  return `#/post/${encodeURIComponent(slug)}`;
}

function markdownToHtml(markdown) {
  const escaped = markdown
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');

  // Normalize CRLF/CR to LF so the parser/regex below work the same on
  // Windows-authored files. Without this, list items keep a trailing \r
  // and the <ul> wrapping regex stops matching them.
  const lines = escaped.replace(/\r\n?/g, '\n').split('\n');
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

async function renderPostPage(posts, slug) {
  const post = posts.find((item) => item.slug === slug);
  if (!post) {
    app.innerHTML = `
      <main class="page">
        <a href="#/" class="back-link">Back to all experiments</a>
        <p class="empty-state">Post not found: ${slug}</p>
      </main>
    `;
    return;
  }

  const title = post.title || toReadableTitle(post.slug);
  const markdownText = post.markdown;
  const photosHtml = post.photos.length
    ? post.photos
        .map(
          (photoUrl) =>
            `<img src="${photoUrl}" alt="${title} photo">`,
        )
        .join('')
    : '<p class="empty-state">No photos for this post yet.</p>';

  app.innerHTML = `
    <main class="page">
      <a href="#/" class="back-link" id="back-link">Back to all experiments</a>
      <article class="post-page">
        <h1>${title}</h1>
        <section class="post-markdown">${markdownToHtml(markdownText)}</section>
        <section class="photo-grid">${photosHtml}</section>
      </article>
    </main>
  `;
  const backLink = document.querySelector('#back-link');
  backLink.addEventListener('click', (event) => {
    event.preventDefault();
    navigateTo('#/');
  });
}

function renderListPage(posts) {
  app.innerHTML = `
    <main class="page">
      <header class="page-header">
        <h1>My Hobby Experiments</h1>
        <p>Click a card to open full description and gallery.</p>
      </header>
      <section id="cards" class="cards"></section>
    </main>
  `;

  const cards = document.querySelector('#cards');

  if (posts.length === 0) {
    cards.innerHTML = '<p class="empty-state">No posts found. Add markdown files in content/posts.</p>';
    return;
  }

  for (const post of posts) {
    const cover = post.photos[0] ?? '';
    const title = post.title || toReadableTitle(post.slug);

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

    card.addEventListener('click', () => {
      navigateTo(toPostUrl(post.slug));
    });

    cards.appendChild(card);
  }
}

async function renderRoute(posts) {
  const route = getRoute();
  if (route.page === 'post') {
    await renderPostPage(posts, route.slug);
    return;
  }
  renderListPage(posts);
}

function navigateTo(url) {
  const nextHash = url.startsWith('#') ? url : `#${url}`;
  if (window.location.hash === nextHash) {
    return;
  }
  window.location.hash = nextHash;
}

function renderFatalError(error) {
  console.error('Failed to load posts:', error);
  app.innerHTML = '<p class="empty-state">Unable to load content.</p>';
}

let postsCache = [];

function getTitleFromMarkdown(markdown, fallbackSlug) {
  const firstContentLine = markdown
    .split(/\r?\n/)
    .find((line) => line.trim() !== '');

  if (!firstContentLine) {
    return toReadableTitle(fallbackSlug);
  }

  const cleanTitle = firstContentLine.replace(/^#{1,6}\s*/, '').trim();
  return cleanTitle || toReadableTitle(fallbackSlug);
}

function collectPhotosBySlug() {
  const imageModules = import.meta.glob('../content/images/*/*.{jpg,jpeg,png,webp,gif,avif}', {
    eager: true,
    import: 'default',
  });
  const photosBySlug = new Map();

  for (const [modulePath, assetUrl] of Object.entries(imageModules)) {
    const match = modulePath.match(/\/images\/([^/]+)\/([^/]+)$/);
    if (!match) {
      continue;
    }
    const [, slug] = match;
    const existing = photosBySlug.get(slug) ?? [];
    existing.push({ modulePath, assetUrl });
    photosBySlug.set(slug, existing);
  }

  for (const [slug, entries] of photosBySlug.entries()) {
    entries.sort((a, b) => a.modulePath.localeCompare(b.modulePath));
    photosBySlug.set(
      slug,
      entries.map((entry) => entry.assetUrl),
    );
  }

  return photosBySlug;
}

async function loadPosts() {
  const markdownModules = import.meta.glob('../content/posts/*.md', {
    query: '?raw',
    import: 'default',
  });
  const photosBySlug = collectPhotosBySlug();
  const posts = [];

  for (const modulePath of Object.keys(markdownModules).sort((a, b) => a.localeCompare(b))) {
    const slugMatch = modulePath.match(/\/posts\/([^/]+)\.md$/);
    if (!slugMatch) {
      continue;
    }
    const slug = slugMatch[1];
    const markdown = await markdownModules[modulePath]();

    posts.push({
      slug,
      title: getTitleFromMarkdown(markdown, slug),
      markdown,
      photos: photosBySlug.get(slug) ?? [],
    });
  }

  return posts;
}

async function start() {
  postsCache = await loadPosts();
  await renderRoute(postsCache);
  window.addEventListener('hashchange', () => {
    renderRoute(postsCache).catch(renderFatalError);
  });
}

start().catch(renderFatalError);
