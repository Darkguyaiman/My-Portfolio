import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const PROJECT_MAX_WIDTH = 1600;
const PROJECT_THUMBNAIL_WIDTH = 480;
const LOGO_MAX_SIZE = 512;

export interface CmsUploadedFile {
  fieldname: string;
  originalname: string;
  mimetype: string;
  destination: string;
  filename: string;
  path: string;
  size: number;
}

export async function optimizeCmsImageUploads(files: CmsUploadedFile[]): Promise<void> {
  await Promise.all(files.map((file) => optimizeCmsImageUpload(file)));
}

export async function optimizeCmsImageUpload(file: CmsUploadedFile): Promise<void> {
  if (!file.mimetype.startsWith('image/') || !['projectImages', 'workLogo'].includes(file.fieldname)) return;

  const inputPath = path.resolve(file.path);
  const parsed = path.parse(inputPath);
  const outputPath = path.join(parsed.dir, `${parsed.name}-optimized.webp`);
  const stagingSuffix = crypto.randomBytes(6).toString('hex');
  const stagedOutputPath = `${outputPath}.${stagingSuffix}.tmp`;
  const isProjectImage = file.fieldname === 'projectImages';
  const thumbnailDirectory = path.join(parsed.dir, 'thumbnails');
  const thumbnailPath = path.join(thumbnailDirectory, path.basename(outputPath));
  const stagedThumbnailPath = `${thumbnailPath}.${stagingSuffix}.tmp`;
  const detailDirectory = path.join(parsed.dir, 'detail');
  const outputBasename = path.parse(outputPath).name;
  const detailWidths = [640, 1024, 1280];
  const detailPaths = detailWidths.map((width) => path.join(detailDirectory, `${outputBasename}-${width}.webp`));
  const stagedDetailPaths = detailPaths.map((detailPath) => `${detailPath}.${stagingSuffix}.tmp`);
  const metadataPath = path.join(detailDirectory, `${outputBasename}.json`);
  const stagedMetadataPath = `${metadataPath}.${stagingSuffix}.tmp`;

  try {
    const image = sharp(inputPath, {
      animated: file.mimetype === 'image/gif',
      failOn: 'warning',
      limitInputPixels: 80_000_000,
    }).rotate();

    await image
      .resize(isProjectImage
        ? { width: PROJECT_MAX_WIDTH, height: PROJECT_MAX_WIDTH, fit: 'inside', withoutEnlargement: true }
        : { width: LOGO_MAX_SIZE, height: LOGO_MAX_SIZE, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: isProjectImage ? 82 : 78, alphaQuality: 84, effort: 4, smartSubsample: true })
      .toFile(stagedOutputPath);

    if (isProjectImage) {
      await fs.mkdir(thumbnailDirectory, { recursive: true });
      await sharp(inputPath, { failOn: 'warning', limitInputPixels: 80_000_000 })
        .rotate()
        .resize({ width: PROJECT_THUMBNAIL_WIDTH, withoutEnlargement: true })
        .webp({ quality: 72, alphaQuality: 80, effort: 4, smartSubsample: true })
        .toFile(stagedThumbnailPath);
      await fs.mkdir(detailDirectory, { recursive: true });
      const variants = await Promise.all(detailWidths.map(async (width, index) => {
        const info = await sharp(inputPath, {
          animated: file.mimetype === 'image/gif',
          failOn: 'warning',
          limitInputPixels: 80_000_000,
        })
          .rotate()
          .resize({ width, withoutEnlargement: true })
          .webp({ quality: 78, alphaQuality: 82, effort: 4, smartSubsample: true })
          .toFile(stagedDetailPaths[index]);
        return { path: `detail/${path.basename(detailPaths[index])}`, width: info.width, height: info.height };
      }));
      const uniqueVariants = [...new Map(variants.map((variant) => [variant.width, variant])).values()];
      const largest = uniqueVariants[uniqueVariants.length - 1]!;
      await fs.writeFile(stagedMetadataPath, JSON.stringify({
        src: largest.path,
        width: largest.width,
        height: largest.height,
        sources: uniqueVariants.map(({ path: assetPath, width }) => ({ path: assetPath, width })),
      }));

      await Promise.all(detailPaths.map((detailPath, index) => fs.rename(stagedDetailPaths[index], detailPath)));
      await fs.rename(stagedMetadataPath, metadataPath);
      await fs.rename(stagedThumbnailPath, thumbnailPath);
    }

    await fs.rename(stagedOutputPath, outputPath);
    await fs.unlink(inputPath);

    const outputStats = await fs.stat(outputPath);
    file.path = outputPath;
    file.destination = parsed.dir;
    file.filename = path.basename(outputPath);
    file.mimetype = 'image/webp';
    file.size = outputStats.size;
  } catch (error) {
    await Promise.allSettled([
      fs.unlink(inputPath),
      fs.unlink(stagedOutputPath),
      fs.unlink(stagedThumbnailPath),
      fs.unlink(outputPath),
      fs.unlink(thumbnailPath),
      fs.unlink(stagedMetadataPath),
      fs.unlink(metadataPath),
      ...stagedDetailPaths.map((detailPath) => fs.unlink(detailPath)),
      ...detailPaths.map((detailPath) => fs.unlink(detailPath)),
    ]);
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Could not optimize uploaded image "${file.originalname}": ${message}`);
  }
}
