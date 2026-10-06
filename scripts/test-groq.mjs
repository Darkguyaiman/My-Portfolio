import assert from 'node:assert/strict';
import express from 'express';
import { getGroqApiKeys, GroqUnavailableError, requestGroqReply } from '../dist/utils/groq.js';

const body = { model: 'test-model', messages: [{ role: 'user', content: 'Hello' }] };
const completion = (content = 'Hello back') => Response.json({ choices: [{ message: { content } }] });
const warnings = [];
const originalWarn = console.warn;
console.warn = (...args) => warnings.push(args.join(' '));

try {
  assert.deepEqual(getGroqApiKeys({
    GROQ_API_KEY: ' primary ',
    GROQ_API_KEYS: 'list-one, primary, , list-two\nlist-three',
    GROQ_API_KEY_10: 'tenth',
    GROQ_API_KEY_2: 'second',
    GROQ_API_KEY_99: ' ',
    GROQ_API_KEY_OTHER: 'ignored',
    OTHER_API_KEY: 'ignored',
  }), ['primary', 'list-one', 'list-two', 'list-three', 'second', 'tenth']);
  assert.deepEqual(getGroqApiKeys({}), []);
  assert.deepEqual(getGroqApiKeys({ GROQ_API_KEY_7: 'only-numbered' }), ['only-numbered']);

  let attempts = [];
  const reply = await requestGroqReply(['secret-one', 'secret-two', 'secret-three', 'unused'], body, async (url, options) => {
    attempts.push(options.headers.Authorization);
    assert.equal(url, 'https://api.groq.com/openai/v1/chat/completions');
    assert.deepEqual(JSON.parse(options.body), body, 'Every fallback must preserve the conversation.');
    assert.ok(options.signal instanceof AbortSignal);
    if (attempts.length === 1) return new Response('rate limited', { status: 429 });
    if (attempts.length === 2) return new Response('unavailable', { status: 503 });
    return completion();
  });
  assert.equal(reply, 'Hello back');
  assert.deepEqual(attempts, ['Bearer secret-one', 'Bearer secret-two', 'Bearer secret-three']);

  attempts = [];
  assert.equal(await requestGroqReply(['a', 'b', 'c', 'd', 'e', 'f'], body, async (_url, options) => {
    attempts.push(options.headers.Authorization);
    switch (attempts.length) {
      case 1: throw new Error('network failure');
      case 2: return new Response('invalid key', { status: 401 });
      case 3: return new Response('not json', { status: 200 });
      case 4: return completion('   ');
      case 5: return Response.json({});
      default: return completion([{ type: 'text', text: ' Found ' }, { type: 'text', text: 'a reply ' }]);
    }
  }), 'Found a reply');
  assert.equal(attempts.length, 6);

  attempts = [];
  await assert.rejects(requestGroqReply(['duplicate', 'duplicate', ' ', 'last'], body, async (_url, options) => {
    attempts.push(options.headers.Authorization);
    return new Response('down', { status: 500 });
  }), GroqUnavailableError);
  assert.deepEqual(attempts, ['Bearer duplicate', 'Bearer last']);
  await assert.rejects(requestGroqReply([], body, async () => assert.fail('No key means no provider call.')), GroqUnavailableError);

  const manyKeys = getGroqApiKeys(Object.fromEntries(Array.from({ length: 125 }, (_, i) => [`GROQ_API_KEY_${i + 1}`, `key-${i + 1}`])));
  let manyAttempts = 0;
  assert.equal(await requestGroqReply(manyKeys, body, async () => {
    manyAttempts += 1;
    return manyAttempts === 125 ? completion() : new Response(null, { status: 429 });
  }), 'Hello back');
  assert.equal(manyAttempts, 125, 'Fallback must have no fixed key-count limit.');

  let timeoutAttempts = 0;
  // Keep the event loop alive for AbortSignal.timeout, whose timer is unreferenced.
  const keepAlive = setInterval(() => {}, 100);
  try {
    assert.equal(await requestGroqReply(['slow', 'healthy'], body, async (_url, options) => {
      timeoutAttempts += 1;
      if (timeoutAttempts === 2) return completion();
      return new Promise((_resolve, reject) => {
        options.signal.addEventListener('abort', () => reject(options.signal.reason), { once: true });
      });
    }, 20), 'Hello back');
    assert.equal(timeoutAttempts, 2, 'A hung request must advance to the next key.');
  } finally {
    clearInterval(keepAlive);
  }

  assert.ok(warnings.every((warning) => !/secret-one|secret-two|secret-three|duplicate/.test(warning)), 'Logs must not expose API keys.');
  await testChatRoute();
  console.log('Groq checks passed: key parsing, unlimited fallback, errors, timeouts, and chat responses.');
} finally {
  console.warn = originalWarn;
}

async function testChatRoute() {
  process.env.DOTENV_CONFIG_QUIET = 'true';
  const { pool } = await import('../dist/config/db.js');
  const { default: chatRoutes } = await import('../dist/routes/chatRoutes.js');
  const { clearMemoryCache } = await import('../dist/utils/cache.js');
  const savedKeys = Object.fromEntries(Object.entries(process.env).filter(([name]) => /^GROQ_API_KEY(?:S|_\d+)?$/.test(name)));
  const nativeFetch = globalThis.fetch;
  const originalQuery = pool.query;
  pool.query = async () => [[], []];
  clearMemoryCache();
  for (const name of Object.keys(savedKeys)) delete process.env[name];
  process.env.GROQ_API_KEY_1 = 'route-first';
  process.env.GROQ_API_KEY_2 = 'route-second';
  process.env.GROQ_API_KEY_10 = 'route-last';
  const app = express();
  app.use(express.json());
  app.use('/api/chat', chatRoutes);
  const server = await new Promise((resolve) => {
    const listener = app.listen(0, '127.0.0.1', () => resolve(listener));
  });

  try {
    const url = `http://127.0.0.1:${server.address().port}/api/chat`;
    const send = () => nativeFetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Tell me about Mohamed', history: [] }),
    });
    let attempts = [];
    globalThis.fetch = async (_url, options) => {
      attempts.push(options.headers.Authorization);
      return attempts.length < 3 ? new Response(null, { status: 429 }) : completion('Mohamed builds web apps.');
    };
    const success = await send();
    assert.equal(success.status, 200);
    assert.equal((await success.json()).reply, 'Mohamed builds web apps.');
    assert.deepEqual(attempts, ['Bearer route-first', 'Bearer route-second', 'Bearer route-last']);

    attempts = [];
    globalThis.fetch = async (_url, options) => {
      attempts.push(options.headers.Authorization);
      if (attempts.length === 2) throw new Error('offline');
      return new Response(null, { status: attempts.length === 1 ? 429 : 503 });
    };
    const failure = await send();
    assert.equal(failure.status, 503);
    assert.equal(attempts.length, 3, 'The route must exhaust all keys before showing sleepy.');
    assert.deepEqual(await failure.json(), {
      error: "Ai-man is sleepy — I'm going to sleep now.",
      expression: 'sleepy',
      laugh: false,
    });

    for (const name of ['GROQ_API_KEY_1', 'GROQ_API_KEY_2', 'GROQ_API_KEY_10']) delete process.env[name];
    globalThis.fetch = async () => assert.fail('Unconfigured chat must not call Groq.');
    const offline = await send();
    assert.equal(offline.status, 503);
    assert.match((await offline.json()).error, /configured/);
  } finally {
    globalThis.fetch = nativeFetch;
    pool.query = originalQuery;
    for (const name of ['GROQ_API_KEY_1', 'GROQ_API_KEY_2', 'GROQ_API_KEY_10']) delete process.env[name];
    Object.assign(process.env, savedKeys);
    clearMemoryCache();
    await new Promise((resolve) => server.close(resolve));
    await pool.end();
  }
}
