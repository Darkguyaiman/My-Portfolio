import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const publicJs = path.join(process.cwd(), 'public', 'js');
fs.mkdirSync(publicJs, { recursive: true });

const bundles = [
  { input: './src/js/app.js', output: './public/js/app.min.js' },
  { input: './src/js/dark-ai-chat.js', output: './public/js/dark-ai-chat.min.js' },
];

await Promise.all(bundles.map(minifyBundle));

function minifyBundle({ input, output }) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [
        path.join(process.cwd(), 'node_modules', 'terser', 'bin', 'terser'),
        input,
        '--compress',
        '--mangle',
        '--output',
        output,
      ],
      { stdio: 'inherit', windowsHide: true },
    );

    child.once('error', reject);
    child.once('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`JS build failed for ${input} with exit code ${code ?? 1}.`));
    });
  });
}
