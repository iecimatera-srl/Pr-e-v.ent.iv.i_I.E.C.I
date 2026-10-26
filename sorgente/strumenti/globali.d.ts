// Librerie e oggetti esterni che l'app usa solo se presenti (caricati a parte o del browser).
declare var PDFLib: any;          // pdf-lib, incluso nei file pronti dal build
declare var google: any;          // Google Identity Services, caricato solo per Google Drive
interface Window {
  IECI_T: any;                    // aggancio per i test automatici
  Tesseract: any;                 // OCR, caricato su richiesta
  htmlToImage: any;               // html-to-image, incluso nell'app
  google: any;
  ieciUpdated: any;               // richiamato dal service worker dopo un aggiornamento
  showDirectoryPicker: any;       // scelta cartella (Chrome/Edge)
  msCrypto: any;                  // vecchi browser
}
interface Navigator { standalone?: boolean; }  // iPhone: app aggiunta alla schermata Home
