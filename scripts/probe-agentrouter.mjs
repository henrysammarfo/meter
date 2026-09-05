import { readFileSync } from 'node:fs';
for (const file of ['.env', 'grounds/.env']) {
  try {
    for (const line of readFileSync(file, 'utf8').split('\n')) {
      if (!line || line.startsWith('#') || !line.includes('=')) continue;
      const i = line.indexOf('=');
      process.env[line.slice(0,i)] = line.slice(i+1);
    }
  } catch {}
}
const base = (process.env.AGENTROUTER_BASE_URL || '').replace(/\/$/, '');
const key = process.env.AGENTROUTER_API_KEY || '';
const res = await fetch(`${base}/chat/completions`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${key}`,
    'content-type': 'application/json',
    Accept: 'application/json',
  },
  body: JSON.stringify({
    model: process.env.AGENTROUTER_MODEL || 'gpt-4o-mini',
    messages: [{ role: 'user', content: 'Reply exactly: METER_OK' }],
    max_tokens: 16,
  }),
});
const text = await res.text();
console.log(JSON.stringify({
  base,
  status: res.status,
  waf: /aliyun_waf|aliyunCaptcha/i.test(text),
  invalidKey: /Invalid API Key/i.test(text),
  snippet: text.slice(0, 160).replace(/\s+/g, ' '),
}));
