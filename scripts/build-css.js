import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const cli = path.join(
  process.cwd(),
  'node_modules',
  '@tailwindcss',
  'cli',
  'dist',
  'index.mjs',
);
const publicRoot = path.join(process.cwd(), 'public');
const cssRoot = path.join(publicRoot, 'css');
fs.mkdirSync(cssRoot, { recursive: true });

const stylesheets = [
  'app',
  'home',
  'projects',
  'privacy',
  'detail',
  'not-found',
  'admin',
  'admin-login',
];

await Promise.all(stylesheets.map(buildStylesheet));

const pageBundles = {
  'home-page': ['app', 'home', 'projects'],
  'projects-page': ['app', 'projects'],
  'privacy-page': ['app', 'privacy'],
  'detail-page': ['app', 'detail'],
  'not-found-page': ['app', 'not-found'],
};

for (const [bundleName, bundleStylesheets] of Object.entries(pageBundles)) {
  const bundle = bundleStylesheets
    .map((stylesheet) => fs.readFileSync(path.join(cssRoot, `${stylesheet}.min.css`), 'utf8'))
    .join('');
  fs.writeFileSync(path.join(cssRoot, `${bundleName}.min.css`), bundle);
}

function buildStylesheet(stylesheet) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [
        cli,
        '-i',
        `./src/css/${stylesheet}.css`,
        '-o',
        path.join(cssRoot, `${stylesheet}.min.css`),
        '--minify',
      ],
      { stdio: 'inherit', windowsHide: true },
    );

    child.once('error', reject);
    child.once('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`CSS build failed for ${stylesheet} with exit code ${code ?? 1}.`));
    });
  });
}
