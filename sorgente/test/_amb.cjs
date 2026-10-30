// Ambiente comune dei test: percorsi dei file costruiti e browser.
const path = require('path'), fs = require('fs');
const ROOT = path.resolve(__dirname, '..');
let pw; try { pw = require('playwright'); } catch (e) { pw = require('/opt/npm-tools/node_modules/playwright'); }
const exe = process.env.IECI_CHROMIUM || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
// L'app disegna solo le pagine del fascicolo che si vedono (content-visibility): il loro testo non risulta in innerText.
// Nei test che leggono il testo del fascicolo le pagine si disegnano tutte, come per il PDF (IECI_CV=1 per misurare).
const TUTTE = "document.addEventListener('DOMContentLoaded',function(){var s=document.createElement('style');s.textContent='#doc>.page{content-visibility:visible!important}';document.head.appendChild(s);});";
function pagineTutte(b) {
  if (process.env.IECI_CV) return b;
  const nc = b.newContext.bind(b), np = b.newPage.bind(b);
  b.newContext = async (...a) => { const c = await nc(...a); await c.addInitScript(TUTTE); return c; };
  b.newPage = async (...a) => { const p = await np(...a); await p.addInitScript(TUTTE); return p; };
  return b;
}
const chromium = { launch: (o) => { o = Object.assign({}, o || {}); delete o.executablePath; if (exe) o.executablePath = exe; return pw.chromium.launch(o).then(pagineTutte); } };
const url = p => 'file://' + path.join(ROOT, p);
module.exports = {
  chromium, ROOT,
  SRC: url('dist/preventivi-elettrici.html'),
  SA: url('dist/IECI-preventivi-file-singolo.html'),
  ZIPA: path.join(ROOT, 'dist/IECI-preventivi-Android-PWA.zip'),
  ZIPW: path.join(ROOT, 'dist/IECI-preventivi-Windows.zip'),
  PWA_INDEX: path.join(ROOT, 'dist/android/IECI preventivi app/index.html'),
  DATI: path.join(__dirname, 'dati'),
  TMP: fs.mkdtempSync(path.join(require('os').tmpdir(), 'ieci-test-')),
};
// Rende visibile un elemento: apre il suo pannello dal menu e i riquadri che lo contengono.
module.exports.mostra = async (p, sel) => {
  await p.evaluate(sel => {
    let el = null; try { el = document.querySelector(sel); } catch (e) { return; } if (!el) return;
    const sec = el.closest('[data-panel]');
    if (sec && sec.hidden) { let b = document.querySelector('.mit[data-p="' + sec.getAttribute('data-panel') + '"]'); if (!b) { document.getElementById('mn-btn').click(); b = document.querySelector('.mit[data-p="' + sec.getAttribute('data-panel') + '"]'); } if (b) b.click(); }
    let d = el.closest('details'); while (d) { d.open = true; d = d.parentElement && d.parentElement.closest('details'); }
  }, sel);
  await p.waitForTimeout(120);
};
// Lettore di testo delle foto (OCR) senza internet: le richieste al CDN vanno ai file installati con npm
module.exports.ocrLocale = async (ctx) => {
  const nm = [path.join(ROOT, 'node_modules'), '/opt/npm-tools/node_modules'].find(d => fs.existsSync(path.join(d, 'tesseract.js', 'dist', 'tesseract.min.js')));
  if (!nm) return false;
  const tipi = { '.js': 'text/javascript', '.wasm': 'application/wasm', '.gz': 'application/gzip' };
  await ctx.route(/cdn\.jsdelivr\.net\/npm\//, (route) => {
    const u = new URL(route.request().url()).pathname.replace(/^\/npm\//, '');
    let f = null, m;
    if ((m = u.match(/^tesseract\.js@v?[\d.]+\/(.+)$/))) f = path.join(nm, 'tesseract.js', m[1]);
    else if ((m = u.match(/^tesseract\.js-core@v?[\d.]+\/?(.*)$/))) f = path.join(nm, 'tesseract.js-core', m[1] || 'index.js');
    else if ((m = u.match(/^@tesseract\.js-data\/(\w+)\/([\w.]+)\/(.+)$/))) f = path.join(nm, '@tesseract.js-data', m[1], m[2], m[3]);
    if (!f || !fs.existsSync(f)) return route.fulfill({ status: 404, body: 'non trovato' });
    route.fulfill({ status: 200, body: fs.readFileSync(f), headers: { 'content-type': tipi[path.extname(f)] || 'application/octet-stream', 'access-control-allow-origin': '*' } });
  });
  return true;
};
