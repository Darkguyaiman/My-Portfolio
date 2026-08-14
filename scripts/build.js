import { spawn } from 'node:child_process';

const assetTasks = ['build:vendor', 'build:images', 'build:css', 'build:js'];
const tasks = process.argv.includes('--assets')
  ? assetTasks
  : ['build:server', ...assetTasks];
const npmEntryPoint = process.env.npm_execpath;
const startedAt = performance.now();

console.log(`Building ${tasks.length} independent targets in parallel...`);

const results = await Promise.all(tasks.map(runTask));
const failed = results.filter((result) => result.code !== 0);

if (failed.length) {
  for (const result of failed) {
    console.error(`${result.task} failed with exit code ${result.code}.`);
  }
  process.exit(1);
}

console.log(`Build completed in ${((performance.now() - startedAt) / 1000).toFixed(2)}s.`);

function runTask(task) {
  return new Promise((resolve) => {
    const command = npmEntryPoint ? process.execPath : (process.platform === 'win32' ? 'npm.cmd' : 'npm');
    const args = npmEntryPoint ? [npmEntryPoint, 'run', task] : ['run', task];
    const child = spawn(command, args, {
      cwd: process.cwd(),
      env: process.env,
      stdio: 'inherit',
      windowsHide: true,
    });

    child.once('error', (error) => {
      console.error(`Could not start ${task}:`, error);
      resolve({ task, code: 1 });
    });
    child.once('exit', (code) => resolve({ task, code: code ?? 1 }));
  });
}
