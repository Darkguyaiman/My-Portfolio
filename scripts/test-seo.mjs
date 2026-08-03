import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';

const port = 3219;
const canonicalOrigin = 'https://darkguyaiman.com';
const localOrigin = `http://127.0.0.1:${port}`;
let serverErrors = '';
const server = spawn(process.execPath, ['dist/server.js'], {
  cwd: process.cwd(),
  env: { ...process.env, PORT: String(port), SITE_URL: canonicalOrigin },
  stdio: ['ignore', 'ignore', 'pipe'],
  windowsHide: true,
});
server.stderr.setEncoding('utf8');
server.stderr.on('data', (chunk) => { serverErrors += chunk; });

try {
  await waitUntilReady(`${localOrigin}/robots.txt`);

  const [home, projects, sitemap, robots, llms, portfolio] = await Promise.all([
    get('/'),
    get('/projects'),
    get('/sitemap.xml'),
    get('/robots.txt'),
    get('/llms.txt'),
    get('/portfolio.json'),
  ]);
  const portfolioData = JSON.parse(portfolio.body);
  const sitemapUrls = [...sitemap.body.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
  const detailUrl = sitemapUrls.find((url) => /\/projects\/[^/]+$/.test(url));

  assert.equal(home.status, 200);
  assert.match(home.body, /<title>Mohamed Aiman \| Full-Stack/);
  assert.match(home.body, /<script type="application\/ld\+json">/);
  assertStructuredData(home.body);
  assert.ok(count(home.body, 'class="project-card"') > 0, 'Homepage should contain server-rendered project cards.');
  assert.equal(projects.status, 200);
  assert.ok(count(projects.body, 'class="project-card"') > 0, 'Projects page should contain server-rendered project cards.');
  assertStructuredData(projects.body);
  assert.equal(sitemap.status, 200);
  assert.ok(sitemapUrls.length >= 4, 'Sitemap should contain public pages.');
  assert.ok(sitemapUrls.every((url) => url.startsWith(canonicalOrigin)), 'Sitemap URLs should use SITE_URL.');
  assert.match(robots.body, /Sitemap: https:\/\/darkguyaiman\.com\/sitemap\.xml/);
  assert.match(robots.body, /User-agent: GPTBot/);
  assert.match(llms.body, /## Projects/);
  assert.equal(portfolio.status, 200);
  assert.ok(Array.isArray(portfolioData.projects) && portfolioData.projects.length > 0);

  if (detailUrl) {
    const detailPath = new URL(detailUrl).pathname;
    const detail = await get(detailPath);
    assert.equal(detail.status, 200);
    assert.match(detail.body, /<h1 class="project-detail-title"/);
    assert.match(detail.body, /srcset="\/projects\/detail\//, 'Project detail should use responsive optimized screenshots.');
    assert.doesNotMatch(detail.body, /function loadProjectDetail/, 'Server-rendered project content should not be replaced after load.');
    assert.ok(detail.body.includes(`href="${detailUrl}"`), 'Project detail should emit its canonical URL.');
    assertStructuredData(detail.body);
  }

  console.log(`SEO integration checks passed: ${sitemapUrls.length} sitemap URLs, ${portfolioData.projects.length} projects.`);
} finally {
  server.kill();
}

async function get(pathname) {
  const response = await fetch(`${localOrigin}${pathname}`);
  return { status: response.status, body: await response.text() };
}

async function waitUntilReady(url) {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    if (server.exitCode !== null) {
      throw new Error(`Test server exited before becoming ready.\n${serverErrors}`);
    }
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // The server may still be binding the port or opening its database pool.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Test server did not become ready.\n${serverErrors}`);
}

function count(value, needle) {
  return value.split(needle).length - 1;
}

function assertStructuredData(html) {
  const matches = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  assert.ok(matches.length > 0, 'Page should include JSON-LD.');
  matches.forEach((match) => JSON.parse(match[1]));
}
