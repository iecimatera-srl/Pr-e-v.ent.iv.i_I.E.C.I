// Esegue i test automatici di IECI preventivi (browser Chromium senza finestra).
// Uso: node strumenti/test.mjs            -> costruisce l'app ed esegue tutti i test dell'elenco
//      node strumenti/test.mjs t32 t60    -> solo quei test
//      opzioni: --senza-build  --paralleli=N  --tutti (anche quelli fuori elenco)
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { costruisci } from '../build.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TD = path.join(ROOT, 'test');
const LOG = path.join(ROOT, 'dist', 'test-log');
const args = process.argv.slice(2);
const opt = k => args.find(a => a.startsWith('--' + k));
const par = Math.max(1, parseInt((opt('paralleli') || '--paralleli=2').split('=')[1], 10) || 2);
const scelti = args.filter(a => !a.startsWith('--'));

if (!opt('senza-build')) costruisci();

// Piccolo server locale per i test che aprono l'app da http:// (aggiornamenti, installazione, migrazione)
import http from 'node:http';
const PWA = path.join(ROOT, 'dist', 'android', 'IECI preventivi app');
const MAPPA = { '/preventivi-elettrici.html': path.join(ROOT, 'dist', 'preventivi-elettrici.html'), '/preventivi-elettrici-standalone.html': path.join(ROOT, 'dist', 'IECI-preventivi-file-singolo.html'), '/old.html': path.join(TD, 'dati', 'versione-2026-10-13.html') };
const TIPI = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8' };
const server = [];
for (const port of [8124, 8126, 8141, 8143, 8150, 8765]) {
  const s = http.createServer((req, res) => {
    let u = decodeURIComponent((req.url || '/').split('?')[0]); if (u === '/') u = '/index.html';
    const f = MAPPA[u] || path.join(PWA, path.normalize(u).replace(/^([.][.][\\/])+/, ''));
    fs.readFile(f, (e, d) => { if (e) { res.writeHead(404); res.end('non trovato'); return; } res.writeHead(200, { 'Content-Type': TIPI[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-cache' }); res.end(d); });
  });
  s.on('error', () => {}); s.listen(port, '127.0.0.1'); server.push(s);
}
fs.mkdirSync(LOG, { recursive: true });

const elenco = fs.readFileSync(path.join(TD, 'elenco.txt'), 'utf8').split('\n').map(s => s.replace(/#.*/, '').trim()).filter(Boolean);
const tutti = fs.readdirSync(TD).filter(f => /^t\d+\.cjs$/.test(f)).map(f => f.slice(0, -4)).sort((a, b) => +a.slice(1) - +b.slice(1));
const daFare = scelti.length ? scelti : (opt('tutti') ? tutti : elenco);

// Un test e' superato se termina senza errori e non riporta righe FAIL (tranne "FAIL 0") ne' errori JavaScript.
function esito(code, out) {
  if (code !== 0) return 'uscita con codice ' + code;
  const f = out.split('\n').find(l => /^\s*FAIL\b/.test(l) && !/^\s*FAIL 0\b/.test(l));
  if (f) return f.trim().slice(0, 160);
  const e = out.match(/(ERRORI JS|ERR|errs|ERRORI):?\s*(\[[^\]\n]*\])/g) || [];
  const bad = e.find(x => !/\[\s*\]$/.test(x));
  if (bad) return 'errori JavaScript: ' + bad.slice(0, 160);
  return '';
}
function esegui(n) {
  return new Promise(res => {
    const t0 = Date.now(), ch = spawn(process.execPath, [path.join(TD, n + '.cjs')], { cwd: TD, env: process.env });
    let out = ''; ch.stdout.on('data', d => out += d); ch.stderr.on('data', d => out += d);
    const to = setTimeout(() => { out += '\n[tempo scaduto]'; ch.kill('SIGKILL'); }, 300000);
    ch.on('close', code => { clearTimeout(to); fs.writeFileSync(path.join(LOG, n + '.txt'), out); res({ n, s: Math.round((Date.now() - t0) / 1000), err: esito(code, out) }); });
  });
}
const coda = daFare.slice(), risultati = [];
async function lavoratore() { while (coda.length) { const n = coda.shift(); const r = await esegui(n); risultati.push(r); console.log((r.err ? 'NON SUPERATO ' : 'ok           ') + n.padEnd(5) + (' ' + r.s + 's').padStart(6) + (r.err ? '   ' + r.err : '')); } }
await Promise.all(Array.from({ length: Math.min(par, daFare.length) }, lavoratore));
const ko = risultati.filter(r => r.err);
console.log('\n' + (risultati.length - ko.length) + ' test superati su ' + risultati.length + (ko.length ? ' · NON superati: ' + ko.map(r => r.n).join(', ') + ' (dettagli in dist/test-log/)' : ''));
server.forEach(s => s.close());
process.exit(ko.length ? 1 : 0);
