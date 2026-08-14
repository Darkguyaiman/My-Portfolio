import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const projectRoot = process.cwd();
const publicRoot = await resolvePublicRoot();
const scriptModifiedAt = (await fs.stat(fileURLToPath(import.meta.url))).mtimeMs;
let generatedSets = 0;
let cachedSets = 0;

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

console.log(`Responsive images ready: ${generatedSets} generated, ${cachedSets} reused.`);

async function createResponsiveSet(inputRelativePath, outputStem, widths, quality) {
  const inputPath = path.join(publicRoot, inputRelativePath);
  const outputPaths = widths.map((width) => path.join(publicRoot, `${outputStem}-${width}.webp`));
  if (await outputsAreCurrent(inputPath, outputPaths)) {
    cachedSets += 1;
    return;
  }
  await Promise.all(widths.map(async (width) => {
    const outputPath = path.join(publicRoot, `${outputStem}-${width}.webp`);
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await sharp(inputPath)
      .resize({ width, withoutEnlargement: true })
      .webp({ quality, alphaQuality: 82, effort: 4, smartSubsample: true })
      .toFile(outputPath);
  }));
  generatedSets += 1;
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
      const inputPath = path.join(inputDirectory, entry.name);
      const outputPath = path.join(outputDirectory, `${basename}-${width}.webp`);
      if (await outputsAreCurrent(inputPath, [outputPath])) {
        cachedSets += 1;
        return;
      }
      await sharp(inputPath)
        .resize({ width, height: width, fit: 'inside', withoutEnlargement: true })
        .webp({ quality, alphaQuality: 82, effort: 4, smartSubsample: true })
        .toFile(outputPath);
      generatedSets += 1;
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
      const inputPath = path.join(inputDirectory, entry.name);
      const outputPath = path.join(outputDirectory, `${basename}.webp`);
      if (await outputsAreCurrent(inputPath, [outputPath])) {
        cachedSets += 1;
        return;
      }
      await sharp(inputPath)
        .resize({ width: 480, withoutEnlargement: true })
        .webp({ quality: 72, alphaQuality: 80, effort: 4, smartSubsample: true })
        .toFile(outputPath);
      generatedSets += 1;
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
      const outputPaths = [
        ...[640, 1024, 1280].map((width) => path.join(outputDirectory, `${basename}-${width}.webp`)),
        path.join(outputDirectory, `${basename}.json`),
      ];
      if (await outputsAreCurrent(inputPath, outputPaths)) {
        cachedSets += 1;
        return;
      }
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
      generatedSets += 1;
    }));
}

async function createFavicon() {
  const inputPath = path.join(publicRoot, 'assets/Mohamed Aiman Alter Ego.webp');
  const outputPath = path.join(publicRoot, 'favicon-64.png');
  if (await outputsAreCurrent(inputPath, [outputPath])) {
    cachedSets += 1;
    return;
  }
  await sharp(inputPath)
    .resize({ width: 64, height: 64, fit: 'cover' })
    .png({ compressionLevel: 9, palette: true })
    .toFile(outputPath);
  generatedSets += 1;
}

async function outputsAreCurrent(inputPath, outputPaths) {
  const inputModifiedAt = (await fs.stat(inputPath)).mtimeMs;
  const requiredModifiedAt = Math.max(inputModifiedAt, scriptModifiedAt);

  try {
    const outputStats = await Promise.all(outputPaths.map((outputPath) => fs.stat(outputPath)));
    return outputStats.every((stat) => stat.isFile() && stat.mtimeMs >= requiredModifiedAt);
  } catch {
    return false;
  }
}

async function resolvePublicRoot() {
  // On Linux the vendor build may create `public/`, while tracked source
  // images live in `Public/`. Select the tree that actually owns the sources.
  for (const name of ['Public', 'public']) {
    const candidate = path.join(projectRoot, name);
    try {
      if ((await fs.stat(path.join(candidate, 'assets', 'Mohamed Aiman Alter Ego.webp'))).isFile()) return candidate;
    } catch {
      // Try the other case-sensitive directory name.
    }
  }
  throw new Error('Could not find the public asset directory.');
}
