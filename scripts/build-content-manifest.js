import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const rootDir = process.cwd();
const postsDir = path.join(rootDir, 'content', 'posts');
const imagesDir = path.join(rootDir, 'content', 'images');
const outputDir = path.join(rootDir, 'public', 'data');
const outputFile = path.join(outputDir, 'posts.json');

async function loadExistingManifest() {
  try {
    const raw = await readFile(outputFile, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function listFilesSafe(targetDir) {
  try {
    return await readdir(targetDir, { withFileTypes: true });
  } catch {
    return [];
  }
}

async function buildManifest() {
  const existingManifest = await loadExistingManifest();
  const existingTitleBySlug = new Map(
    existingManifest
      .filter((post) => post && typeof post.slug === 'string' && typeof post.title === 'string')
      .map((post) => [post.slug, post.title]),
  );

  const postEntries = await listFilesSafe(postsDir);
  const markdownFiles = postEntries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.md'))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));

  const manifest = [];

  for (const markdownFile of markdownFiles) {
    const slug = path.basename(markdownFile, '.md');
    const markdownPath = path.join(postsDir, markdownFile);
    const postImageDir = path.join(imagesDir, slug);
    const imageEntries = await listFilesSafe(postImageDir);
    const photos = imageEntries
      .filter((entry) => entry.isFile() && isImageFile(entry.name))
      .map((entry) => entry.name)
      .sort((a, b) => a.localeCompare(b));
    const title = existingTitleBySlug.get(slug) ?? (await getPostTitle(markdownPath, slug));

    manifest.push({
      slug,
      title,
      markdownFile,
      photos,
    });
  }

  await mkdir(outputDir, { recursive: true });
  await writeFile(outputFile, JSON.stringify(manifest, null, 2), 'utf8');
  console.log(`Generated ${manifest.length} posts into ${path.relative(rootDir, outputFile)}`);
}

function isImageFile(fileName) {
  const supported = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif'];
  return supported.includes(path.extname(fileName).toLowerCase());
}

async function getPostTitle(markdownPath, fallbackTitle) {
  try {
    const content = await readFile(markdownPath, 'utf8');
    const lines = content.split(/\r?\n/);
    const firstContentLine = lines.find((line) => line.trim() !== '');

    if (!firstContentLine) {
      return fallbackTitle;
    }

    return firstContentLine.replace(/^#{1,6}\s*/, '').trim() || fallbackTitle;
  } catch {
    return fallbackTitle;
  }
}

buildManifest().catch((error) => {
  console.error('Failed to build content manifest.');
  console.error(error);
  process.exitCode = 1;
});
