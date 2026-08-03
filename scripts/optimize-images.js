import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const projectRoot = process.cwd();
const publicRoot = await resolvePublicRoot();

await Promise.all([
  createResponsiveSet('assets/Mohamed Aiman.webp', 'assets/optimized/Mohamed Aiman', [220, 440, 680], 78),
  createResponsiveSet('assets/Mohamed Aiman Alter Ego.webp', 'assets/optimized/Mohamed Aiman Alter Ego', [220, 440, 680], 78),
  createResponsiveSet('assets/2D Mohamed.webp', 'assets/optimized/2D Mohamed', [240, 480], 76),
  createResponsiveSet('assets/2D Mohamed Leaning.webp', 'assets/optimized/2D Mohamed Leaning', [240, 480], 76),
  createDirectoryVariants('companies', 256, 76),
  createDirectoryVariants('education-institutions', 192, 76),
  createFavicon(),
]);
await createProjectThumbnails();
await createProjectDetailVariants();

console.log('Responsive image variants generated.');

async function createResponsiveSet(inputRelativePath, outputStem, widths, quality) {
  const inputPath = path.join(publicRoot, inputRelativePath);
  await Promise.all(widths.map(async (width) => {
    const outputPath = path.join(publicRoot, `${outputStem}-${width}.webp`);
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await sharp(inputPath)
      .resize({ width, withoutEnlargement: true })
      .webp({ quality, alphaQuality: 82, effort: 4, smartSubsample: true })
      .toFile(outputPath);
  }));
}

async function createDirectoryVariants(directory, width, quality) {
  const inputDirectory = path.join(publicRoot, directory);
  const outputDirectory = path.join(inputDirectory, 'optimized');
  await fs.mkdir(outputDirectory, { recursive: true });
  const entries = await fs.readdir(inputDirectory, { withFileTypes: true });
  await Promise.all(entries
    .filter((entry) => entry.isFile() && /\.(?:avif|jpe?g|png|webp)$/i.test(entry.name))
    .map(async (entry) => {
      const basename = path.parse(entry.name).name;
      await sharp(path.join(inputDirectory, entry.name))
        .resize({ width, height: width, fit: 'inside', withoutEnlargement: true })
        .webp({ quality, alphaQuality: 82, effort: 4, smartSubsample: true })
        .toFile(path.join(outputDirectory, `${basename}-${width}.webp`));
    }));
}

async function createProjectThumbnails() {
  const inputDirectory = path.join(publicRoot, 'projects');
  const outputDirectory = path.join(inputDirectory, 'thumbnails');
  await fs.mkdir(outputDirectory, { recursive: true });
  const entries = await fs.readdir(inputDirectory, { withFileTypes: true });
  await Promise.all(entries
    .filter((entry) => entry.isFile() && /\.(?:avif|jpe?g|png|webp)$/i.test(entry.name))
    .map(async (entry) => {
      const basename = path.parse(entry.name).name;
      await sharp(path.join(inputDirectory, entry.name))
        .resize({ width: 480, withoutEnlargement: true })
        .webp({ quality: 72, alphaQuality: 80, effort: 4, smartSubsample: true })
        .toFile(path.join(outputDirectory, `${basename}.webp`));
    }));
}

async function createProjectDetailVariants() {
  const inputDirectory = path.join(publicRoot, 'projects');
  const outputDirectory = path.join(inputDirectory, 'detail');
  await fs.mkdir(outputDirectory, { recursive: true });
  const entries = await fs.readdir(inputDirectory, { withFileTypes: true });

  await Promise.all(entries
    .filter((entry) => entry.isFile() && /\.(?:avif|gif|jpe?g|png|webp)$/i.test(entry.name))
    .map(async (entry) => {
      const basename = path.parse(entry.name).name;
      const inputPath = path.join(inputDirectory, entry.name);
      const variants = await Promise.all([640, 1024, 1280].map(async (width) => {
        const filename = `${basename}-${width}.webp`;
        const info = await sharp(inputPath, { animated: /\.gif$/i.test(entry.name) })
          .rotate()
          .resize({ width, withoutEnlargement: true })
          .webp({ quality: 78, alphaQuality: 82, effort: 4, smartSubsample: true })
          .toFile(path.join(outputDirectory, filename));
        return { path: `detail/${filename}`, width: info.width, height: info.height };
      }));
      const uniqueVariants = [...new Map(variants.map((variant) => [variant.width, variant])).values()];
      const largest = uniqueVariants[uniqueVariants.length - 1];
      await fs.writeFile(path.join(outputDirectory, `${basename}.json`), JSON.stringify({
        src: largest.path,
        width: largest.width,
        height: largest.height,
        sources: uniqueVariants.map(({ path: assetPath, width }) => ({ path: assetPath, width })),
      }));
    }));
}

async function createFavicon() {
  const inputPath = path.join(publicRoot, 'assets/Mohamed Aiman Alter Ego.webp');
  await sharp(inputPath)
    .resize({ width: 64, height: 64, fit: 'cover' })
    .png({ compressionLevel: 9, palette: true })
    .toFile(path.join(publicRoot, 'favicon-64.png'));
}

async function resolvePublicRoot() {
  for (const name of ['public', 'Public']) {
    const candidate = path.join(projectRoot, name);
    try {
      if ((await fs.stat(candidate)).isDirectory()) return candidate;
    } catch {
      // Try the other case-sensitive directory name.
    }
  }
  throw new Error('Could not find the public asset directory.');
}
