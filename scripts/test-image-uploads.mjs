import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { optimizeCmsImageUpload } from '../dist/utils/imageUploads.js';

sharp.cache(false);
const testRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'portfolio-image-upload-'));

try {
  const projectInput = path.join(testRoot, 'project.png');
  await sharp({
    create: { width: 2200, height: 1200, channels: 4, background: '#d9253f' },
  }).png().toFile(projectInput);

  const projectFile = createFile('projectImages', projectInput, 'project.png', 'image/png');
  await optimizeCmsImageUpload(projectFile);
  assert.equal(projectFile.mimetype, 'image/webp');
  assert.match(projectFile.filename, /-optimized\.webp$/);
  await assert.rejects(fs.access(projectInput));

  const projectMetadata = await sharp(projectFile.path).metadata();
  assert.ok((projectMetadata.width || 0) <= 1600);
  const thumbnailPath = path.join(testRoot, 'thumbnails', projectFile.filename);
  const thumbnailMetadata = await sharp(thumbnailPath).metadata();
  assert.ok((thumbnailMetadata.width || 0) <= 480);
  const detailMetadataPath = path.join(testRoot, 'detail', `${path.parse(projectFile.filename).name}.json`);
  const detailMetadata = JSON.parse(await fs.readFile(detailMetadataPath, 'utf8'));
  assert.equal(detailMetadata.sources.length, 3);
  assert.ok(detailMetadata.sources.some((source) => source.width <= 640));
  assert.ok(detailMetadata.sources.every((source) => source.width <= 1280));

  const logoInput = path.join(testRoot, 'logo.jpg');
  await sharp({
    create: { width: 1400, height: 900, channels: 3, background: '#1a1a1c' },
  }).jpeg().toFile(logoInput);
  const logoFile = createFile('workLogo', logoInput, 'logo.jpg', 'image/jpeg');
  await optimizeCmsImageUpload(logoFile);
  const logoMetadata = await sharp(logoFile.path).metadata();
  assert.ok((logoMetadata.width || 0) <= 512);
  assert.ok((logoMetadata.height || 0) <= 512);

  console.log('CMS image upload checks passed: optimized WebP, project thumbnail, and work logo generated.');
} finally {
  await new Promise((resolve) => setTimeout(resolve, 200));
  await fs.rm(testRoot, { recursive: true, force: true, maxRetries: 20, retryDelay: 100 });
}

function createFile(fieldname, filePath, originalname, mimetype) {
  return {
    fieldname,
    originalname,
    mimetype,
    destination: path.dirname(filePath),
    filename: path.basename(filePath),
    path: filePath,
    size: 0,
  };
}
