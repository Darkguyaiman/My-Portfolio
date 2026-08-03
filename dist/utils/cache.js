import 'dotenv/config';
const defaultRevalidateAfterMs = positiveInteger(process.env.CACHE_REVALIDATE_MS, 15000);
const defaultMaxStaleMs = positiveInteger(process.env.CACHE_MAX_STALE_MS, 5 * 60000);
const maximumEntries = positiveInteger(process.env.CACHE_MAX_ENTRIES, 50);
const retryAfterErrorMs = 5000;
const entries = new Map();
const inFlight = new Map();
const keyTags = new Map();
const generations = new Map();
const counters = {
    hits: 0,
    misses: 0,
    staleHits: 0,
    revalidations: 0,
    invalidations: 0,
};
export async function getCached(key, loader, options = {}) {
    const now = Date.now();
    const entry = entries.get(key);
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
export function invalidateCacheTags(...tags) {
    const requested = new Set(tags);
    let invalidated = 0;
    for (const [key, registeredTags] of keyTags) {
        if (![...registeredTags].some((tag) => requested.has(tag)))
            continue;
        if (entries.delete(key))
            invalidated += 1;
        generations.set(key, (generations.get(key) || 0) + 1);
        if (!inFlight.has(key)) {
            keyTags.delete(key);
            generations.delete(key);
        }
    }
    counters.invalidations += invalidated;
    return invalidated;
}
export function clearMemoryCache() {
    for (const key of keyTags.keys()) {
        generations.set(key, (generations.get(key) || 0) + 1);
    }
    entries.clear();
    keyTags.clear();
}
export function getMemoryCacheStats() {
    return {
        ...counters,
        size: entries.size,
        inFlight: inFlight.size,
    };
}
async function loadAndStore(key, loader, options, background) {
    const existingLoad = inFlight.get(key);
    if (existingLoad)
        return existingLoad;
    const generation = generations.get(key) || 0;
    if (background)
        counters.revalidations += 1;
    const load = loader()
        .then((value) => {
        if ((generations.get(key) || 0) === generation) {
            const now = Date.now();
            const entry = {
                value,
                tags: options.tags,
                loader,
                revalidateAfterMs: options.revalidateAfterMs,
                maxStaleMs: options.maxStaleMs,
                revalidateAt: now + options.revalidateAfterMs,
                expiresAt: now + options.revalidateAfterMs + options.maxStaleMs,
            };
            entries.set(key, entry);
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
            return staleEntry.value;
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
function normalizedOptions(options) {
    return {
        tags: new Set(options.tags || []),
        revalidateAfterMs: options.revalidateAfterMs ?? defaultRevalidateAfterMs,
        maxStaleMs: options.maxStaleMs ?? defaultMaxStaleMs,
    };
}
function touch(key, entry) {
    entries.delete(key);
    entries.set(key, entry);
}
function trimCache() {
    while (entries.size > maximumEntries) {
        const oldestKey = entries.keys().next().value;
        if (!oldestKey)
            break;
        entries.delete(oldestKey);
        keyTags.delete(oldestKey);
        if (inFlight.has(oldestKey)) {
            generations.set(oldestKey, (generations.get(oldestKey) || 0) + 1);
        }
        else {
            generations.delete(oldestKey);
        }
    }
}
function positiveInteger(value, fallback) {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}
const revalidationTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of entries) {
        if (now < entry.revalidateAt || now >= entry.expiresAt)
            continue;
        void loadAndStore(key, entry.loader, {
            tags: entry.tags,
            revalidateAfterMs: entry.revalidateAfterMs,
            maxStaleMs: entry.maxStaleMs,
        }, true);
    }
}, 1000);
revalidationTimer.unref();
