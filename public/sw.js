const PAGE_CACHE = 'portfolio-pages-v1';
const ASSET_CACHE = 'portfolio-assets-v1';
const META_CACHE = 'portfolio-meta-v1';
const VERSION_KEY = '/__portfolio-cache-version__';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (isPublicPage(request, url)) {
    event.respondWith(cachedPage(request));
    return;
  }

  if (isStaticAsset(request, url)) event.respondWith(cachedAsset(request));
});

self.addEventListener('message', (event) => {
  if (event.data?.type !== 'CACHE_URLS' || !Array.isArray(event.data.urls)) return;
  event.waitUntil(cachePages(event.data.urls));
});

function isPublicPage(request, url) {
  if (request.mode !== 'navigate') return false;
  return url.pathname === '/'
    || url.pathname === '/projects'
    || url.pathname === '/privacy'
    || (/^\/projects\/[^/]+$/.test(url.pathname) && url.pathname !== '/projects/detail');
}

function isStaticAsset(request, url) {
  if (url.pathname === '/sw.js' || url.pathname === '/cache-version') return false;
  if (url.pathname.startsWith('/admin') || url.pathname.startsWith('/api/')) return false;
  return ['style', 'script', 'font', 'image', 'manifest'].includes(request.destination);
}

async function cachedPage(request) {
  const versionState = await refreshVersion();
  const cache = await caches.open(PAGE_CACHE);
  const cached = await cache.match(request, { ignoreSearch: true });
  if (cached && versionState.available && !versionState.changed) return cached;

  try {
    const response = await fetch(versionState.changed
      ? cacheRefreshRequest(request, versionState.currentVersion)
      : request);
    if (response.ok && response.type === 'basic') await cache.put(request, response.clone());
    return response;
  } catch (error) {
    if (cached) return cached;
    throw error;
  }
}

async function cachedAsset(request) {
  const cache = await caches.open(ASSET_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;

  const response = await fetch(request, { cache: 'no-cache' });
  if (response.ok && response.type === 'basic') await cache.put(request, response.clone());
  return response;
}

async function refreshVersion() {
  const meta = await caches.open(META_CACHE);
  const storedResponse = await meta.match(VERSION_KEY);
  const storedVersion = storedResponse ? await storedResponse.text() : '';

  try {
    const response = await fetch('/cache-version', { cache: 'no-store' });
    if (!response.ok) {
      return { available: Boolean(storedVersion), changed: false, currentVersion: storedVersion };
    }
    const currentVersion = await response.text();
    const changed = Boolean(storedVersion && storedVersion !== currentVersion);
    if (changed) {
      await Promise.all([caches.delete(PAGE_CACHE), caches.delete(ASSET_CACHE)]);
    }
    if (storedVersion !== currentVersion) {
      await meta.put(VERSION_KEY, new Response(currentVersion, {
        headers: { 'Content-Type': 'text/plain' },
      }));
    }
    return { available: true, changed, currentVersion };
  } catch {
    return { available: Boolean(storedVersion), changed: false, currentVersion: storedVersion };
  }
}

async function cachePages(urls) {
  const versionState = await refreshVersion();
  const cache = await caches.open(PAGE_CACHE);
  await Promise.all(urls.map(async (value) => {
    const url = new URL(value, self.location.origin);
    const request = new Request(url.href, { credentials: 'same-origin' });
    if (!isPublicPage({ mode: 'navigate' }, url)) return;
    try {
      const response = await fetch(versionState.changed
        ? cacheRefreshRequest(request, versionState.currentVersion)
        : request);
      if (response.ok && response.type === 'basic') await cache.put(request, response);
    } catch {
      // Warming is best-effort; navigation retains its normal network fallback.
    }
  }));
}

function cacheRefreshRequest(request, version) {
  const headers = new Headers(request.headers);
  headers.set('X-Portfolio-Cache-Refresh', '1');
  const url = new URL(request.url);
  url.searchParams.set('__portfolio_version', version || Date.now().toString());
  return new Request(url, {
    method: request.method,
    headers,
    credentials: request.credentials,
    redirect: request.redirect,
  });
}
