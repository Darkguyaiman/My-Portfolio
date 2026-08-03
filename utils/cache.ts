import 'dotenv/config';

type CacheLoader<T> = () => Promise<T>;

interface CacheOptions {
  tags?: string[];
  revalidateAfterMs?: number;
  maxStaleMs?: number;
}

interface CacheEntry<T> {
  value: T;
  tags: Set<string>;
  loader: CacheLoader<T>;
  revalidateAfterMs: number;
  maxStaleMs: number;
  revalidateAt: number;
  expiresAt: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  staleHits: number;
  revalidations: number;
  invalidations: number;
  size: number;
  inFlight: number;
}

const defaultRevalidateAfterMs = positiveInteger(process.env.CACHE_REVALIDATE_MS, 15_000);
const defaultMaxStaleMs = positiveInteger(process.env.CACHE_MAX_STALE_MS, 5 * 60_000);
const maximumEntries = positiveInteger(process.env.CACHE_MAX_ENTRIES, 50);
const retryAfterErrorMs = 5_000;
const entries = new Map<string, CacheEntry<unknown>>();
const inFlight = new Map<string, Promise<unknown>>();
const keyTags = new Map<string, Set<string>>();
const generations = new Map<string, number>();
const counters = {
  hits: 0,
  misses: 0,
  staleHits: 0,
  revalidations: 0,
  invalidations: 0,
};

export async function getCached<T>(key: string, loader: CacheLoader<T>, options: CacheOptions = {}): Promise<T> {
  const now = Date.now();
  const entry = entries.get(key) as CacheEntry<T> | undefined;
  const tags = new Set(options.tags || []);
  keyTags.set(key, tags);

  if (entry && now < entry.revalidateAt) {
    counters.hits += 1;
    touch(key, entry);
    return entry.value;
  }

  if (entry && now < entry.expiresAt) {
    counters.staleHits += 1;
    touch(key, entry);
    void loadAndStore(key, loader, normalizedOptions(options), true);
    return entry.value;
  }

  counters.misses += 1;
  return loadAndStore(key, loader, normalizedOptions(options), false);
}

export function invalidateCacheTags(...tags: string[]): number {
  const requested = new Set(tags);
  let invalidated = 0;

  for (const [key, registeredTags] of keyTags) {
    if (![...registeredTags].some((tag) => requested.has(tag))) continue;
    if (entries.delete(key)) invalidated += 1;
    generations.set(key, (generations.get(key) || 0) + 1);
    if (!inFlight.has(key)) {
      keyTags.delete(key);
      generations.delete(key);
    }
  }

  counters.invalidations += invalidated;
  return invalidated;
}

export function clearMemoryCache(): void {
  for (const key of keyTags.keys()) {
    generations.set(key, (generations.get(key) || 0) + 1);
  }
  entries.clear();
  keyTags.clear();
}

export function getMemoryCacheStats(): CacheStats {
  return {
    ...counters,
    size: entries.size,
    inFlight: inFlight.size,
  };
}

async function loadAndStore<T>(
  key: string,
  loader: CacheLoader<T>,
  options: Required<Pick<CacheOptions, 'revalidateAfterMs' | 'maxStaleMs'>> & { tags: Set<string> },
  background: boolean,
): Promise<T> {
  const existingLoad = inFlight.get(key) as Promise<T> | undefined;
  if (existingLoad) return existingLoad;

  const generation = generations.get(key) || 0;
  if (background) counters.revalidations += 1;

  const load = loader()
    .then((value) => {
      if ((generations.get(key) || 0) === generation) {
        const now = Date.now();
        const entry: CacheEntry<T> = {
          value,
          tags: options.tags,
          loader,
          revalidateAfterMs: options.revalidateAfterMs,
          maxStaleMs: options.maxStaleMs,
          revalidateAt: now + options.revalidateAfterMs,
          expiresAt: now + options.revalidateAfterMs + options.maxStaleMs,
        };
        entries.set(key, entry as CacheEntry<unknown>);
        keyTags.set(key, options.tags);
        trimCache();
      }
      return value;
    })
    .catch((error) => {
      const staleEntry = entries.get(key);
      if (background && staleEntry && Date.now() < staleEntry.expiresAt) {
        staleEntry.revalidateAt = Math.min(staleEntry.expiresAt, Date.now() + retryAfterErrorMs);
        console.error(`Cache revalidation failed for ${key}; serving the previous value:`, error);
        return staleEntry.value as T;
      }
      throw error;
    })
    .finally(() => {
      if (inFlight.get(key) === load) {
        inFlight.delete(key);
        if (!entries.has(key)) {
          keyTags.delete(key);
          generations.delete(key);
        }
      }
    });

  inFlight.set(key, load);
  return load;
}

function normalizedOptions(options: CacheOptions) {
  return {
    tags: new Set(options.tags || []),
    revalidateAfterMs: options.revalidateAfterMs ?? defaultRevalidateAfterMs,
    maxStaleMs: options.maxStaleMs ?? defaultMaxStaleMs,
  };
}

function touch(key: string, entry: CacheEntry<unknown>): void {
  entries.delete(key);
  entries.set(key, entry);
}

function trimCache(): void {
  while (entries.size > maximumEntries) {
    const oldestKey = entries.keys().next().value as string | undefined;
    if (!oldestKey) break;
    entries.delete(oldestKey);
    keyTags.delete(oldestKey);
    if (inFlight.has(oldestKey)) {
      generations.set(oldestKey, (generations.get(oldestKey) || 0) + 1);
    } else {
      generations.delete(oldestKey);
    }
  }
}

function positiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

const revalidationTimer = setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of entries) {
    if (now < entry.revalidateAt || now >= entry.expiresAt) continue;
    void loadAndStore(key, entry.loader, {
      tags: entry.tags,
      revalidateAfterMs: entry.revalidateAfterMs,
      maxStaleMs: entry.maxStaleMs,
    }, true);
  }
}, 1_000);
revalidationTimer.unref();
