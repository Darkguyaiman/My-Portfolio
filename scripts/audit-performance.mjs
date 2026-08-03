import { execFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';

const execute = promisify(execFile);
const port = 3220;
const localOrigin = `http://127.0.0.1:${port}`;
const chromePath = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
let serverErrors = '';
const server = spawn(process.execPath, ['dist/server.js'], {
  cwd: process.cwd(),
  env: { ...process.env, PORT: String(port), SITE_URL: localOrigin },
  stdio: ['ignore', 'ignore', 'pipe'],
  windowsHide: true,
});
server.stderr.setEncoding('utf8');
server.stderr.on('data', (chunk) => { serverErrors += chunk; });

try {
  await waitUntilReady(`${localOrigin}/robots.txt`);
  const requestedFormFactor = process.argv[2];
  const requestedPath = process.argv[3] || '/';
  const requestedRuns = Math.max(1, Number.parseInt(process.argv[4] || '1', 10) || 1);
  const formFactors = ['mobile', 'desktop'].includes(requestedFormFactor)
    ? [requestedFormFactor]
    : ['mobile', 'desktop'];
  for (const formFactor of formFactors) {
    for (let run = 1; run <= requestedRuns; run += 1) {
      const report = await runLighthouse(formFactor, requestedPath);
      printSummary(`${formFactor}${requestedRuns > 1 ? ` run ${run}` : ''}`, report);
    }
  }
} finally {
  server.kill();
}

async function runLighthouse(formFactor, pathname) {
  const argumentsList = [
    '--yes',
    'lighthouse',
    new URL(pathname, localOrigin).href,
    '--only-categories=performance',
    '--output=json',
    '--output-path=stdout',
    '--quiet',
    `--chrome-path=${chromePath}`,
    '--chrome-flags=--headless --no-sandbox --disable-gpu',
  ];
  if (formFactor === 'desktop') argumentsList.push('--preset=desktop');

  const { stdout } = await execute('npx.cmd', argumentsList, {
    cwd: process.cwd(),
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    windowsHide: true,
    shell: true,
  });
  return JSON.parse(stdout.slice(stdout.indexOf('{')));
}

function printSummary(formFactor, report) {
  const audits = report.audits;
  const metrics = ['first-contentful-paint', 'largest-contentful-paint', 'speed-index', 'total-blocking-time', 'cumulative-layout-shift'];
  console.log(`\n${formFactor.toUpperCase()} performance: ${Math.round(report.categories.performance.score * 100)}`);
  for (const id of metrics) console.log(`- ${audits[id].title}: ${audits[id].displayValue}`);

  const opportunities = Object.entries(audits)
    .filter(([, audit]) => audit.details && (audit.details.overallSavingsMs > 0 || audit.details.overallSavingsBytes > 0))
    .sort(([, a], [, b]) => (b.details.overallSavingsMs || 0) - (a.details.overallSavingsMs || 0))
    .slice(0, 8);
  if (opportunities.length) {
    console.log('- Top opportunities:');
    for (const [, audit] of opportunities) {
      console.log(`  - ${audit.title}: ${audit.displayValue || 'see audit'}`);
    }
  }

  const lcpElement = audits['largest-contentful-paint-element']?.details?.items?.[0]?.items?.[0]?.node?.snippet;
  if (lcpElement) console.log(`- LCP element: ${lcpElement}`);

  const largestRequests = (audits['network-requests']?.details?.items || [])
    .filter((item) => item.resourceType !== 'Document')
    .sort((a, b) => b.transferSize - a.transferSize)
    .slice(0, 10);
  if (largestRequests.length) {
    console.log('- Largest transfers:');
    for (const request of largestRequests) {
      console.log(`  - ${Math.round(request.transferSize / 1024)} KiB ${new URL(request.url).pathname}`);
    }
  }

  for (const auditId of ['render-blocking-resources', 'uses-responsive-images', 'offscreen-images', 'unused-css-rules']) {
    const audit = audits[auditId];
    const items = audit?.details?.items || [];
    if (!items.length) continue;
    console.log(`- ${audit.title} details:`);
    for (const item of items.slice(0, 10)) {
      const pathname = item.url ? new URL(item.url).pathname : item.node?.snippet || 'resource';
      const savings = item.wastedBytes ? `, ${Math.round(item.wastedBytes / 1024)} KiB savings` : '';
      console.log(`  - ${pathname}${savings}`);
    }
  }
}

async function waitUntilReady(url) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    if (server.exitCode !== null) throw new Error(`Audit server exited early.\n${serverErrors}`);
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // The production server may still be binding its port.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Audit server did not become ready.\n${serverErrors}`);
}
