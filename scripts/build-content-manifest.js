import { mkdir, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const rootDir = process.cwd();
const postsDir = path.join(rootDir, 'content', 'posts');
const imagesDir = path.join(rootDir, 'content', 'images');
const outputDir = path.join(rootDir, 'public', 'data');
const outputFile = path.join(outputDir, 'posts.json');

async function listFilesSafe(targetDir) {
  try {
    return await readdir(targetDir, { withFileTypes: true });
  } catch {
    return [];
  }
}

async function buildManifest() {
  const postEntries = await listFilesSafe(postsDir);
  const markdownFiles = postEntries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.md'))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));

  const manifest = [];

  for (const markdownFile of markdownFiles) {
    const slug = path.basename(markdownFile, '.md');
    const postImageDir = path.join(imagesDir, slug);
    const imageEntries = await listFilesSafe(postImageDir);
    const photos = imageEntries
      .filter((entry) => entry.isFile() && isImageFile(entry.name))
      .map((entry) => entry.name)
      .sort((a, b) => a.localeCompare(b));

    manifest.push({
      slug,
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

buildManifest().catch((error) => {
  console.error('Failed to build content manifest.');
  console.error(error);
  process.exitCode = 1;
});
