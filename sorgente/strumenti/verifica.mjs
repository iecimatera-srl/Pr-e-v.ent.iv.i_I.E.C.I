// Controlli automatici sul sorgente di IECI preventivi.
// Uso: node strumenti/verifica.mjs      (esce con errore se trova un problema)
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { componi } from '../build.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'dist', 'controllo');
const problemi = [];
const ok = (cond, msg) => { if (!cond) problemi.push(msg); };

// --- 1. ricomposizione
const html = componi();
ok((html.match(/var CAN_PRINT = false;/g) || []).length === 1, 'CAN_PRINT deve comparire una sola volta');
ok(/var APP_VER = '\d{4}\.\d{2}\.\d{2}\.\d+';/.test(html), "APP_VER mancante o nel formato sbagliato (AAAA.MM.GG.N)");
ok(!html.includes('@@asset:'), 'Una risorsa @@asset non è stata sostituita');
ok(html.split('<script').length === html.split('</script>').length, 'Tag <script> non bilanciati');

// --- 2. JavaScript dell'app e mappa delle righe verso i moduli
const lista = fs.readFileSync(path.join(ROOT, 'composizione.txt'), 'utf8').split('\n').map(s => s.trim()).filter(s => s && !s.startsWith('#'));
const moduli = lista.filter(p => p.startsWith('app/'));
const mappa = []; let riga = 1;
for (const m of moduli) { const n = fs.readFileSync(path.join(ROOT, m), 'utf8').split('\n').length - 1; mappa.push({ m, da: riga, a: riga + n - 1 }); riga += n; }
const dove = l => { const x = mappa.find(z => l >= z.da && l <= z.a); return x ? x.m + ' riga ' + (l - x.da + 1) : 'riga ' + l; };
const jsA = html.indexOf('<script>\nvar CAN_PRINT') + '<script>\n'.length, jsB = html.lastIndexOf('</script>');
const js = html.slice(jsA, jsB);
ok(js === moduli.map(m => fs.readFileSync(path.join(ROOT, m), 'utf8')).join('').replace(/@@asset:([\w.-]+)@@/g, (_, n) => fs.readFileSync(path.join(ROOT, 'risorse', n), 'utf8')), 'I moduli app/ non coincidono con lo script dell\'app');
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'app.js'), js);

// --- 3. TypeScript (controllo del JavaScript)
const req = createRequire(import.meta.url);
let ts; for (const p of [path.join(ROOT, 'node_modules', 'typescript'), '/opt/npm-tools/node_modules/typescript']) { try { ts = req(p); break; } catch (e) {} }
if (!ts) problemi.push('TypeScript non trovato: esegui npm install');
else {
  const prog = ts.createProgram([path.join(OUT, 'app.js'), path.join(ROOT, 'strumenti', 'globali.d.ts')], { allowJs: true, checkJs: true, noEmit: true, target: ts.ScriptTarget.ES2020, lib: ['lib.es2020.d.ts', 'lib.dom.d.ts', 'lib.dom.iterable.d.ts'], strict: false, noImplicitAny: false, skipLibCheck: true, types: [] });
  // Avvisi solo "di tipo" tipici del JavaScript libero e degli elementi del browser: non sono errori.
  const ignora = d => { const t = ts.flattenDiagnosticMessageText(d.messageText, ' ');
    if ([2322, 2345, 2362, 2363].includes(d.code)) return true;
    if (d.code === 2339 && !/on type '\{/.test(t)) return true;
    return false; };
  let n = 0;
  for (const d of ts.getPreEmitDiagnostics(prog)) {
    if (ignora(d)) continue;
    const t = ts.flattenDiagnosticMessageText(d.messageText, ' ');
    if (d.file) { const { line } = d.file.getLineAndCharacterOfPosition(d.start); problemi.push('TS' + d.code + ' ' + (d.file.fileName.endsWith('app.js') ? dove(line + 1) : path.basename(d.file.fileName)) + ': ' + t); }
    else problemi.push('TS' + d.code + ': ' + t);
    n++;
  }
}

// --- 4. controlli specifici dell'app
const doppie = {}; for (const m of js.matchAll(/^function (\w+)\(/gm)) doppie[m[1]] = (doppie[m[1]] || 0) + 1;
for (const [k, v] of Object.entries(doppie)) if (v > 1) problemi.push('Funzione definita ' + v + ' volte (l\'ultima cancella le altre): ' + k);
const markup = lista.filter(p => p.startsWith('html/')).map(p => fs.readFileSync(path.join(ROOT, p), 'utf8')).join('');
const ids = {}; for (const m of markup.matchAll(/\sid="([\w-]+)"/g)) ids[m[1]] = (ids[m[1]] || 0) + 1;
for (const [k, v] of Object.entries(ids)) if (v > 1) problemi.push('id ripetuto ' + v + ' volte nella pagina: ' + k);
const dinamici = new Set([...js.matchAll(/id=\\?"([\w-]+)\\?"/g)].map(m => m[1]).concat([...js.matchAll(/id='([\w-]+)'/g)].map(m => m[1])));
const usati = new Set([...js.matchAll(/\$\('([\w-]+)'\)/g)].map(m => m[1]).concat([...js.matchAll(/getElementById\('([\w-]+)'\)/g)].map(m => m[1])));
for (const u of usati) if (!ids[u] && !dinamici.has(u)) problemi.push('Il codice usa un elemento che non esiste: #' + u);

// --- esito
if (problemi.length) { console.log('VERIFICA NON SUPERATA: ' + problemi.length + ' problemi'); problemi.forEach(p => console.log(' - ' + p)); process.exit(1); }
console.log('Verifica superata: ricomposizione, TypeScript (' + moduli.length + ' moduli, ' + js.split('\n').length + ' righe), funzioni, id della pagina.');
