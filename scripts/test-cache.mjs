import assert from 'node:assert/strict';
import {
  clearMemoryCache,
  getCached,
  getMemoryCacheStats,
  invalidateCacheTags,
} from '../dist/utils/cache.js';

clearMemoryCache();

let coldLoads = 0;
const coldLoader = async () => {
  coldLoads += 1;
  await delay(30);
  return { version: coldLoads };
};
const concurrent = await Promise.all(Array.from({ length: 12 }, () => getCached(
  'test:coalesced',
  coldLoader,
  { tags: ['test'], revalidateAfterMs: 1_000, maxStaleMs: 1_000 },
)));
assert.equal(coldLoads, 1, 'Concurrent misses should share one loader call.');
assert.ok(concurrent.every((value) => value.version === 1));

let revalidationLoads = 0;
const revalidationLoader = async () => ({ version: ++revalidationLoads });
const first = await getCached('test:revalidation', revalidationLoader, {
  tags: ['revalidation'],
  revalidateAfterMs: 40,
  maxStaleMs: 1_000,
});
assert.equal(first.version, 1);
await delay(60);
const stale = await getCached('test:revalidation', revalidationLoader, {
  tags: ['revalidation'],
  revalidateAfterMs: 40,
  maxStaleMs: 1_000,
});
assert.equal(stale.version, 1, 'A stale hit should return immediately while refreshing.');
await delay(10);
const refreshed = await getCached('test:revalidation', revalidationLoader, {
  tags: ['revalidation'],
  revalidateAfterMs: 40,
  maxStaleMs: 1_000,
});
assert.equal(refreshed.version, 2, 'Background revalidation should replace the stale value.');

let invalidationLoads = 0;
const invalidationLoader = async () => ++invalidationLoads;
assert.equal(await getCached('test:invalidation', invalidationLoader, { tags: ['projects'] }), 1);
assert.equal(await getCached('test:invalidation', invalidationLoader, { tags: ['projects'] }), 1);
assert.equal(invalidateCacheTags('projects'), 1);
assert.equal(await getCached('test:invalidation', invalidationLoader, { tags: ['projects'] }), 2);

const stats = getMemoryCacheStats();
assert.ok(stats.hits > 0);
assert.ok(stats.staleHits > 0);
assert.ok(stats.misses > 0);
assert.ok(stats.revalidations > 0);
assert.ok(stats.invalidations > 0);

console.log(`Memory cache checks passed: ${coldLoads} coalesced cold load, ${revalidationLoads} revalidation loads.`);

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
