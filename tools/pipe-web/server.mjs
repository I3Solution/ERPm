// Local read-only viewer for the /pipe pipeline: tickets in .ai/tasks/*.md -> SQLite (FTS5) -> small web UI.
// Run: node --no-warnings tools/pipe-web/server.mjs [port]   (default 4500, bound to 127.0.0.1 only)
import { DatabaseSync } from 'node:sqlite';
import { createServer } from 'node:http';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, basename } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const tasksDir = join(here, '..', '..', '.ai', 'tasks');
const port = Number(process.argv[2] || 4500);

const db = new DatabaseSync(':memory:');
db.exec(`create table task(file text primary key, title text, type text, status text, stage text, round text, gate text,
  prsha text, env text, metrics text, tokens_k real, minutes real, features_done int, features_total int, lesson text, body text);
  create virtual table fts using fts5(file unindexed, title, body, lesson, tokenize='unicode61 remove_diacritics 2');`);

const line = (s, key) => {
  const p = '> **' + key + ':**';
  const l = s.split('\n').find(x => x.startsWith(p));
  return l ? l.slice(p.length).trim() : '';
};

// "DEV=45k/20p · TEST=67k/12p" -> sums; "?" or missing parts count as 0 (unknown, never invented)
function sumMetrics(m) {
  let tok = 0, min = 0;
  for (const part of m.split('·')) {
    const x = part.match(/=\s*~?(\d+(?:[.,]\d+)?)k(?:\/~?(\d+)p)?/);
    const y = part.match(/=\s*(?:\?|~?\d+(?:[.,]\d+)?k)?\/~?(\d+)p/);
    if (x) { tok += Number(x[1].replace(',', '.')); if (x[2]) min += Number(x[2]); }
    else if (y) min += Number(y[1]);
  }
  return { tok, min };
}

function load() {
  db.exec('delete from task; delete from fts;');
  const ins = db.prepare('insert into task values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
  const insF = db.prepare('insert into fts values (?,?,?,?)');
  for (const file of readdirSync(tasksDir).filter(f => f.endsWith('.md') && !f.startsWith('_'))) {
    const body = readFileSync(join(tasksDir, file), 'utf8').replace(/\r\n/g, '\n');
    const title = (body.match(/^#\s+(.*)$/m) || [, file])[1];
    const pipe = line(body, 'Pipeline');
    const stage = (pipe.match(/stage=(\w+)/) || [, ''])[1];
    const round = (pipe.match(/round=([^·]*)/) || [, ''])[1].trim();
    const gate = (pipe.match(/gate=([\w-]+)/) || [, ''])[1];
    const metrics = line(body, 'Metrics');
    const { tok, min } = sumMetrics(metrics);
    const done = (body.match(/^- \[x\]/gim) || []).length, total = (body.match(/^- \[[ x]\]/gim) || []).length;
    const lesson = (body.match(/^## P-LESSON\s*\n([\s\S]*?)(?=\n## |\s*$)/m) || [, ''])[1].trim();
    // Status text often carries a note, e.g. "Doing (chờ merge)"; keep only the keyword for grouping.
    const status = (line(body, 'Trạng thái').match(/^(Todo|Doing|Blocked|Done)/) || [''])[0];
    ins.run(file, title, line(body, 'Loại'), status, stage, round, gate,
      line(body, 'PR/SHA'), line(body, 'Env'), metrics, tok, min, done, total, lesson, body);
    insF.run(file, title, body, lesson);
  }
}
load();

const json = (res, o, code = 200) => { res.writeHead(code, { 'content-type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(o)); };
const cols = 'file,title,type,status,stage,round,gate,prsha,env,metrics,tokens_k,minutes,features_done,features_total';

createServer((req, res) => {
  const u = new URL(req.url, 'http://x');
  if (u.pathname === '/') { res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); return res.end(readFileSync(join(here, 'index.html'))); }
  if (u.pathname === '/api/reindex') { load(); return json(res, { ok: true }); }
  if (u.pathname === '/api/tasks') {
    const where = [], args = [];
    for (const k of ['status', 'type', 'stage']) if (u.searchParams.get(k)) { where.push(`${k}=?`); args.push(u.searchParams.get(k)); }
    return json(res, db.prepare(`select ${cols} from task ${where.length ? 'where ' + where.join(' and ') : ''} order by file desc`).all(...args));
  }
  if (u.pathname === '/api/task') {
    const f = basename(u.searchParams.get('file') || '');
    const r = db.prepare('select * from task where file=?').get(f);
    return r ? json(res, r) : json(res, { error: 'not found' }, 404);
  }
  if (u.pathname === '/api/search') {
    // Keywords AND-ed; each token quoted so ids like BE#87 or i18n.keys never break FTS syntax.
    const toks = (u.searchParams.get('q') || '').split(/\s+/).filter(Boolean).map(t => '"' + t.replace(/"/g, '') + '"');
    if (!toks.length) return json(res, []);
    const rows = db.prepare(`select f.file, t.title, t.status, t.stage, snippet(fts, 2, '[', ']', ' … ', 12) as snip
      from fts f join task t on t.file=f.file where fts match ? order by rank limit 30`).all(toks.join(' '));
    return json(res, rows);
  }
  if (u.pathname === '/api/lessons') return json(res, db.prepare("select file,title,lesson from task where lesson<>'' and lower(lesson) not like 'none%' order by file desc").all());
  if (u.pathname === '/api/stats') {
    return json(res, {
      byStatus: db.prepare('select status k, count(*) n from task group by status').all(),
      byStage: db.prepare("select stage k, count(*) n from task where stage<>'' group by stage").all(),
      piped: db.prepare("select count(*) n, sum(tokens_k) tok, sum(minutes) min from task where stage<>''").get(),
    });
  }
  json(res, { error: 'not found' }, 404);
}).listen(port, '127.0.0.1', () => console.log(`pipe-web: http://127.0.0.1:${port}`));
