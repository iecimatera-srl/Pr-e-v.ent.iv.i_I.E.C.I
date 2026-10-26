// Ambiente comune dei test: percorsi dei file costruiti e browser.
const path = require('path'), fs = require('fs');
const ROOT = path.resolve(__dirname, '..');
let pw; try { pw = require('playwright'); } catch (e) { pw = require('/opt/npm-tools/node_modules/playwright'); }
const exe = process.env.IECI_CHROMIUM || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const chromium = { launch: (o) => { o = Object.assign({}, o || {}); delete o.executablePath; if (exe) o.executablePath = exe; return pw.chromium.launch(o); } };
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
