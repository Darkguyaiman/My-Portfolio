const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const REQUEST_TIMEOUT_MS = 15000;
/** Accept the original key, a key list, and any number of numbered keys. */
export function getGroqApiKeys(env = process.env) {
    const numberedNames = Object.keys(env)
        .filter((name) => /^GROQ_API_KEY_\d+$/.test(name))
        .sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
    const values = [env.GROQ_API_KEY, env.GROQ_API_KEYS, ...numberedNames.map((name) => env[name])];
    return [...new Set(values.flatMap((value) => (value || '').split(/[\s,]+/)).filter(Boolean))];
}
export class GroqUnavailableError extends Error {
    constructor() {
        super('All configured Groq keys failed.');
        this.name = 'GroqUnavailableError';
    }
}
function extractAssistantText(payload) {
    const choice = payload
        ?.choices?.[0]?.message;
    if (!choice)
        return '';
    const content = choice.content;
    if (typeof content === 'string')
        return content.trim();
    if (Array.isArray(content)) {
        return content
            .map((part) => (typeof part === 'string' ? part : part?.text || ''))
            .join('')
            .trim();
    }
    return '';
}
/** Each distinct key gets one bounded attempt, stopping at the first usable reply. */
export async function requestGroqReply(apiKeys, body, fetcher = fetch, timeoutMs = REQUEST_TIMEOUT_MS) {
    const requestBody = JSON.stringify(body);
    const uniqueKeys = [...new Set(apiKeys.map((key) => key.trim()).filter(Boolean))];
    for (const [index, apiKey] of uniqueKeys.entries()) {
        try {
            const response = await fetcher(GROQ_URL, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: requestBody,
                signal: AbortSignal.timeout(timeoutMs),
            });
            if (!response.ok) {
                // Log only the position and status; provider errors can contain secrets.
                console.warn(`Groq key ${index + 1}/${uniqueKeys.length} failed: HTTP ${response.status}`);
                await response.body?.cancel().catch(() => undefined);
                continue;
            }
            const reply = extractAssistantText(await response.json());
            if (reply)
                return reply;
            console.warn(`Groq key ${index + 1}/${uniqueKeys.length} returned an empty reply.`);
        }
        catch {
            console.warn(`Groq key ${index + 1}/${uniqueKeys.length} request failed or timed out.`);
        }
    }
    throw new GroqUnavailableError();
}
