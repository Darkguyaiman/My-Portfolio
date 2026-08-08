import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import subsetFont from 'subset-font';

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

const deviconClasses = [
  'bootstrap-plain',
  'css3-plain',
  'express-original',
  'google-plain',
  'googlecloud-plain',
  'html5-plain',
  'javascript-plain',
  'jquery-plain',
  'mysql-plain',
  'nextjs-plain',
  'nginx-original',
  'python-plain',
  'react-original',
  'tailwindcss-plain',
  'typescript-plain',
];

const deviconRoot = path.join(nodeModules, 'devicon');
const deviconCss = fs.readFileSync(path.join(deviconRoot, 'devicon.min.css'), 'utf8');
const selectedSelectors = new Set(deviconClasses.map((name) => `.devicon-${name}`));
const glyphs = [];
const subsetRules = [];

for (const match of deviconCss.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
  const selectors = match[1].split(',').map((selector) => selector.trim());
  const declarations = match[2];
  const retained = selectors.filter((selector) =>
    [...selectedSelectors].some((selected) => selector === selected || selector === `${selected}:before`),
  );
  if (!retained.length) continue;
  const content = declarations.match(/content:"([^"]+)"/u)?.[1];
  if (content) glyphs.push(content);
  subsetRules.push(`${retained.join(',')}{${declarations}}`);
}

const subset = await subsetFont(
  fs.readFileSync(path.join(deviconRoot, 'fonts', 'devicon.ttf')),
  [...new Set(glyphs)].join(''),
  { targetFormat: 'woff2' },
);
const deviconOutput = path.join(vendorRoot, 'devicon');
fs.mkdirSync(path.join(deviconOutput, 'fonts'), { recursive: true });
fs.writeFileSync(path.join(deviconOutput, 'fonts', 'devicon-subset.woff2'), subset);
fs.writeFileSync(
  path.join(deviconOutput, 'devicon-subset.css'),
  `@font-face{font-family:"devicon";src:url("fonts/devicon-subset.woff2") format("woff2");font-weight:normal;font-style:normal;font-display:block}[class^=devicon-],[class*=" devicon-"]{font-family:"devicon"!important;speak:never;font-style:normal;font-weight:normal;font-variant:normal;text-transform:none;line-height:1;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}${subsetRules.join('')}`,
);

console.log('Vendor assets copied to public/vendor');
