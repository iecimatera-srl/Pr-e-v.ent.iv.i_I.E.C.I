/* ===== Impostazioni unite pezzo per pezzo, senza perdite =====
   Prima le impostazioni (ditta, profilo, stile, marchi, listino, condizioni, modelli, messaggi, menu, aspetto
   dell'app) viaggiavano in blocco: vinceva il dispositivo che aveva cambiato qualcosa per ultimo, anche solo il
   numero di telefono, e cancellava tutto il resto (per esempio i loghi dei marchi) su tutti i dispositivi.
   Ora ogni sezione si unisce da sola, voce per voce, confrontando con l'ultima versione condivisa («base»):
   - cambiata solo qui → resta quella di qui; cambiata solo sull'altro dispositivo → arriva qui;
   - cambiata su tutti e due → si uniscono le voci (marchi, voci di listino, modelli…): le aggiunte di entrambi
     restano, le cancellazioni fatte apposta valgono; sullo stesso campo vince la modifica più recente;
   - senza base (dispositivo nuovo o prima volta): si unisce tutto e un valore pieno vince sempre su uno vuoto;
   - una sezione rimasta «di fabbrica» non vince mai su una personalizzata. */
var SEZ_IMC=new Map(), SEZ=['company','profile','style','trust','cat','cgroups','ccond','mt','msgs','menu','app'], SEZ_FAB=null, lastSez=null;
function apCopia(){ var o={}; Object.keys(APP).forEach(function(k){ if(k!=='view') o[k]=APP[k]; }); return o; }
function sezGet(k){
  if(k==='mt') return {mtpl:S.mtpl,mdef:S.mdef};
  if(k==='menu') return MENU;
  if(k==='app') return apCopia();
  if(k==='ccond') return S.ccond||{};
  return S[k];
}
function sezSet(k,v){
  v=JSON.parse(JSON.stringify(v));
  if(k==='mt'){ if(v.mtpl&&v.mtpl.length){ S.mtpl=v.mtpl; S.mdef=v.mdef||v.mtpl[0].id; } return; }
  if(k==='menu'){ MENU=v; try{ menuFix(); menuSave(); renderNav(); }catch(e){} return; }
  if(k==='app'){ Object.keys(v).forEach(function(x){ if(x in APP&&x!=='view') APP[x]=v[x]; }); try{ apStore(); apRefresh(); }catch(e){} return; }
  S[k]=v;
  if(k==='cat'||k==='cgroups'){ try{ ORDER.forEach(function(m){ cgSync(m); }); }catch(e){} }
}
function sezDa(o){ return {company:o.company,profile:o.profile,style:o.style,trust:o.trust,cat:o.cat,cgroups:o.cgroups,ccond:o.ccond,mt:o.mtpl&&o.mtpl.length?{mtpl:o.mtpl,mdef:o.mdef}:undefined,msgs:o.msgs,menu:o.menu,app:o.aspetto}; }
// forma «a impronte»: le immagini (in linea o come file su GitHub) diventano la loro impronta, così il confronto è veloce
function sezImp(x){
  if(typeof x==='string'){ if(x.length>200&&x.indexOf('data:image/')===0){ var c=SEZ_IMC.get(x); if(!c){ c='I:'+ghfCodice(x); if(SEZ_IMC.size>3000) SEZ_IMC.clear(); SEZ_IMC.set(x,c); } return c; } if(x.indexOf('ghf:')===0) return 'I:'+x.slice(4); return x; }
  if(Array.isArray(x)) return x.map(sezImp);
  if(x&&typeof x==='object'){ var o={}; Object.keys(x).forEach(function(k){ if(x[k]!==undefined) o[k]=sezImp(x[k]); }); return o; }
  return x;
}
function sezCanon(x){
  if(x===undefined) return 'U';
  if(x===null||typeof x!=='object') return JSON.stringify(x);
  if(Array.isArray(x)) return '['+x.map(sezCanon).join(',')+']';
  return '{'+Object.keys(x).sort().filter(function(k){ return x[k]!==undefined; }).map(function(k){ return JSON.stringify(k)+':'+sezCanon(x[k]); }).join(',')+'}';
}
function sezH(x){ return sezCanon(sezImp(x)); }
function sezVuoto(x){ return x===undefined||x===null||x===''||(Array.isArray(x)&&!x.length)||(typeof x==='object'&&!Array.isArray(x)&&x&&!Object.keys(x).length); }
function sezFab(k,v){
  sezFabV(k); return SEZ_FAB[k]!==undefined&&sezH(v)===SEZ_FAB[k];
}
var SEZ_FABV={};
function sezFabV(k){
  if(!SEZ_FAB){ SEZ_FAB={}; try{ var f=normalize(fresh()); SEZ.forEach(function(s){ var x=s==='mt'?{mtpl:f.mtpl,mdef:f.mdef}:s==='menu'?menuDefault():s==='app'?(function(){ var a={}; Object.keys(APP0).forEach(function(z){ if(z!=='view') a[z]=APP0[z]; }); return a; })():s==='ccond'?{}:f[s]; SEZ_FAB[s]=sezH(x); SEZ_FABV[s]=JSON.parse(JSON.stringify(x)); }); }catch(e){} }
  return SEZ_FABV[k];
}
// chiave di una voce in un elenco: id, nome o descrizione (voci di listino); altrimenti il contenuto
function sezChiave(x){
  if(Array.isArray(x)) return typeof x[0]==='string'?'d:'+String(x[0]).trim().toLowerCase():'h:'+sezH(x);
  if(x&&typeof x==='object'){ if(x.id!=null&&x.id!=='') return 'i:'+x.id; if(x.name!=null&&String(x.name).trim()) return 'n:'+String(x.name).trim().toLowerCase(); }
  return 'h:'+sezH(x);
}
function sezMappa(a){ var m={}, ord=[], cnt={}; (a||[]).forEach(function(x){ var k=sezChiave(x); cnt[k]=(cnt[k]||0)+1; if(cnt[k]>1) k+='#'+cnt[k]; m[k]=x; ord.push(k); }); return {m:m,o:ord}; }
function sezConVoci(a){ return Array.isArray(a)&&a.some(function(x){ return x&&typeof x==='object'; }); }
/* unione a tre vie: L = di qui, R = dell'altro dispositivo, B = ultima versione condivisa (a impronte) o undefined */
function merge3(L,R,B,qui,F){
  var hL=sezH(L), hR=sezH(R);
  if(hL===hR) return L;
  if(B!==undefined){ var hB=sezCanon(B); if(hL===hB) return R; if(hR===hB) return L; }
  else {
    if(sezVuoto(L)) return R; if(sezVuoto(R)) return L;
    // senza base, un valore rimasto com'era di fabbrica non vince mai su uno personalizzato
    if(F!==undefined){ var hF=sezH(F); if(hL===hF) return R; if(hR===hF) return L; }
  }
  if(L&&R&&typeof L==='object'&&typeof R==='object'&&!Array.isArray(L)&&!Array.isArray(R)){
    var o={}, ks={};
    Object.keys(L).concat(Object.keys(R)).forEach(function(k){ ks[k]=1; });
    Object.keys(ks).forEach(function(k){ var b=B&&typeof B==='object'&&!Array.isArray(B)?B[k]:undefined, f=F&&typeof F==='object'&&!Array.isArray(F)?F[k]:undefined; var v=merge3(L[k],R[k],b,qui,f); if(v!==undefined) o[k]=v; });
    return o;
  }
  if(Array.isArray(L)&&Array.isArray(R)&&(sezConVoci(L)||sezConVoci(R))){
    var ml=sezMappa(L), mr=sezMappa(R), mb=Array.isArray(B)?sezMappa(B).m:null, mf=Array.isArray(F)?sezMappa(F).m:null, out=[], fatto={};
    var prima=qui?ml.o:mr.o, poi=qui?mr.o:ml.o;
    prima.concat(poi).forEach(function(k){ if(fatto[k]) return; fatto[k]=1; var v=merge3(ml.m[k],mr.m[k],mb?mb[k]:undefined,qui,mf?mf[k]:undefined); if(v!==undefined) out.push(v); });
    return out;
  }
  if(Array.isArray(L)&&Array.isArray(R)&&B===undefined){ var u=L.slice(); R.forEach(function(x){ if(u.indexOf(x)<0) u.push(x); }); return u; }
  // stesso campo cambiato da tutte e due le parti: vince il più recente (ma un valore pieno non viene mai sostituito dal vuoto senza base)
  return qui?L:R;
}
function sezStampa(){ var h={}; SEZ.forEach(function(k){ try{ h[k]=sezH(sezGet(k)); }catch(e){} }); return h; }
// segna QUALE sezione è cambiata e quando (al posto di un solo orario per tutte le impostazioni)
function settingsStamp(){
  if(!dbReady) return;
  var h=sezStampa(), ch=false;
  if(lastSez){ Object.keys(h).forEach(function(k){ if(lastSez[k]!==undefined&&lastSez[k]!==h[k]){ (DB.sus||(DB.sus={}))[k]=Date.now(); ch=true; } }); }
  lastSez=h;
  if(ch){ DB.su=Date.now(); dbSave(); }
}
/* unisce le impostazioni arrivate (o) con quelle di qui; usaBase solo con GitHub (dove la base è affidabile).
   Restituisce true se qui è cambiato qualcosa; in mi.mie conta le sezioni che lassù vanno aggiornate. */
function sezUnisci(o,mi,usaBase){
  var R=sezDa(o), rs=o.sus||{}, ls=DB.sus||{}, B=usaBase?(DB.sbase||{}):{}, cambi=false;
  SEZ.forEach(function(k){
    var r=R[k]; if(r==null) return;
    var l=sezGet(k), b=B[k], m;
    var qui=(ls[k]||DB.su||0)>=(rs[k]||o.su||0);
    if(b===undefined&&sezFab(k,l)) m=r;
    else if(b===undefined&&sezFab(k,r)) m=l;
    else m=merge3(l,r,b,qui,b===undefined?sezFabV(k):undefined);
    if(sezH(m)!==sezH(l)){ if(k!=='menu'&&k!=='app'&&!AUTO.snapImp){ AUTO.snapImp=1; try{ snapSave('Prima di unire le impostazioni di un altro dispositivo'); }catch(e){} } sezSet(k,m); cambi=true; if(!qui||(rs[k]||0)>(ls[k]||0)) (DB.sus||(DB.sus={}))[k]=Math.max(ls[k]||0,rs[k]||0); }
    if(sezH(m)!==sezH(r)&&mi) mi.mie=(mi.mie||0)+1;
  });
  DB.su=Math.max(DB.su||0,o.su||0);
  lastSez=sezStampa();
  return cambi;
}
// dopo una sincronizzazione riuscita: la base è ciò che ora c'è su GitHub
function sezBase(o){ if(!o) return; var R=sezDa(o), b=DB.sbase||(DB.sbase={}); SEZ.forEach(function(k){ if(R[k]!=null) b[k]=sezImp(JSON.parse(JSON.stringify(R[k]))); }); dbSave(true); }

/* ===== archivio: nessuna modifica dimenticata, nessuna eliminazione che cancella lavoro più recente ===== */
// un elemento eliminato su un dispositivo ma modificato DOPO su un altro non sparisce: vince il lavoro più recente
function eliminato(x){ var t=x&&(DB.del||{})[x.id]; return !!t&&t>=(x.upd||0); }
// unisce due schede (cliente, prodotto): la più recente vince campo per campo, ma un dato pieno non diventa mai vuoto
function schedaUnisci(ex,r,salta){
  var nuova=(r.upd||0)>(ex.upd||0);
  Object.keys(r).forEach(function(k){ if(salta[k]||k==='upd') return; var v=r[k];
    if(nuova){ if(!sezVuoto(v)||sezVuoto(ex[k])) ex[k]=v; } else if(sezVuoto(ex[k])&&!sezVuoto(v)) ex[k]=v; });
  if(nuova) ex.upd=r.upd;
}
/* ogni modifica a clienti, prodotti, articoli e loghi, da qualunque schermata, prende l'ora della modifica:
   così arriva sempre agli altri dispositivi (prima alcune modifiche restavano solo dove erano state fatte) */
var UPDV=null;
function updOsserva(stampa){
  if(!dbReady) return; var nuova={}, ora=Date.now();
  ['clients','prods','arts','logos'].forEach(function(n){ (DB[n]||[]).forEach(function(x){
    if(!x||!x.id) return; var c={}; Object.keys(x).forEach(function(k){ if(k!=='upd'&&k!=='phu'&&k!=='phs') c[k]=x[k]; });
    var h=sezH(c), key=n+':'+x.id; nuova[key]=h;
    if(stampa&&UPDV&&(UPDV[key]===undefined?(!x.upd||!!(DB.del||{})[x.id]):UPDV[key]!==h)) x.upd=ora;
  }); });
  UPDV=nuova;
}
