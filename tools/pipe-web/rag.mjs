// Local RAG for pipe-web: chunk tickets + AGENTS.md/PROJECT_MASTER.md by section, embed on this machine
// (multilingual-e5-small via transformers.js, no data leaves the box), cosine search in memory.
// Vectors are cached in .cache/vectors.json keyed by chunk hash, so only changed chunks are re-embedded.
import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { relative } from 'node:path';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..');
const cacheFile = join(here, '.cache', 'vectors.json');
const MODEL = 'Xenova/multilingual-e5-small';
const MAX = 1200; // chars per chunk; shortcut: char-based split, upgrade to token-based if answers get cut mid-sentence

let extractor, chunks = [], vecs = [], ready = false, building = null;

export function chunkMarkdown(source, text) {
  const out = [];
  const title = (text.match(/^#\s+(.*)$/m) || [, source])[1];
  for (const sec of text.split(/\n(?=## )/)) {
    const head = (sec.match(/^##\s+(.*)$/m) || [, ''])[1];
    for (let i = 0; i < sec.length; i += MAX) {
      const body = sec.slice(i, i + MAX).trim();
      if (body.length > 40 && !/^(Xem thêm|Mục lục|See also|Related)/i.test(head)) out.push({ source, title, section: head, text: body });
    }
  }
  return out;
}

function collect() {
  const files = [];
  const td = join(root, '.ai', 'tasks');
  for (const f of readdirSync(td)) if (f.endsWith('.md') && !f.startsWith('_')) files.push(['.ai/tasks/' + f, join(td, f)]);
  for (const f of ['AGENTS.md', 'PROJECT_MASTER.md']) if (existsSync(join(root, f))) files.push([f, join(root, f)]);
  // Extra markdown trees: RAG_EXTRA_DIRS="label=path;label2=path2", default = sibling HRM wiki when present.
  const hrm = join(root, '..', 'hrm-wiki_20261029', 'docs', 'wiki');
  const extra = process.env.RAG_EXTRA_DIRS ? process.env.RAG_EXTRA_DIRS.split(';').map(x => x.split('=')) : existsSync(hrm) ? [['hrm-wiki', hrm]] : [];
  const walk = d => readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(join(d, e.name)) : e.name.endsWith('.md') && !['index.md', 'log.md'].includes(e.name) ?[join(d, e.name)] : []);
  for (const [label, dir] of extra) for (const p of walk(dir)) files.push([label + '/' + relative(dir, p).replaceAll('\\', '/'), p]);
  return files.flatMap(([src, p]) => chunkMarkdown(src, readFileSync(p, 'utf8').replace(/\r\n/g, '\n')));
}

const embed = async (texts) => {
  const t = await extractor(texts, { pooling: 'mean', normalize: true });
  return t.tolist();
};

export async function build() {
  if (building) return building;
  building = (async () => {
    ready = false;
    const { pipeline } = await import('@huggingface/transformers');
    extractor ??= await pipeline('feature-extraction', MODEL, { dtype: 'q8' });
    let cache = {};
    try { cache = JSON.parse(readFileSync(cacheFile, 'utf8')); } catch { /* first run */ }
    chunks = collect();
    const keys = chunks.map(c => createHash('sha1').update('passage: ' + c.title + '\n' + c.text).digest('hex'));
    const todo = keys.map((k, i) => (cache[k] ? -1 : i)).filter(i => i >= 0);
    for (let i = 0; i < todo.length; i += 16) {
      const idx = todo.slice(i, i + 16);
      const v = await embed(idx.map(j => 'passage: ' + chunks[j].title + '\n' + chunks[j].text));
      idx.forEach((j, n) => { cache[keys[j]] = v[n]; });
    }
    vecs = keys.map(k => cache[k]);
    mkdirSync(dirname(cacheFile), { recursive: true });
    writeFileSync(cacheFile, JSON.stringify(Object.fromEntries(keys.map((k, i) => [k, vecs[i]]))));
    ready = true;
    return { chunks: chunks.length, embedded: todo.length };
  })().finally(() => { building = null; });
  return building;
}

export const status = () => ({ ready, building: !!building, chunks: chunks.length });

export async function ask(q, k = 6, src = '') {
  if (!ready) throw new Error('index not ready');
  const [qv] = await embed(['query: ' + q]);
  // vectors are normalized, so dot product == cosine
  return vecs.map((v, i) => ({ i, s: chunks[i].source.startsWith(src) ? v.reduce((a, x, d) => a + x * qv[d], 0) : -1 }))
    .sort((a, b) => b.s - a.s).slice(0, k)
    .map(({ i, s }) => ({ score: +s.toFixed(3), ...chunks[i] }));
}
