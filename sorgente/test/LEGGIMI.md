# Test automatici

Ogni file `tNN.cjs` apre l'app in Chromium (senza finestra) e controlla una funzione: totali, PDF, firma, PIN,
videocitofono, confronto marche, messaggi di invio, sincronizzazione GitHub e Google Drive (con API simulate),
copie di sicurezza, aggiornamenti, migrazione dalla versione del 13/10/2026 e altro.

- `node strumenti/test.mjs` costruisce l'app ed esegue tutti i test di `elenco.txt`.
- `node strumenti/test.mjs t32 t60` esegue solo quelli indicati.
- I registri completi finiscono in `dist/test-log/`.
- `_amb.cjs` contiene percorsi e browser comuni; `dati/` i file di prova (PDF, foto, la versione vecchia dell'app).

Test tolti perché provavano funzioni che non esistono più per scelta: t1, t2 (prima bozza), t15 (vecchio editor del menu),
t17 e t44 (aggiornamento con un server di prova manuale, coperti da t46), t58 e t59 (livelli tipici del posto interno, tolti su richiesta).
