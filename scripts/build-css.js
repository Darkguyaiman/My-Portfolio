import { spawnSync } from 'node:child_process';
import path from 'node:path';

const cli = path.join(
  process.cwd(),
  'node_modules',
  '@tailwindcss',
  'cli',
  'dist',
  'index.mjs',
);

const stylesheets = [
  'app',
  'home',
  'projects',
  'privacy',
  'detail',
  'admin',
  'admin-login',
];

for (const stylesheet of stylesheets) {
  const result = spawnSync(
    process.execPath,
    [
      cli,
      '-i',
      `./src/css/${stylesheet}.css`,
      '-o',
      `./public/css/${stylesheet}.min.css`,
      '--minify',
    ],
    { stdio: 'inherit' },
  );

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
