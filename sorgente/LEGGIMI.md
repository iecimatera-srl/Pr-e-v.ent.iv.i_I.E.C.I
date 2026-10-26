# IECI preventivi: il codice sorgente

Questa cartella contiene il **sorgente** dell'app, diviso in moduli ordinati.
L'app che usi (la pagina pubblicata in questo repository, il file singolo e il pacchetto Windows) viene **costruita** da qui con un comando.

## Come è organizzato

| Cartella | Contenuto |
|---|---|
| `app/` | Il programma (JavaScript), diviso in 26 moduli per area: modelli e listini, assistente, totali, fascicolo, videocitofono, confronto marche, PIN, archivio, sincronizzazione, fornitori, salvataggi… |
| `html/` | La pagina, divisa per pannello del menu (Dati, Preventivo, Prodotti, Invio, Messaggi…) |
| `css/` | La grafica, divisa per area (editor, copertina, prodotti, preventivo…) |
| `librerie/` | Librerie esterne incluse nell'app (PDF, immagini) |
| `risorse/` | Immagini incorporate (logo predefinito, icona) |
| `statici/` | Icone, service worker, file del pacchetto Windows e guide |
| `test/` | I test automatici nel browser |
| `strumenti/` | Controlli automatici ed esecuzione dei test |
| `composizione.txt` | L'ordine in cui i pezzi formano l'app |
| `build.mjs` | Costruisce l'app |

## Comandi

Serve solo [Node.js](https://nodejs.org) (versione 18 o successiva).

```
npm install              # una volta: strumenti di controllo e test
node strumenti/verifica.mjs   # controlli automatici (TypeScript, funzioni doppie, elementi della pagina)
node strumenti/test.mjs       # costruisce l'app ed esegue i test nel browser
node build.mjs                # costruisce in dist/: file singolo, pacchetto Windows, app e i due zip
node build.mjs --pubblica     # come sopra, e aggiorna l'app pubblicata nella radice del repository
```

## Come si rilascia una versione

1. Modifica i moduli in `app/`, `html/`, `css/`.
2. Aggiorna `APP_VER` in `app/01-avvio-e-modelli.js` (formato `AAAA.MM.GG.N`).
3. `node strumenti/verifica.mjs` e `node strumenti/test.mjs` devono essere superati.
4. `node build.mjs --pubblica`, poi commit e push: telefono e PC si aggiornano da soli.

## Controlli su GitHub

- **Verifica del sorgente** parte a ogni modifica: esegue i controlli e verifica che l'app pubblicata corrisponda esattamente al sorgente.
- **Test completi** si avvia a mano (Actions → Test completi → Run workflow) ed esegue tutti i test nel browser.

## Cosa non c'è qui

Nessun dato dei clienti, nessun preventivo e nessun codice di accesso: quelli restano sui tuoi dispositivi e nel tuo archivio GitHub **privato**.
