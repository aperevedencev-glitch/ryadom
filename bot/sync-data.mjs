// Переносит анкеты психологов с сайта в бота: node bot/sync-data.mjs
// Читает ../psychologists-data.js и worker.src.js, пишет worker.js (его и вставляйте в Cloudflare).
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const here = dirname(fileURLToPath(import.meta.url));
const site = readFileSync(join(here, '..', 'psychologists-data.js'), 'utf8');
const PSY_RAW = new Function(site + '; return PSY_RAW;')();
const data = PSY_RAW.map((p) => ({
  id: p.id, name: p.name, title: p.title, since: p.practiceSince, tier: p.tier, topics: p.topics,
  approaches: p.approaches, clients: p.clients, formats: p.formats, city: p.city || null,
  tagline: p.tagline, schedule: p.schedule,
}));
const src = readFileSync(join(here, 'worker.src.js'), 'utf8');
const out = src.replace('/*PSY_DATA*/[]', JSON.stringify(data, null, 1).replace(/\n\s*/g, ' '));
writeFileSync(join(here, 'worker.js'),
  '// СОБРАНО АВТОМАТИЧЕСКИ из worker.src.js и ../psychologists-data.js командой: node bot/sync-data.mjs\n' + out);
console.log(`worker.js собран: ${data.length} психологов`);
