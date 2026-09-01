import 'dotenv/config';

const zoneId = process.env.CLOUDFLARE_ZONE_ID || '';
const apiToken = process.env.CLOUDFLARE_API_TOKEN || '';
const purgeEnabled = process.env.NODE_ENV === 'production' && Boolean(zoneId && apiToken);
const debounceMs = 1_500;
let purgeTimer: ReturnType<typeof setTimeout> | null = null;

export function scheduleCloudflarePurge(): void {
  if (!purgeEnabled) return;
  if (purgeTimer) clearTimeout(purgeTimer);
  purgeTimer = setTimeout(() => {
    purgeTimer = null;
    void purgeCloudflareCache();
  }, debounceMs);
  purgeTimer.unref();
}

async function purgeCloudflareCache(): Promise<void> {
  try {
    const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ purge_everything: true }),
    });
    if (!response.ok) {
      console.error('Cloudflare cache purge failed:', response.status, await response.text());
    }
  } catch (error) {
    console.error('Cloudflare cache purge failed:', error);
  }
}
