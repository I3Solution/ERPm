// Local RAG for pipe-web: chunk tickets + AGENTS.md/PROJECT_MASTER.md by section, embed on this machine
// (multilingual-e5-small via transformers.js, no data leaves the box), cosine search in memory.
// Vectors are cached in .cache/vectors.json keyed by chunk hash, so only changed chunks are re-embedded.
import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { relative } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..');
const MODEL = process.env.RAG_MODEL || 'Xenova/multilingual-e5-base';
const cacheFile = join(here, '.cache', 'vectors-' + MODEL.split('/').pop() + '.json');
const MAX = 1200; // chars per chunk; shortcut: char-based split, upgrade to token-based if answers get cut mid-sentence

let fts; // in-memory FTS5 over the same chunks, rowid = chunk index
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
    fts = new DatabaseSync(':memory:');
    fts.exec("create virtual table c using fts5(t, tokenize='unicode61 remove_diacritics 2')");
    const ins = fts.prepare('insert into c(rowid, t) values (?, ?)');
    chunks.forEach((c, i) => ins.run(i, c.title + ' ' + c.section + ' ' + c.text));
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
  const ok = i => chunks[i].source.startsWith(src);
  // vectors are normalized, so dot product == cosine
  const dense = vecs.map((v, i) => [i, ok(i) ? v.reduce((a, x, d) => a + x * qv[d], 0) : -1]).sort((a, b) => b[1] - a[1]).slice(0, 50).map(x => x[0]);
  const toks = [...new Set(q.split(/[^\p{L}\p{N}]+/u).filter(t => t.length > 1))].map(t => '"' + t + '"');
  const sparse = toks.length ? fts.prepare('select rowid i from c where c match ? order by rank limit 200').all(toks.join(' OR ')).map(r => r.i).filter(ok).slice(0, 50) : [];
  // Reciprocal rank fusion: robust to the two scores living on different scales.
  const rrf = new Map();
  for (const list of [dense, sparse]) list.forEach((i, r) => rrf.set(i, (rrf.get(i) || 0) + 1 / (60 + r)));
  return [...rrf].sort((a, b) => b[1] - a[1]).slice(0, k)
    .map(([i, s]) => ({ score: +(s * 100).toFixed(2), dense: dense.indexOf(i) + 1 || null, sparse: sparse.indexOf(i) + 1 || null, ...chunks[i] }));
}
