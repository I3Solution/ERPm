// Export /pipe tickets as an Obsidian vault: one note per ticket, [[wikilinks]] where a ticket names another,
// plus hub notes per type/status/stage so Obsidian's graph view works as a mind map.
// Run: node tools/pipe-web/export-obsidian.mjs [outDir]   (default tools/pipe-web/.cache/vault; safe to re-run, overwrites)
import { readFileSync, readdirSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const tasksDir = join(here, '..', '..', '.ai', 'tasks');
const out = process.argv[2] || join(here, '.cache', 'vault');
const line = (s, k) => (s.split('\n').find(x => x.startsWith('> **' + k + ':**')) || '').replace('> **' + k + ':**', '').trim();
const slug = s => s.replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '').toLowerCase() || 'none';

const files = readdirSync(tasksDir).filter(f => f.endsWith('.md') && !f.startsWith('_'));
const stems = files.map(f => f.replace(/\.md$/, ''));
const hubs = new Map(); // hub name -> [ticket stems]

rmSync(out, { recursive: true, force: true });
mkdirSync(join(out, 'tickets'), { recursive: true });
mkdirSync(join(out, 'hubs'), { recursive: true });

files.forEach((f, n) => {
  const stem = stems[n];
  let body = readFileSync(join(tasksDir, f), 'utf8').replace(/\r\n/g, '\n');
  const title = (body.match(/^#\s+(.*)$/m) || [, stem])[1];
  const status = (line(body, 'Trạng thái').match(/^(Todo|Doing|Blocked|Done)/) || ['unknown'])[0];
  const type = slug(((line(body, 'Loại') || stem).match(/^[\p{L}]+/u) || ['none'])[0]); // first word only: the field often carries notes
  const stage = (line(body, 'Pipeline').match(/stage=(\w+)/) || [, ''])[1];
  const mine = [`type-${type}`, `status-${status.toLowerCase()}`, ...(stage ? [`stage-${stage}`] : [])];
  mine.forEach(h => hubs.set(h, [...(hubs.get(h) || []), stem]));
  // Link only to other tickets, longest stem first so a stem that prefixes another cannot shadow it.
  const others = stems.filter(s => s !== stem).sort((a, b) => b.length - a.length);
  for (const s of others) body = body.split(s + '.md').join(`[[${s}]]`).split('`' + s + '`').join(`[[${s}]]`);
  const fm = `---\ntitle: "${title.replace(/"/g, "'")}"\ntags: [${mine.join(', ')}]\nstatus: ${status}\n---\n`;
  const hubLinks = '\n\n---\n' + mine.map(h => `[[${h}]]`).join(' · ') + '\n';
  writeFileSync(join(out, 'tickets', stem + '.md'), fm + body + hubLinks);
});

for (const [h, list] of hubs) writeFileSync(join(out, 'hubs', h + '.md'), `# ${h}\n\n${list.map(s => `- [[${s}]]`).join('\n')}\n`);
mkdirSync(join(out, '.obsidian'), { recursive: true });
// Colour the graph by hub so statuses/types read at a glance.
writeFileSync(join(out, '.obsidian', 'graph.json'), JSON.stringify({
  colorGroups: [['status-done', 4], ['status-doing', 3], ['status-blocked', 1], ['status-todo', 2]].map(([t, c]) =>
    ({ query: `tag:#${t}`, color: { a: 1, rgb: [0x4caf50, 0xffb300, 0xe53935, 0x90a4ae][c === 4 ? 0 : c === 3 ? 1 : c === 1 ? 2 : 3] } })),
}));
console.log(`vault: ${out} (${files.length} tickets, ${hubs.size} hubs)`);
