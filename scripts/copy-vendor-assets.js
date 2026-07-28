import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');
const vendorRoot = path.join(root, 'public', 'vendor');
const nodeModules = path.join(root, 'node_modules');

function copyFile(source, target) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
}

function copyDir(source, target) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.cpSync(source, target, { recursive: true });
}

function copyFontFiles(packageName, targetDir, fileNames) {
  const sourceDir = path.join(nodeModules, packageName, 'files');
  for (const fileName of fileNames) {
    copyFile(path.join(sourceDir, fileName), path.join(vendorRoot, 'fonts', targetDir, fileName));
  }
}

fs.rmSync(vendorRoot, { recursive: true, force: true });

copyFontFiles('@fontsource/inter', 'inter', [
  'inter-latin-300-normal.woff2',
  'inter-latin-400-normal.woff2',
  'inter-latin-500-normal.woff2',
  'inter-latin-600-normal.woff2',
  'inter-latin-700-normal.woff2',
]);

copyFontFiles('@fontsource/press-start-2p', 'press-start-2p', [
  'press-start-2p-latin-400-normal.woff2',
]);

copyFontFiles('@fontsource/playfair-display', 'playfair-display', [
  'playfair-display-latin-400-italic.woff2',
  'playfair-display-latin-700-normal.woff2',
  'playfair-display-latin-800-normal.woff2',
]);

copyFile(
  path.join(nodeModules, '@fortawesome', 'fontawesome-free', 'css', 'all.min.css'),
  path.join(vendorRoot, 'fontawesome', 'css', 'all.min.css'),
);
copyDir(
  path.join(nodeModules, '@fortawesome', 'fontawesome-free', 'webfonts'),
  path.join(vendorRoot, 'fontawesome', 'webfonts'),
);

copyFile(
  path.join(nodeModules, 'devicon', 'devicon.min.css'),
  path.join(vendorRoot, 'devicon', 'devicon.min.css'),
);
copyDir(
  path.join(nodeModules, 'devicon', 'fonts'),
  path.join(vendorRoot, 'devicon', 'fonts'),
);

copyFile(
  path.join(nodeModules, 'lenis', 'dist', 'lenis.min.js'),
  path.join(vendorRoot, 'lenis', 'lenis.min.js'),
);
copyFile(
  path.join(nodeModules, 'lenis', 'dist', 'lenis.css'),
  path.join(vendorRoot, 'lenis', 'lenis.css'),
);

console.log('Vendor assets copied to public/vendor');
