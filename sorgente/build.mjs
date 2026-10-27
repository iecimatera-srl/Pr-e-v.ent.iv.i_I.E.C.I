// Costruisce IECI preventivi dal sorgente diviso in moduli.
// Uso:  node build.mjs              -> crea tutto in dist/
//       node build.mjs --pubblica   -> in piu' copia l'app (PWA) nella radice del repository (GitHub Pages)
// Nessuna dipendenza esterna: solo Node.js (>= 18).
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(ROOT, 'dist');
const rd = (p, enc = 'utf8') => fs.readFileSync(path.join(ROOT, p), enc);
const wr = (p, data) => { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, data); };

// ---------- 1. ricomposizione del file unico ----------
export function componi() {
  const lista = rd('composizione.txt').split('\n').map(s => s.trim()).filter(s => s && !s.startsWith('#'));
  let out = lista.map(p => rd(p)).join('');
  out = out.replace(/@@asset:([\w.-]+)@@/g, (_, n) => rd('risorse/' + n));
  if (out.includes('@@asset:')) throw new Error('Risorsa non sostituita');
  return out;
}

// JSON come lo scrive Python (separatori ", " e ": "), per file identici a quelli di sempre
function pyJson(v) {
  if (Array.isArray(v)) return '[' + v.map(pyJson).join(', ') + ']';
  if (v && typeof v === 'object') return '{' + Object.keys(v).map(k => JSON.stringify(k) + ': ' + pyJson(v[k])).join(', ') + '}';
  return JSON.stringify(v);
}

// ---------- 2. zip (deflate) senza dipendenze ----------
const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc32(buf) { let c = 0xFFFFFFFF; for (let i = 0; i < buf.length; i++) c = CRC[(c ^ buf[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
function zip(entries) { // entries: [{name, data(Buffer)|null per cartella}]
  const d = new Date(), time = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1), date = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
  const loc = [], cen = []; let off = 0;
  for (const e of entries) {
    const name = Buffer.from(e.name, 'utf8'), dir = e.data == null, raw = dir ? Buffer.alloc(0) : e.data;
    const comp = dir ? raw : zlib.deflateRawSync(raw, { level: 9 }), method = dir ? 0 : 8, crc = dir ? 0 : crc32(raw);
    const h = Buffer.alloc(30); h.writeUInt32LE(0x04034b50, 0); h.writeUInt16LE(20, 4); h.writeUInt16LE(0x0800, 6); h.writeUInt16LE(method, 8); h.writeUInt16LE(time, 10); h.writeUInt16LE(date, 12);
    h.writeUInt32LE(crc, 14); h.writeUInt32LE(comp.length, 18); h.writeUInt32LE(raw.length, 22); h.writeUInt16LE(name.length, 26); h.writeUInt16LE(0, 28);
    loc.push(h, name, comp);
    const c = Buffer.alloc(46); c.writeUInt32LE(0x02014b50, 0); c.writeUInt16LE(0x031E, 4); c.writeUInt16LE(20, 6); c.writeUInt16LE(0x0800, 8); c.writeUInt16LE(method, 10); c.writeUInt16LE(time, 12); c.writeUInt16LE(date, 14);
    c.writeUInt32LE(crc, 16); c.writeUInt32LE(comp.length, 20); c.writeUInt32LE(raw.length, 24); c.writeUInt16LE(name.length, 28);
    c.writeUInt32LE(dir ? ((0o40755 << 16) | 0x10) >>> 0 : (0o100644 << 16) >>> 0, 38); c.writeUInt32LE(off, 42);
    cen.push(c, name); off += 30 + name.length + comp.length;
  }
  const cs = cen.reduce((a, b) => a + b.length, 0), end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(entries.length, 8); end.writeUInt16LE(entries.length, 10); end.writeUInt32LE(cs, 12); end.writeUInt32LE(off, 16);
  return Buffer.concat([...loc, ...cen, end]);
}
function zipCartella(dir, radice) {
  const ent = [{ name: radice + '/', data: null }];
  for (const f of fs.readdirSync(dir).sort()) ent.push({ name: radice + '/' + f, data: fs.readFileSync(path.join(dir, f)) });
  return zip(ent);
}

// ---------- 3. i tre formati: file singolo, Windows, app (PWA) ----------
export function costruisci({ pubblica = false } = {}) {
  const sorgente = componi();
  fs.rmSync(DIST, { recursive: true, force: true });
  wr(path.join(DIST, 'preventivi-elettrici.html'), sorgente);

  if ((sorgente.match(/var CAN_PRINT = false;/g) || []).length !== 1) throw new Error('CAN_PRINT non trovato una sola volta');
  let m = sorgente.replace('var CAN_PRINT = false;', 'var CAN_PRINT = true;');
  const fav = rd('statici/icone/fav.b64');
  let nf = 0;
  m = m.replace(/(<link rel="icon" type="image\/png" href=")data:image\/png;base64,[A-Za-z0-9+/=]+/, (_, a) => { nf++; return a + 'data:image/png;base64,' + fav; });
  if (nf !== 1) throw new Error('favicon non trovata');
  const pdfLib = rd('librerie/pdf-lib.min.js');
  const k = m.indexOf('<script>');
  // pdf-lib (oltre 500 KB) resta testo: si avvia solo quando serve un PDF, così l'app parte prima
  if (pdfLib.includes('</script')) throw new Error('pdf-lib contiene </script>');
  const body = m.slice(0, k) + '<script type="text/plain" id="pdflib-lib">' + pdfLib + '</script>\n' + m.slice(k);
  const head = vp => '<!doctype html>\n<html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1' + vp + '">\n';
  const singolo = head('') + body + '</body></html>';
  const APPV = (m.match(/var APP_VER = '([^']+)'/) || [])[1];
  if (!APPV) throw new Error('APP_VER non trovato');

  // file singolo
  wr(path.join(DIST, 'IECI-preventivi-file-singolo.html'), singolo);

  // Windows
  const W = path.join(DIST, 'windows', 'IECI preventivi');
  wr(path.join(W, 'index.html'), singolo);
  fs.copyFileSync(path.join(ROOT, 'statici/icone/icona.ico'), path.join(W, 'icona.ico'));
  for (const f of ['Avvia IECI preventivi.bat', 'LEGGIMI.txt']) fs.copyFileSync(path.join(ROOT, 'statici/windows', f), path.join(W, f));
  wr(path.join(W, 'Crea collegamento sul Desktop.bat'), `@echo off
rem Crea sul Desktop l'icona "IECI preventivi" (con il logo) che avvia il programma.
set "DIR=%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -Command "$d=[Environment]::GetFolderPath('Desktop'); $s=(New-Object -ComObject WScript.Shell).CreateShortcut($d+'\\IECI preventivi.lnk'); $s.TargetPath='%DIR%Avvia IECI preventivi.bat'; $s.WorkingDirectory='%DIR%'; $s.IconLocation='%DIR%icona.ico'; $s.WindowStyle=7; $s.Description='IECI preventivi'; $s.Save()"
echo.
echo Fatto: sul Desktop trovi l'icona "IECI preventivi".
echo Puoi anche trascinarla sulla barra delle applicazioni.
pause
`.replace(/\n/g, '\r\n'));

  // App (PWA) per GitHub Pages
  const A = path.join(DIST, 'android', 'IECI preventivi app');
  const sw = "<script>if('serviceWorker' in navigator){var __had=!!navigator.serviceWorker.controller;navigator.serviceWorker.addEventListener('controllerchange',function(){if(__had&&window.ieciUpdated)window.ieciUpdated();});window.addEventListener('load',function(){navigator.serviceWorker.register('sw.js').then(function(r){r.update();document.addEventListener('visibilitychange',function(){if(!document.hidden)r.update();});}).catch(function(){});});}</script>\n";
  const pwa = head(',viewport-fit=cover"><link rel="manifest" href="manifest.webmanifest" crossorigin="use-credentials"><link rel="icon" type="image/png" sizes="192x192" href="icon-192.png"><meta name="mobile-web-app-capable" content="yes"><meta name="theme-color" content="#2F65AE"><link rel="apple-touch-icon" href="icon-180.png') + body + sw + '</body></html>';
  // nell'app installata (PWA) le librerie PDF diventano file a parte: la pagina pesa un terzo e si apre prima
  const LIBS = [['pdfjs-lib', 'lib-pdfjs.txt'], ['pdfjs-wk', 'lib-pdfjs-worker.txt'], ['pdflib-lib', 'lib-pdf.js']];
  let pwaLeggera = pwa;
  for (const [id, nome] of LIBS) {
    const re = new RegExp('(<script type="text/plain" id="' + id + '">)([\\s\\S]*?)(</script>)');
    const mm = pwaLeggera.match(re); if (!mm) throw new Error('libreria ' + id + ' non trovata');
    wr(path.join(A, nome), mm[2]);
    pwaLeggera = pwaLeggera.replace(re, () => '<script type="text/plain" id="' + id + '" data-src="' + nome + '"></script>');
  }
  wr(path.join(A, 'index.html'), pwaLeggera);
  wr(path.join(A, 'sw.js'), rd('statici/pwa/sw.js').replace('__VER__', APPV));
  wr(path.join(A, 'version.json'), pyJson({ v: APPV }));
  for (const [s, d] of [['any-192.png', 'icon-192.png'], ['any-512.png', 'icon-512.png'], ['mask-192.png', 'maskable-192.png'], ['mask-512.png', 'maskable-512.png'], ['apple-180.png', 'icon-180.png']]) fs.copyFileSync(path.join(ROOT, 'statici/icone', s), path.join(A, d));
  wr(path.join(A, 'manifest.webmanifest'), pyJson({ name: 'IECI preventivi', short_name: 'IECI preventivi', lang: 'it', start_url: './index.html', scope: './', display: 'standalone', background_color: '#FFFFFF', theme_color: '#2F65AE', icons: [{ src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' }, { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' }, { src: 'maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' }, { src: 'maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }] }));
  fs.copyFileSync(path.join(ROOT, 'statici/pwa/LEGGIMI.txt'), path.join(A, 'LEGGIMI.txt'));
  wr(path.join(A, '_headers'), '/manifest.webmanifest\n  Content-Type: application/manifest+json\n/sw.js\n  Cache-Control: no-cache\n/index.html\n  Cache-Control: no-cache\n/\n  Cache-Control: no-cache\n');

  // pacchetti zip
  wr(path.join(DIST, 'IECI-preventivi-Windows.zip'), zipCartella(W, 'IECI preventivi'));
  wr(path.join(DIST, 'IECI-preventivi-Android-PWA.zip'), zipCartella(A, 'IECI preventivi app'));

  if (pubblica) {
    const REPO = path.resolve(ROOT, '..');
    for (const f of fs.readdirSync(A)) fs.copyFileSync(path.join(A, f), path.join(REPO, f));
  }
  return { versione: APPV, byte: singolo.length };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const r = costruisci({ pubblica: process.argv.includes('--pubblica') });
  console.log('IECI preventivi ' + r.versione + ' costruito in dist/' + (process.argv.includes('--pubblica') ? ' e pubblicato nella radice del repository' : ''));
}
