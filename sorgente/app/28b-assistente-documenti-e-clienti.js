/* ---------- l'assistente legge i documenti: preventivi dei fornitori e dati dei clienti ----------
   Tutto avviene sul dispositivo: il file non viene mandato a nessuno. Regola d'oro: nessuna voce inventata.
   Ogni voce viene da una riga vera del documento (con pagina e posizione), il totale viene ricontrollato
   con quello del fornitore e i dati del cliente non si mescolano con quelli della ditta o del fornitore. */
var DOCA={busy:false, seq:0, pdf:{}};

// ===================== 1. lettura dei file =====================
function docTipo(f){
  var n=String(f&&f.name||'').toLowerCase(), t=String(f&&f.type||'').toLowerCase();
  if(/pdf/.test(t)||/\.pdf$/.test(n)) return 'pdf';
  if(/\.xlsx$/.test(n)||/spreadsheetml/.test(t)) return 'xlsx';
  if(/\.docx$/.test(n)||/wordprocessingml/.test(t)) return 'docx';
  if(/\.(vcf|vcard)$/.test(n)||/vcard/.test(t)) return 'vcf';
  if(/^image\//.test(t)||/\.(jpe?g|png|webp|gif|bmp|heic|heif)$/.test(n)) return 'foto';
  if(/\.(xls|doc|odt|ods|pages|numbers)$/.test(n)) return 'vecchio';
  if(/^text\//.test(t)||/\.(txt|csv|tsv|eml|md)$/.test(n)||!t&&!/\.\w{2,5}$/.test(n)) return 'testo';
  return '';
}
function docRighe(lines,pg,start){ lines.forEach(function(c,i){ c.pg=pg; if(c.y==null) c.y=-(start+i)*12; if(!c.h) c.h=9; }); return lines; }
function docTesto(t,nome){
  t=String(t||'').replace(/\r\n?/g,'\n');
  return {nome:nome||'Testo',tipo:'testo',righe:docRighe(textToLines(t),1,0),testo:t,imgs:[],pagine:1};
}
function docLeggi(f,msg){
  msg=msg||function(){}; var tipo=docTipo(f), nome=f.name||'documento';
  if(tipo==='vecchio') return Promise.reject(new Error('«'+nome+'» è nel vecchio formato: salvalo come PDF, .xlsx o .docx e riprova'));
  if(tipo==='pdf') return docPdf(f,msg);
  if(tipo==='xlsx') return f.arrayBuffer().then(function(b){ return docXlsx(b,nome); });
  if(tipo==='docx') return f.arrayBuffer().then(function(b){ return docDocx(b,nome); });
  if(tipo==='foto') return docFoto(f,msg);
  if(tipo==='vcf'||tipo==='testo') return f.text().then(function(t){ var d=docTesto(t,nome); if(tipo==='vcf'||/BEGIN:VCARD/i.test(t)) d.tipo='vcf'; return d; });
  return Promise.reject(new Error('Non so leggere «'+nome+'»: usa PDF, foto, Excel (.xlsx), Word (.docx), CSV, testo o contatto (.vcf)'));
}
// --- PDF: testo con posizione, foto dei prodotti ritagliate dalla pagina, scansioni con OCR
function docMul(a,b){ return [a[0]*b[0]+a[2]*b[1],a[1]*b[0]+a[3]*b[1],a[0]*b[2]+a[2]*b[3],a[1]*b[2]+a[3]*b[3],a[0]*b[4]+a[2]*b[5]+a[4],a[1]*b[4]+a[3]*b[5]+a[5]]; }
function docImgBox(pg,P){
  return pg.getOperatorList().then(function(ol){
    var O=P.OPS||{}, ctm=[1,0,0,1,0,0], st=[], out=[];
    for(var i=0;i<ol.fnArray.length;i++){
      var fn=ol.fnArray[i], a=ol.argsArray[i];
      if(fn===O.save) st.push(ctm.slice());
      else if(fn===O.restore){ if(st.length) ctm=st.pop(); }
      else if(fn===O.transform&&a&&a.length>=6) ctm=docMul(ctm,a);
      else if(fn===O.paintFormXObjectBegin){ st.push(ctm.slice()); if(a&&a[0]&&a[0].length===6) ctm=docMul(ctm,a[0]); }
      else if(fn===O.paintFormXObjectEnd){ if(st.length) ctm=st.pop(); }
      else if(fn===O.paintImageXObject||fn===O.paintInlineImageXObject||fn===O.paintJpegXObject||fn===O.paintImageXObjectRepeat){
        var xs=[], ys=[]; [[0,0],[1,0],[0,1],[1,1]].forEach(function(p){ xs.push(ctm[0]*p[0]+ctm[2]*p[1]+ctm[4]); ys.push(ctm[1]*p[0]+ctm[3]*p[1]+ctm[5]); });
        out.push({x0:Math.min.apply(null,xs),x1:Math.max.apply(null,xs),y0:Math.min.apply(null,ys),y1:Math.max.apply(null,ys)});
      }
    }
    return out;
  }).catch(function(){ return []; });
}
function docPdf(f,msg){
  return new Promise(function(ok,ko){
    loadPdfjs(function(e,P){
      if(e) return ko(new Error('Lettore PDF non disponibile ('+(e.message||e)+')'));
      f.arrayBuffer().then(function(buf){ return P.getDocument({data:buf}).promise; }).then(function(pdf){
        var id='d'+(++DOCA.seq), doc={nome:f.name||'PDF',tipo:'pdf',righe:[],testo:'',imgs:[],pagine:pdf.numPages,ocr:0,id:id,pw:{}}, k=1, testi=[];
        DOCA.pdf[id]=pdf;
        (function next(){
          if(k>pdf.numPages||k>30){ doc.testo=testi.join('\n'); docLetterhead(doc); return ok(doc); }
          var pn=k++; msg('Leggo '+doc.nome+' · pagina '+pn+' di '+pdf.numPages+'…');
          pdf.getPage(pn).then(function(pg){
            var vp=pg.getViewport({scale:1}); doc.pw[pn]=vp.width;
            return pg.getTextContent().then(function(tc){
              var items=tc.items.filter(function(i){ return i.str&&i.str.trim(); }).map(function(i){ return {x:i.transform[4],y:i.transform[5],w:i.width,h:i.height||Math.abs(i.transform[3]),s:i.str}; });
              if(items.length>=6){
                var L=docRighe(itemsToLines(items),pn,0); doc.righe=doc.righe.concat(L); doc.tab=(doc.tab||[]).concat(docTabella(L)); testi.push(docLineeTesto(L,vp.width));
                return docImgBox(pg,P).then(function(bx){ bx.forEach(function(b){ var w=b.x1-b.x0, h=b.y1-b.y0; if(w>=14&&h>=14&&w<vp.width*0.62&&h<vp.height*0.4&&w/h<6&&h/w<6){ b.pg=pn; doc.imgs.push(b); } }); next(); });
              }
              // pagina scansionata: la leggo con l'OCR
              var vs=pg.getViewport({scale:2.2}), cv=document.createElement('canvas'); cv.width=vs.width; cv.height=vs.height;
              return pg.render({canvasContext:cv.getContext('2d'),viewport:vs}).promise.then(function(){
                ocrImage(cv,function(its,err,txt){
                  if(its){ doc.ocr++; var L=docRighe(itemsToLines(its,0.9),pn,0); doc.righe=doc.righe.concat(L); doc.tab=(doc.tab||[]).concat(docTabella(L)); testi.push(txt||docLineeTesto(L,vs.width)); }
                  else if(err) msg(err);
                  next();
                },function(p){ msg('Leggo '+doc.nome+' (scansione) · pagina '+pn+' · '+Math.round(p*100)+'%'); });
              });
            });
          }).catch(function(x){ ko(new Error('PDF non leggibile ('+(x&&x.message||x)+')')); });
        })();
      }).catch(function(x){ ko(new Error(/password/i.test(String(x&&x.message))?'Il PDF è protetto da password':'PDF non leggibile ('+(x&&x.message||x)+')')); });
    });
  });
}
// righe di tabella su più linee (descrizioni e codici che vanno a capo, numeri centrati in verticale):
// raggruppo le linee vicine attorno alla linea con i prezzi e ricompongo ogni colonna
var DOC_NOANC=/\b(totale|subtotale|imponibile|iva\s*\d|riportare|riporto|iban|pagamento|scadenza|banca|bonifico|abi|cab|cap\.?\s*soc|rea)\b/i;
function docAncora(c){ var t=c.map(function(x){ return x.s; }).join(' '); return c.some(function(x){ return /\d,\d{2}(?!\d)|^\d+\.\d{2}$/.test(x.s); })&&!DOC_NOANC.test(t)&&!DOC_SPESE.test(t.trim()); }
function docRompe(c){ var t=c.map(function(x){ return x.s; }).join(' '); return !!detectHeader(c)||(!docAncora(c)&&STOPRE.test(c[0].s))||/\b(totale|subtotale|imponibile|riportare|riporto|pagina|pag\.)\b/i.test(t)||DOC_SPESE.test(t.trim()); }
function docUnisci(lines){
  var all=[]; lines.forEach(function(l){ l.forEach(function(c){ all.push({x:c.x,x2:c.x2,s:c.s,y:l.y}); }); });
  all.sort(function(a,b){ return a.x-b.x; }); var cols=[];
  all.forEach(function(c){ var k=null; cols.forEach(function(q){ if(!k&&((c.x<q.x2-1&&c.x2>q.x+1)||Math.abs(c.x-q.x)<4)) k=q; }); if(k){ k.it.push(c); k.x=Math.min(k.x,c.x); k.x2=Math.max(k.x2,c.x2); } else cols.push({x:c.x,x2:c.x2,it:[c]}); });
  var out=cols.map(function(k){ k.it.sort(function(a,b){ return b.y-a.y||a.x-b.x; }); var s=''; k.it.forEach(function(i){ s=s?(/[\-\/]$/.test(s)&&/^[A-Z0-9]/.test(i.s)&&!/\s/.test(i.s)?s+i.s:s+' '+i.s):i.s; }); return {x:k.x,x2:k.x2,s:s}; }).sort(function(a,b){ return a.x-b.x; });
  return out;
}
function docTabella(L){
  if(!L.some(docAncora)) return L;
  var out=[], gr=[];
  function chiudi(){
    if(!gr.length) return; var an=gr.filter(docAncora);
    if(!an.length){ gr.forEach(function(l){ out.push(l); }); gr=[]; return; }
    var parti=an.map(function(a){ return [a]; }), ia=-1;
    gr.forEach(function(l){ var k=an.indexOf(l); if(k>-1){ ia=k; return; }
      if(ia<0){ if(an[0].y-l.y<=Math.max(l.h,an[0].h)*1.35) parti[0].unshift(l); else out.push(l); return; }
      // linea sopra un'ancora senza descrizione e molto vicina: appartiene alla riga sotto (testo centrato)
      var sotto=an[ia+1], prima=parti[ia][parti[ia].length-1];
      if(sotto&&l.y-sotto.y<=sotto.h*1.25&&prima.y-l.y>(l.y-sotto.y)*1.3) parti[ia+1].unshift(l); else parti[ia].push(l); });
    parti.forEach(function(p){ p.sort(function(a,b){ return b.y-a.y; }); var a=p.filter(docAncora)[0], m=/** @type {any} */(docUnisci(p)); m.y=a.y; m.h=a.h; m.pg=a.pg; m.yTop=p[0].y; m.yBot=p[p.length-1].y; out.push(m); });
    gr=[];
  }
  L.forEach(function(l){
    if(docRompe(l)){ chiudi(); out.push(l); return; }
    var pr=gr[gr.length-1]; if(pr&&pr.y-l.y>Math.max(pr.h,l.h)*1.6) chiudi();
    gr.push(l);
  });
  chiudi();
  return out;
}
// intestazioni e loghi ripetuti su ogni pagina non sono foto di prodotti
function docLetterhead(doc){
  if(doc.pagine<2) return; var cnt={};
  function k(b){ return [Math.round(b.x0/4),Math.round(b.y0/4),Math.round((b.x1-b.x0)/4),Math.round((b.y1-b.y0)/4)].join(','); }
  doc.imgs.forEach(function(b){ cnt[k(b)]=(cnt[k(b)]||0)+1; });
  doc.imgs=doc.imgs.filter(function(b){ return cnt[k(b)]<2; });
}
// testo per colonne: blocchi a sinistra e a destra non si mescolano (fornitore e destinatario affiancati)
function docLineeTesto(L,pw){
  var sx=[], dx=[], mid=(pw||600)*0.5, py=null;
  L.forEach(function(c){
    if(py!=null&&py-c.y>(c.h||9)*1.8){ sx.push(''); dx.push(''); } py=c.y;
    var segs=[], cur=null;
    c.forEach(function(x){ if(cur&&x.x-cur.x2<(c.h||9)*2.6){ cur.s+=' '+x.s; cur.x2=x.x2; } else { cur={x:x.x,x2:x.x2,s:x.s}; segs.push(cur); } });
    var num=c.filter(function(x){ return /\d+,\d{2}/.test(x.s); }).length;
    if(segs.length>1&&num<2){ var a=segs.filter(function(s){ return s.x<mid; }), b=segs.filter(function(s){ return s.x>=mid; }); if(a.length) sx.push(a.map(function(s){ return s.s; }).join('   ')); if(b.length) dx.push(b.map(function(s){ return s.s; }).join('   ')); dx.push(''); sx.push(''); }
    else sx.push(c.map(function(x){ return x.s; }).join('  '));
  });
  return sx.join('\n').replace(/\n{3,}/g,'\n\n')+'\n\n'+dx.join('\n').replace(/\n{3,}/g,'\n\n');
}
function docCrop(doc,b){
  var pdf=DOCA.pdf[doc.id]; if(!pdf) return Promise.resolve('');
  return pdf.getPage(b.pg).then(function(pg){
    var cache=doc.cv||(doc.cv={});
    var go=cache[b.pg]?Promise.resolve(cache[b.pg]):(function(){ var vp=pg.getViewport({scale:2.5}), cv=document.createElement('canvas'); cv.width=vp.width; cv.height=vp.height; var x=cv.getContext('2d'); x.fillStyle='#fff'; x.fillRect(0,0,cv.width,cv.height);
      return pg.render({canvasContext:x,viewport:vp}).promise.then(function(){ cache[b.pg]={cv:cv,vp:vp}; return cache[b.pg]; }); })();
    return go.then(function(c){
      var p0=c.vp.convertToViewportPoint(b.x0,b.y0), p1=c.vp.convertToViewportPoint(b.x1,b.y1);
      var x=Math.max(0,Math.floor(Math.min(p0[0],p1[0]))), y=Math.max(0,Math.floor(Math.min(p0[1],p1[1]))), w=Math.min(c.cv.width-x,Math.ceil(Math.abs(p1[0]-p0[0]))), h=Math.min(c.cv.height-y,Math.ceil(Math.abs(p1[1]-p0[1])));
      if(w<8||h<8) return '';
      var sc=Math.min(1,800/Math.max(w,h)), o=document.createElement('canvas'); o.width=Math.round(w*sc); o.height=Math.round(h*sc);
      var ox=o.getContext('2d'); ox.fillStyle='#fff'; ox.fillRect(0,0,o.width,o.height); ox.drawImage(c.cv,x,y,w,h,0,0,o.width,o.height);
      return o.toDataURL('image/jpeg',0.86);
    });
  }).catch(function(){ return ''; });
}
// --- foto (preventivo fotografato, biglietto da visita): OCR sul dispositivo
function docFoto(f,msg){
  return new Promise(function(ok,ko){
    readImage(f,2600,false,function(u){
      if(!u) return ko(new Error('Immagine non leggibile'));
      msg('Leggo il testo della foto…');
      ocrImage(u,function(its,err,txt){
        if(!its) return ko(new Error(err||'Lettura della foto non riuscita'));
        var L=docRighe(itemsToLines(its,0.9),1,0), mx=0; its.forEach(function(i){ mx=Math.max(mx,i.x+(i.w||0)); });
        ok({nome:f.name||'Foto',tipo:'foto',righe:L,tab:docTabella(L),testo:txt||docLineeTesto(L,mx||1000),imgs:[],pagine:1,ocr:1});
      },function(p){ msg('Leggo il testo della foto · '+Math.round(p*100)+'%'); });
    });
  });
}
// --- Excel (.xlsx) e Word (.docx): sono zip di XML, li apro qui senza librerie
function docXml(s){ return new DOMParser().parseFromString(s,'application/xml'); }
function docT(el,n){ return Array.prototype.slice.call(el?el.getElementsByTagNameNS('*',n):[]); }
var DOC_RNS='http://schemas.openxmlformats.org/officeDocument/2006/relationships';
function docRid(el,n){ return el.getAttributeNS(DOC_RNS,n)||el.getAttribute('r:'+n)||''; }
function docZip(buf){ return zipRead(buf).then(function(L){ var m={}; L.forEach(function(e){ m[e.name]=e.data; }); return m; }); }
function docUtf(u){ return u?new TextDecoder('utf-8').decode(u):''; }
function docRels(z,path){ var r={}, x=z[path]; if(!x) return r; var d=docXml(docUtf(x)); docT(d,'Relationship').forEach(function(e){ r[e.getAttribute('Id')]=e.getAttribute('Target'); }); return r; }
function docJoin(base,t){ if(/^\//.test(t)) return t.slice(1); var p=base.split('/'); p.pop(); t.split('/').forEach(function(s){ if(s==='..') p.pop(); else if(s!=='.') p.push(s); }); return p.join('/'); }
function docMedia(z,path){
  var u=z[path]; if(!u) return Promise.resolve('');
  var ext=(path.split('.').pop()||'').toLowerCase(), mt={png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',gif:'image/gif',webp:'image/webp',bmp:'image/bmp'}[ext];
  if(!mt) return Promise.resolve('');
  return new Promise(function(ok){ readImage(new Blob([u],{type:mt}),800,false,function(d){ ok(d||''); }); });
}
function docCol(ref){ var m=String(ref||'').match(/^([A-Z]+)(\d+)/), n=0; if(!m) return {c:0,r:0}; for(var i=0;i<m[1].length;i++) n=n*26+(m[1].charCodeAt(i)-64); return {c:n-1,r:+m[2]-1}; }
function docXlsx(buf,nome){
  return docZip(buf).then(function(z){
    var ss=[], sx=z['xl/sharedStrings.xml'];
    if(sx) docT(docXml(docUtf(sx)),'si').forEach(function(si){ ss.push(docT(si,'t').map(function(t){ return t.textContent; }).join('')); });
    var pct={}, dec2={}, sty=z['xl/styles.xml'];
    if(sty){ var sd=docXml(docUtf(sty)), cf={}; docT(sd,'numFmt').forEach(function(n){ cf[n.getAttribute('numFmtId')]=n.getAttribute('formatCode')||''; });
      var xfs=docT(sd,'cellXfs')[0]; if(xfs) docT(xfs,'xf').forEach(function(x,i){ var id=x.getAttribute('numFmtId'); if(id==='9'||id==='10'||/%/.test(cf[id]||'')) pct[i]=1; else if(/^(2|4|7|8|39|40|43|44)$/.test(id)||/0[.,]00/.test(cf[id]||'')) dec2[i]=1; }); }
    var wb=docXml(docUtf(z['xl/workbook.xml'])), rel=docRels(z,'xl/_rels/workbook.xml.rels'), sheets=docT(wb,'sheet').map(function(s){ return docJoin('xl/workbook.xml',rel[docRid(s,'id')]||''); });
    var doc={nome:nome,tipo:'xlsx',righe:[],testo:'',imgs:[],pagine:sheets.length}, testi=[], jobs=[];
    sheets.forEach(function(sp,si){
      if(!z[sp]) return; var d=docXml(docUtf(z[sp])), rows={};
      docT(d,'c').forEach(function(c){
        var p=docCol(c.getAttribute('r')), t=c.getAttribute('t'), v=docT(c,'v')[0], s='';
        if(t==='s') s=ss[+(v&&v.textContent)]||''; else if(t==='inlineStr') s=docT(c,'t').map(function(x){ return x.textContent; }).join(''); else if(v){ s=v.textContent; if(t!=='str'&&t!=='b'&&/^-?\d+(\.\d+)?(e-?\d+)?$/i.test(s)){ var n=parseFloat(s); var st_=+c.getAttribute('s'); if(pct[st_]) s=String(r2(n*100)).replace('.',',')+'%'; else if(dec2[st_]) s=n.toFixed(2).replace('.',','); else s=Math.abs(n-Math.round(n))<1e-9?String(Math.round(n)):n.toFixed(Math.abs(n)<1?4:2).replace(/0+$/,'').replace(/\.$/,'').replace('.',','); if(/,\d$/.test(s)) s+='0'; } }
        s=String(s).trim(); if(!s) return; (rows[p.r]=rows[p.r]||[]).push({x:p.c*100,x2:p.c*100+90,s:s.replace(/\s+/g,' ')});
      });
      var L=Object.keys(rows).map(Number).sort(function(a,b){ return a-b; }).map(function(r){ var c=rows[r].sort(function(a,b){ return a.x-b.x; }); c.y=-r*12; c.h=9; c.pg=si+1; return c; });
      doc.righe=doc.righe.concat(L); testi.push(L.map(function(c){ return c.map(function(x){ return x.s; }).join('  '); }).join('\n'));
      // foto ancorate alle celle
      var srel=docRels(z,sp.replace(/worksheets\/(sheet\d+\.xml)$/,'worksheets/_rels/$1.rels'));
      Object.keys(srel).forEach(function(k){ var dp=docJoin(sp,srel[k]); if(!/drawings\/drawing\d+\.xml$/.test(dp)||!z[dp]) return;
        var dd=docXml(docUtf(z[dp])), drel=docRels(z,dp.replace(/drawings\/(drawing\d+\.xml)$/,'drawings/_rels/$1.rels'));
        ['twoCellAnchor','oneCellAnchor','absoluteAnchor'].forEach(function(tag){ docT(dd,tag).forEach(function(an){
          var fr=docT(an,'from')[0], to=docT(an,'to')[0], bl=docT(an,'blip')[0]; if(!fr||!bl) return;
          var r0=+((docT(fr,'row')[0]||{}).textContent||0), r1=to?+((docT(to,'row')[0]||{}).textContent||r0):r0, emb=docRid(bl,'embed'), mp=drel[emb]?docJoin(dp,drel[emb]):'';
          if(!mp) return; var b={pg:si+1,x0:0,x1:50,y0:-r1*12-2,y1:-r0*12+11};
          jobs.push(docMedia(z,mp).then(function(u){ if(u){ b.url=u; doc.imgs.push(b); } }));
        }); });
      });
    });
    doc.testo=testi.join('\n\n');
    return Promise.all(jobs).then(function(){ return doc; });
  });
}
function docDocx(buf,nome){
  return docZip(buf).then(function(z){
    var x=z['word/document.xml']; if(!x) throw new Error('File Word non valido');
    var d=docXml(docUtf(x)), rel=docRels(z,'word/_rels/document.xml.rels'), body=docT(d,'body')[0], L=[], testi=[], jobs=[], doc={nome:nome,tipo:'docx',righe:L,testo:'',imgs:[],pagine:1}, k=0;
    function txt(n){ var s=''; (function w(e){ Array.prototype.forEach.call(e.childNodes,function(c){ if(c.localName==='t') s+=c.textContent; else if(c.localName==='tab') s+='  '; else if(c.localName==='br'||c.localName==='cr') s+='\n'; else if(c.localName==='p'&&s&&!/\n$/.test(s)){ w(c); s+='\n'; } else if(c.childNodes&&c.childNodes.length) w(c); }); })(n); return s.replace(/\n+$/,''); }
    function riga(cells,imgs){ var c=cells.map(function(s,i){ return {x:i*100,x2:i*100+90,s:s}; }).filter(function(x){ return x.s; }); if(!c.length&&!imgs.length) return; c.y=-k*12; c.h=9; c.pg=1; if(c.length) L.push(c);
      imgs.forEach(function(emb){ var mp=rel[emb]?docJoin('word/document.xml',rel[emb]):''; if(!mp) return; var b={pg:1,x0:0,x1:50,y0:-k*12-2,y1:-k*12+11}; jobs.push(docMedia(z,mp).then(function(u){ if(u){ b.url=u; doc.imgs.push(b); } })); });
      k++; }
    function blips(n){ return docT(n,'blip').map(function(b){ return docRid(b,'embed'); }).filter(Boolean); }
    Array.prototype.forEach.call(body?body.childNodes:[],function(n){
      if(n.localName==='p'){ var t=txt(n); t.split('\n').forEach(function(s){ testi.push(s); riga([s.trim()],[]); }); }
      else if(n.localName==='tbl'){ docT(n,'tr').forEach(function(tr){ var cs=[], im=[]; Array.prototype.forEach.call(tr.childNodes,function(tc){ if(tc.localName!=='tc') return; cs.push(txt(tc).replace(/\s*\n\s*/g,' ').trim()); im=im.concat(blips(tc)); }); testi.push(cs.join('   ')); riga(cs,im); }); testi.push(''); }
    });
    doc.testo=testi.join('\n');
    return Promise.all(jobs).then(function(){ return doc; });
  });
}

// ===================== 2. dati del cliente, senza confusione =====================
var CL_ODD={'0':1,'1':0,'2':5,'3':7,'4':9,'5':13,'6':15,'7':17,'8':19,'9':21,A:1,B:0,C:5,D:7,E:9,F:13,G:15,H:17,I:19,J:21,K:2,L:4,M:18,N:20,O:11,P:3,Q:6,R:8,S:12,T:14,U:16,V:10,W:22,X:25,Y:24,Z:23};
function clCfOk(cf){
  cf=String(cf||'').toUpperCase(); if(!/^[A-Z]{6}[0-9LMNPQRSTUV]{2}[ABCDEHLMPRST][0-9LMNPQRSTUV]{2}[A-Z][0-9LMNPQRSTUV]{3}[A-Z]$/.test(cf)) return false;
  var s=0; for(var i=0;i<15;i++){ var c=cf[i]; s+=i%2===0?CL_ODD[c]:(/\d/.test(c)?+c:c.charCodeAt(0)-65); }
  return String.fromCharCode(65+s%26)===cf[15];
}
var CL_CF_L={'0':'O','1':'I','2':'Z','3':'E','4':'A','5':'S','6':'G','7':'T','8':'B'}, CL_CF_D={O:'0',Q:'0',D:'0',I:'1',Z:'2',E:'3',A:'4',G:'6',B:'8',J:'1'};
function clCfRipara(x){
  x=String(x||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
  for(var o=0;o+16<=x.length;o++){ var c=x.substr(o,16).split('');
    [0,1,2,3,4,5,8,11,15].forEach(function(i){ if(CL_CF_L[c[i]]) c[i]=CL_CF_L[c[i]]; });
    [6,7,9,10,12,13,14].forEach(function(i){ if(CL_CF_D[c[i]]) c[i]=CL_CF_D[c[i]]; });
    var v=c.join(''); if(clCfOk(v)) return v; }
  return '';
}
function clPivaOk(p){ p=String(p||'').replace(/\D/g,''); if(!/^\d{11}$/.test(p)||/^0{11}$/.test(p)) return false; var s=0; for(var i=0;i<10;i++){ var d=+p[i]; if(i%2){ d*=2; if(d>9) d-=9; } s+=d; } return (10-s%10)%10===+p[10]; }
function clLett(s){ return String(s||'').toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^A-Z]/g,''); }
function clCfCog(s){ s=clLett(s); var c=s.replace(/[AEIOU]/g,''), v=s.replace(/[^AEIOU]/g,''); return (c+v+'XXX').slice(0,3); }
function clCfNom(s){ s=clLett(s); var c=s.replace(/[AEIOU]/g,''), v=s.replace(/[^AEIOU]/g,''); if(c.length>=4) return c[0]+c[2]+c[3]; return (c+v+'XXX').slice(0,3); }
// il codice fiscale conferma il nome e dice se è scritto «Cognome Nome» o «Nome Cognome»
function clCfNome(nome,cf){
  var w=String(nome||'').replace(/\b(sig|sig\.ra|dott|ing|geom|arch|avv|sigra|famiglia)\.?\s+/ig,'').split(/\s+/).filter(function(x){ return /[A-Za-zÀ-ÿ]/.test(x); }); cf=String(cf||'').toUpperCase(); if(w.length<2||cf.length!==16) return '';
  for(var i=1;i<w.length;i++){ var a=w.slice(0,i).join(''), b=w.slice(i).join('');
    if(clCfCog(a)+clCfNom(b)===cf.slice(0,6)) return 'cn'; if(clCfCog(b)+clCfNom(a)===cf.slice(0,6)) return 'nc'; }
  return '';
}
function clDig(s){ return String(s||'').replace(/\D/g,''); }
function clMieiDati(){
  var c=S.company||{}, nm=lc(c.name).replace(/\b(s\.?\s?r\.?\s?l\.?s?|s\.?\s?p\.?\s?a\.?|s\.?\s?n\.?\s?c\.?|s\.?\s?a\.?\s?s\.?|srl|spa|snc|sas|di|e|&)\b/g,' ').replace(/[^a-z0-9 ]/g,' ').trim().split(/\s+/).filter(function(x){ return x.length>=3; });
  var tel=[c.tel,c.wa,c.wa2,c.fax].map(clDig).filter(function(x){ return x.length>=6; }).map(function(x){ return x.replace(/^39(?=\d{9,10}$)/,''); });
  return {nome:nm,tel:tel,email:lc(c.email),piva:clDig(c.piva).slice(-11),web:lc(c.web).replace(/^https?:\/\/|^www\./g,''),addr:lc(String(c.addr||'').split(',')[0])};
}
function clMio(t,M){
  var s=lc(t); M=M||clMieiDati();
  if(M.nome.length&&M.nome.every(function(w){ return new RegExp('(^|[^a-z])'+w+'([^a-z]|$)').test(s); })) return true;
  if(M.piva&&clDig(t).indexOf(M.piva)>-1) return true;
  if(M.email&&s.indexOf(M.email)>-1) return true;
  if(M.web&&s.indexOf(M.web)>-1) return true;
  var d=clDig(t); if(M.tel.some(function(x){ return d.indexOf(x)>-1; })) return true;
  if(M.addr&&M.addr.length>8&&s.indexOf(M.addr)>-1) return true;
  return false;
}
var CL_VIA='(?:via|viale|v\\.le|vle|piazza|p\\.zza|p\\.za|pza|piazzale|p\\.le|corso|c\\.so|contrada|c\\.da|c\\/da|cda|località|localita|loc\\.|frazione|fraz\\.|strada|str\\.|vico|vicolo|largo|l\\.go|traversa|rione|borgo|lungomare|salita|circonvallazione|zona industriale|z\\.i\\.|via\\s+vecchia)';
var CL_LAB=/(?:^|[\s(|,;])(rif(?:\.|erimento)?\s*(?:cantiere|cliente|commessa|lavori|lavoro)?|cantiere|cliente(?:\s+finale)?|committente|destinatario(?:\s+(?:merce|finale|lavori))?|destinazione(?:\s+(?:merce|lavori|finale|materiale))?|luogo\s+(?:dei\s+|di\s+)?(?:lavori|consegna|installazione)|indirizzo\s+(?:del\s+)?(?:cantiere|lavori|di\s+consegna|installazione)|consegna\s+(?:presso|a|c\/o)|intestatario|intestato\s+a|nominativo|nome\s+e\s+cognome|cognome\s+e\s+nome|ragione\s+sociale|spett(?:\.|abile)?\s*(?:le)?|alla\s+c\.\s*a\.?|alla\s+cortese\s+attenzione(?:\s+d(?:i|el|ella))?|c\.a\.|egr(?:\.|egio)\s*(?:sig(?:\.|nor)?)?|gent(?:\.|ile|\.mo|\.ma|\.mi)?\s*(?:sig(?:\.|nor)?(?:ra|a)?\.?)|sig(?:\.|nor)(?:ra|a)?\.?|sig\.ra|condominio|famiglia|fam\.)\s*[:.\-–]?\s*/i;
var CL_NONOME=/^(offerta|preventivo|ordine|n\.|nr|numero|data|del|vs|ns|vostr|nostr|pagina|pag|totale|imponibile|oggetto|codice|fornitura|materiale|come|per|in|da|gentile|buongiorno|buonasera|salve|ciao|grazie|cordiali|distinti|saluti|allegato|consegna|pagamento|iva|cell|tel|telefono|email|e-mail|mail|pec|cap|cf|c\.f\.|p\.?\s?iva|codice fiscale|partita|prezzi|validit|condizioni|note|ditta|impianto|lavori|lavoro|cantiere|sopralluogo|richiesta|preventivi|merce|spedizione|trasporto)\b/i;
function clTitolo(s){
  s=String(s||'').replace(/\s+/g,' ').trim();
  if(s===s.toUpperCase()||s===s.toLowerCase()) s=s.toLowerCase().replace(/(^|[\s'\-.(])([a-zà-ÿ])/g,function(m,a,b){ return a+b.toUpperCase(); });
  return s.replace(/\bS\.?\s?R\.?\s?L\.?(S\.?)?(?=\s|$|,)/i,'S.r.l.').replace(/\bS\.?\s?P\.?\s?A\.?(?=\s|$|,)/i,'S.p.A.').replace(/\bS\.?\s?N\.?\s?C\.?(?=\s|$|,)/i,'S.n.c.').replace(/\bS\.?\s?A\.?\s?S\.?(?=\s|$|,)/i,'S.a.s.').replace(/\bAz\.\s/i,'Az. ').replace(/\b(Di|De|Del|Della|Dei|Degli|Delle|D')\b(?=\s)/g,function(m){ return m; });
}
function clNomeBuono(s){
  s=String(s||'').trim().replace(/^[\-–:,.\s]+|[\-–:,.\s]+$/g,'');
  if(s.length<3||s.length>70||/@|\d{3}|www\.|https?:/i.test(s)||!/[A-Za-zÀ-ÿ]{2}/.test(s)) return '';
  if(new RegExp('^'+CL_VIA+'\\s','i').test(s)||CL_NONOME.test(s)) return '';
  if(s.split(/\s+/).length>7) return '';
  if(AS_MARCHE.some(function(b){ return lc(b)===lc(s); })) return '';
  s=clTitolo(s);
  if(s.split(/\s+/).some(function(w,i){ return i>0&&/^[a-zà-ÿ]/.test(w)&&!/^(di|de|del|della|dello|dei|degli|delle|d'|e|&|van|von|da|dal|dalla|lo|la|le)$/i.test(w); })) return '';
  if(/\b(fornitore|cliente|committente|preventivo|offerta)\b/i.test(s)) return '';
  return s;
}
// un'etichetta vale solo se dopo c'è davvero un nome (non «del cliente. Il fornitore…»)
function clLabOk(m,after){ if(/\.\s*$/.test(m[0])&&!/^(sig|gent|egr|spett|c\.a|alla c|fam)/i.test(m[1])) return false; var a=String(after||'').replace(/^\s*(?:(?:è|e'|sono)\s+(?:il\s+|la\s+|lo\s+)?)?/i,''); return !a.trim()||/^\s*[A-ZÀ-Ý0-9"«]/.test(a)||/^\s*(?:sig|dott|ing|arch|geom|avv|rag)\b/i.test(a)||/[:\-–]\s*$/.test(m[0]); }
function clHaLab(b){ var re=new RegExp(CL_LAB.source,'gi'), m; while((m=re.exec(b))){ if(!m[0].length){ re.lastIndex++; continue; } if(clLabOk(m,b.slice(m.index+m[0].length))) return m; } return null; }
// dal punto dopo l'etichetta: nome fino a separatore o inizio indirizzo/contatti
function clNomeDa(t){
  t=String(t||'').replace(/^\s+/,'').replace(/^(?:è|e'|sono)\s+(?:il\s+|la\s+|lo\s+)?/i,'').replace(/^(?:(?:sig(?:\.|nor)?(?:ra|a)?\.?|sig\.ra|signor[ae]?|dott(?:\.|or)?(?:ssa)?\.?|ing\.|arch\.|geom\.|avv\.|rag\.)\s*)+/i,''); var cut=t.search(new RegExp('\\s[-–|]\\s|[,;|\\n(]|\\s(?=(?:'+CL_VIA+')\\s)|\\s(?:tel|tel\\.|cell|cell\\.|telefono|mobile|email|e-mail|mail|c\\.f\\.|cf|p\\.?\\s?iva|codice fiscale)\\b|\\s\\d{5}\\s|\\s\\+?\\d{3}','i'));
  return clNomeBuono(cut>0?t.slice(0,cut):t);
}
function clIndirizzo(t){
  var re=new RegExp('(?:^|[\\s,(:;\\-])('+CL_VIA+')\\s+([^\\n,;|]{2,60}?)(?:\\s*,?\\s*(?:n\\.?|n°|nr\\.?|civico)?\\s*(\\d{1,4}(?:[a-z](?![a-z]))?(?:\\/\\s?[a-z0-9]{1,3})?|snc|s\\.n\\.c\\.?|s\\.n\\.|km\\s?[\\d,.]+)(?=[\\s,;|\\n\\-–.)]|$)|(?=\\s*(?:[,;|\\n\\-–]|\\s\\d{5}\\b|\\s(?:tel|cell|telefono|mobile|email|mail|c\\.f\\.|p\\.?\\s?iva)\\b|$)))','i');
  var m=t.match(re); if(!m) return null;
  var via=(m[1]+' '+m[2]).replace(/\s+/g,' ').trim(), civ=m[3]?m[3].replace(/\s+/g,'').replace(/^s\.?n\.?c?\.?$/i,'snc'):'';
  if(/^(e|di|del|della)$/i.test(m[2].trim())) return null;
  var rest=t.slice(m.index+m[0].length,m.index+m[0].length+90), cap='', citta='', pr='';
  var m2=civ&&/^\d{1,2}$/.test(civ)?rest.match(/^\s*,\s*(\d{1,4}[a-z]?(?:\/[a-z0-9]{1,3})?)(?=[\s,;|\n\-–.)]|$)/i):null;
  if(m2){ via+=' '+({'1':'I','2':'II','3':'III'}[civ]||civ); civ=m2[1]; rest=rest.slice(m2[0].length); }
  var mc=rest.match(/^\s*[,\-–]?\s*(?:\n\s*)?(\d{5})\s*[,\-–]?\s*([A-Za-zÀ-ÿ'][A-Za-zÀ-ÿ' .]{1,34}?)\s*(?:\(\s*([A-Za-z]{2})\s*\)|[,\-–]\s*([A-Z]{2})\b|\s([A-Z]{2})\b|(?=\s*(?:[,;:.|\n\-–]|$|\s(?:tel|cell|telefono|email|mail|italia|italy)\b)))/);
  if(mc){ cap=mc[1]; citta=mc[2].trim(); pr=(mc[3]||mc[4]||mc[5]||'').toUpperCase(); }
  else { var mt=rest.match(/^\s*(?:[,\-–]|\sa|\sin)?\s*([A-ZÀ-Ý][A-Za-zÀ-ÿ']+(?:\s[A-ZÀ-Ý][A-Za-zÀ-ÿ']+){0,2})\s*(?:\(\s*([A-Z]{2})\s*\))?(?=\s*(?:[,;:.|\n\-–(]|$)|\s+[a-zà-ÿ])/); if(mt&&!/^(Tel|Cell|Email|Mail|Telefono|Interno|Int|Scala|Piano|Cap|Snc|Presso)$/i.test(mt[1])){ citta=mt[1]; pr=mt[2]||''; } }
  var s=clTitolo(via).replace(/^[a-z]/,function(c){ return c.toUpperCase(); })+(civ?' '+civ:''), loc=[cap,citta?clTitolo(citta):''].filter(Boolean).join(' ');
  return {addr:s+(loc?', '+loc:'')+(pr?' ('+pr+')':''),via:s,cap:cap,citta:citta,pr:pr,i:m.index,n:m[0].length};
}
var CL_TELRE=/(?:(?:\+|00)39[\s.\-]?)?(?:3\d{2}[\s.\-\/]?\d{3}[\s.\-]?\d{3,4}|0\d{1,4}[\s.\-\/]?\d{2,4}[\s.\-]?\d{2,5})(?!\d|,\d)/g;
function clTelefoni(t){
  var out=[], s=String(t).replace(/IT\d{2}[A-Z]\d{10}[0-9A-Z]{12}/gi,' ').replace(/\b\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{2,4}\b/g,' ').replace(/\b\d{11}\b/g,' ').replace(/\d+,\d{2}\b/g,' ');
  var m; CL_TELRE.lastIndex=0;
  while((m=CL_TELRE.exec(s))){
    var raw=m[0], d=clDig(raw).replace(/^(00)?39(?=\d{9,10}$)/,''), pre=s.slice(Math.max(0,m.index-14),m.index).toLowerCase();
    if(m.index>0&&/[\dA-Za-z]/.test(s[m.index-1])) continue;
    if(!(/^3\d{8,9}$/.test(d)||/^0\d{5,10}$/.test(d))) continue;
    out.push({t:raw.replace(/[\s.\-\/]+/g,' ').trim(),d:d,fax:/fax\W*$/.test(pre),cell:/^3/.test(d),lab:/(tel|cell|telefono|mobile|whatsapp|cellulare|recapito|numero)\W*$/.test(pre)});
  }
  return out;
}
function clEmail(t){ return (String(t).match(/[\w.+\-]+@[\w\-]+(?:\.[\w\-]+)+/g)||[]).map(function(e){ return e.replace(/[.]+$/,''); }); }
function clCodici(t){
  var out={cf:[],piva:[],sdi:''}, u=String(t).toUpperCase(), m, re=/\b([A-Z]{6}[0-9LMNPQRSTUV]{2}[ABCDEHLMPRST][0-9LMNPQRSTUV]{2}[A-Z][0-9LMNPQRSTUV]{3}[A-Z])\b/g;
  while((m=re.exec(u))) if(clCfOk(m[1])&&out.cf.indexOf(m[1])<0) out.cf.push(m[1]);
  if(!out.cf.length){ var rl=/(CODICE\s+FISCALE|COD\.?\s*FISC\.?|FISCAL\s+CODE|C\.\s?F\.)[^A-Z0-9]{0,8}([A-Z0-9][A-Z0-9 ]{15,23})/g, mm;
    while((mm=rl.exec(u))){ var rpc=clCfRipara(mm[2]); if(rpc&&out.cf.indexOf(rpc)<0) out.cf.push(rpc); }
    if(!out.cf.length) (u.match(/\b[A-Z0-9]{16}\b/g)||[]).forEach(function(tk){ if(/^[A-Z0-9]{6}/.test(tk)&&(tk.match(/[A-Z]/g)||[]).length>=7){ var r=clCfRipara(tk); if(r&&out.cf.indexOf(r)<0) out.cf.push(r); } }); }
  var rp=/(P\.?\s?IVA|PARTITA\s+IVA|P\.?\s?I\.?|VAT|C\.?\s?F\.?(?:\s*(?:E|\/)\s*P\.?\s?IVA)?|COD(?:ICE)?\.?\s*FISC(?:ALE)?\.?)\s*[:.\-n°]*\s*(?:IT\s?)?(\d{11})\b/g;
  while((m=rp.exec(u))) if(out.piva.indexOf(m[2])<0) out.piva.push(m[2]);
  var r2_=/\bIT\s?(\d{11})\b/g; while((m=r2_.exec(u))) if(clPivaOk(m[1])&&out.piva.indexOf(m[1])<0) out.piva.push(m[1]);
  var ms=u.match(/(?:CODICE\s+(?:DESTINATARIO|UNIVOCO|SDI)|COD(?:\.|ICE)?\s*(?:DEST|UNIVOCO)\.?|\bSDI)\s*[:.]?\s*([A-Z0-9]{7})\b/); if(ms&&/\d/.test(ms[1])||ms&&/^[A-Z0-9]{7}$/.test(ms[1])&&ms[1]!=='0000000') out.sdi=ms?ms[1]:'';
  return out;
}
// vCard (contatto condiviso dal telefono), anche con caratteri codificati
function clVcard(t){
  var s=String(t).replace(/\r\n?/g,'\n').replace(/=\n/g,'').replace(/\n[ \t]/g,''), o={}, isQP=/ENCODING=QUOTED-PRINTABLE/i.test(s);
  function dec(v,qp){ if(!qp) return v.replace(/\\,/g,',').replace(/\\;/g,';').replace(/\\n/gi,' '); try{ var b=[]; v.replace(/=([0-9A-F]{2})|([^=])/gi,function(m,h,c){ if(h) b.push(parseInt(h,16)); else { var e=new TextEncoder().encode(c); for(var i=0;i<e.length;i++) b.push(e[i]); } return ''; }); return new TextDecoder('utf-8').decode(new Uint8Array(b)); }catch(e){ return v; } }
  s.split('\n').forEach(function(l){ var i=l.indexOf(':'); if(i<1) return; var k=l.slice(0,i), v=l.slice(i+1), key=k.split(';')[0].toUpperCase().replace(/^ITEM\d+\./,''), qp=/QUOTED-PRINTABLE/i.test(k); v=dec(v,qp||isQP&&/=[0-9A-F]{2}/.test(v));
    if(key==='FN'&&!o.name) o.name=v.trim();
    else if(key==='N'&&!o.n){ var p=v.split(';'); o.n=[p[1],p[0]].filter(Boolean).join(' ').trim(); }
    else if(key==='ORG'&&!o.org) o.org=v.split(';')[0].trim();
    else if(key==='TEL'){ (o.tel=o.tel||[]).push({t:v.trim(),cell:/CELL|MOBILE/i.test(k)||/^(\+39\s?)?3/.test(v.trim()),fax:/FAX/i.test(k)}); }
    else if(key==='EMAIL'&&!o.email) o.email=v.trim();
    else if(key==='ADR'&&!o.addr){ var a=v.split(';'), via=(a[2]||'').trim(), cit=(a[3]||'').trim(), pr=(a[4]||'').trim(), cap=(a[5]||'').trim(); if(via||cit) o.addr=[via,[cap,cit].filter(Boolean).join(' ')].filter(Boolean).join(', ')+(pr&&/^[A-Z]{2}$/i.test(pr)?' ('+pr.toUpperCase()+')':''); }
    else if(key==='NOTE'&&!o.note) o.note=v; });
  return o;
}
// blocchi di testo (paragrafi): ogni blocco appartiene a una sola persona o ditta
function clBlocchi(t){
  var out=[], cur=[];
  String(t||'').replace(/\r\n?/g,'\n').split('\n').forEach(function(l){ if(!l.trim()){ if(cur.length) out.push(cur.join('\n')); cur=[]; } else cur.push(l); });
  if(cur.length) out.push(cur.join('\n'));
  return out;
}
function clTogliMiei(x,M){
  M.nome.forEach(function(w){ x=x.replace(new RegExp('\\b'+w+'\\b(\\s*(s\\.?\\s?r\\.?\\s?l\\.?|srl))?','gi'),' '); });
  clTelefoni(x).forEach(function(t){ if(M.tel.indexOf(t.d)>-1) x=x.split(t.t).join(' '); });
  if(M.email) x=x.replace(new RegExp(M.email.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'gi'),' ');
  return x;
}
// nel preventivo di un fornitore il cliente è solo dove c'è scritto (cantiere, destinazione, riferimento…)
function clSaluto(m){ return /^(spett|alla c|c\.a\.|egr|gent|sig)/i.test(m[1]); }
function clSoloEtichette(b,M){
  var r=b.split('\n'), out=[], cli=r.some(function(l){ var m=clHaLab(l); return m&&!clSaluto(m)&&!clMio(l,M); });
  r.forEach(function(l,i){ var m=clHaLab(l); if(!m||clMio(l,M)||(cli&&clSaluto(m))) return; var dopo=l.slice(m.index+m[0].length).trim(), k=i+1, n=0;
    out.push(l);
    while(k<r.length&&n<4&&!clHaLab(r[k])&&!clMio(r[k],M)&&(dopo.length<4||/(?:\b(?:cf|c\.f\.|tel\.?|cell\.?|e-?mail|p\.?\s?iva|codice fiscale))[:.]?\s*$/i.test(r[k-1])||/^\s*(\d{5}\b|(?:tel|cell|telefono|email|e-mail|c\.f\.|p\.?\s?iva|cod)|(?:via|viale|piazza|corso|contrada|c\.da|loc)\b)/i.test(r[k]))){ out.push(r[k]); k++; n++; } });
  return out.join('\n');
}
// legge i dati del cliente da un testo. ctx: 'libero' (messaggio, descrizione), 'contatto' (vcf, biglietto), 'fornitore' (preventivo di un fornitore)
function clLeggi(testo,ctx){
  ctx=ctx||'libero'; var t=String(testo||''), M=clMieiDati(), R={name:'',addr:'',tel:'',email:'',cf:'',pec:'',sdi:'',fonti:{},chk:{},escl:[]};
  function set(k,v,src){ if(v&&!R[k]){ R[k]=v; R.fonti[k]=src; } }
  if(/BEGIN:VCARD/i.test(t)){
    var v=clVcard(t), cells=(v.tel||[]).filter(function(x){ return !x.fax; });
    set('name',clTitolo(v.name||v.n||v.org||''),'contatto'); set('addr',v.addr?clTitolo(v.addr).replace(/\(([a-z]{2})\)/i,function(m,p){ return '('+p.toUpperCase()+')'; }):'','contatto');
    var c1=cells.filter(function(x){ return x.cell; })[0]||cells[0]; if(c1) set('tel',c1.t.replace(/[\s.\-]+/g,' '),'contatto'); set('email',v.email,'contatto');
    var kc=clCodici(v.note||''); if(kc.cf[0]) set('cf',kc.cf[0],'contatto'); else if(kc.piva[0]) set('cf','P.IVA '+kc.piva[0],'contatto');
    return clFine(R);
  }
  var B=clBlocchi(t), miei=[], forn=[], usa=[];
  B=B.map(function(b){ var r=b.split('\n').map(function(x){ return x.length>70&&clMio(x,M)?clTogliMiei(x,M):x; }), p0=r[0]+' '+(r[1]||''); b=r.join('\n');
    if(r.length<=7&&(clMio(r[0],M)&&r[0].length<=70||(/^\s*(spett|alla c|c\.a\.|egr|gent)/i.test(r[0])&&clMio(p0,M)))) return b;
    var k=r.filter(function(x){ return !clMio(x,M); }); if(k.length<r.length) miei.push(r.filter(function(x){ return clMio(x,M); }).join('\n')); return k.join('\n'); }).filter(function(b){ return b.trim(); });
  B.forEach(function(b,i){
    var mio=(b.split('\n').length<=7&&b.split('\n')[0].length<=70&&clMio(b.split('\n')[0],M))||(/^\s*(spett|alla c|c\.a\.|egr|gent)/i.test(b)&&clMio(b.split('\n').slice(0,2).join(' '),M)), lab=clHaLab(b), solo=(lab&&/^(spett|alla c|c\.a\.|egr|gent|sig)/i.test(lab[1]))?'saluto':(lab?'cliente':'');
    var fornitore=ctx==='fornitore'&&!solo&&(i<2||/\biban\b|\brea\b|cap\.?\s*soc|\bfax\b|www\.|registro imprese/i.test(b))&&!lab;
    if(mio){ miei.push(b); return; }
    if(fornitore){ forn.push(b); return; }
    if(ctx!=='fornitore'&&!lab&&/\b(fornitore|grossista|distributore|rivenditore)\b/i.test(b)){ forn.push(b); return; }
    if(ctx==='fornitore'&&!lab) return;
    if(ctx==='fornitore'){ b=clSoloEtichette(b,M); var l2=b&&clHaLab(b); solo=l2&&clSaluto(l2)?'saluto':''; lab=l2; }
    if(b) usa.push({b:b,lab:solo||(lab?'cliente':''),i:i});
  });
  // valori della ditta e del fornitore: mai nel cliente
  var no={tel:[],email:[],piva:[]};
  miei.concat(forn).forEach(function(b){ clTelefoni(b).forEach(function(x){ no.tel.push(x.d); }); clEmail(b).forEach(function(e){ no.email.push(lc(e)); }); var k=clCodici(b); no.piva=no.piva.concat(k.piva,k.cf); });
  M.tel.forEach(function(x){ no.tel.push(x); }); if(M.email) no.email.push(M.email); if(M.piva) no.piva.push(M.piva);
  if(miei.length) R.escl.push('dati della tua ditta'); if(forn.length) R.escl.push('dati del fornitore');
  usa.sort(function(a,b){ return (b.lab==='cliente'?2:b.lab?1:0)-(a.lab==='cliente'?2:a.lab?1:0)||a.i-b.i; });
  if(usa.some(function(u){ return u.lab==='cliente'; })) usa=usa.filter(function(u){ return u.lab; });
  var nomi=[];
  usa.forEach(function(u){
    var b=u.b, righe=b.split('\n'), conf=u.lab==='cliente'?'etichetta':u.lab==='saluto'?'intestazione':'testo';
    // nome con etichetta
    righe.forEach(function(r,ri){ var re=new RegExp(CL_LAB.source,'gi'), m;
      while((m=re.exec(r))){ var lab=m[1].toLowerCase(), after=r.slice(m.index+m[0].length); if(m[0].length===0){ re.lastIndex++; continue; } if(!clLabOk(m,after)) continue;
        if(/^rif/.test(lab)&&/^\s*(?:vs|ns|vostr|nostr|offerta|ordine|preventivo|n\.|nr|del)\b/i.test(after)) continue;
        var nm=clNomeDa(after); if(!nm&&!after.trim()&&righe[ri+1]) nm=clNomeDa(righe[ri+1]);
        if(/^(famiglia|condominio|fam\.)/i.test(lab)) nm=nm?clTitolo(lab.replace(/^fam\./,'famiglia').replace(/[:.\-\s]+$/,''))+' '+nm:'';
        var sal=/^(spett|alla c|c\.a\.|egr|gent|sig)/i.test(lab);
        if(nm&&!clMio(nm,M)) nomi.push({n:nm,c:sal?'intestazione':'etichetta',lab:m[1].replace(/[:.\-\s]+$/,'')}); }
    });
    var mt=b.match(/\b(?:[Aa]rch|[Ii]ng|[Gg]eom|[Dd]ott|[Dd]ott\.ssa|[Aa]vv|[Rr]ag|[Pp]\.\s?[Ii])\.[ \t]*((?:[A-ZÀ-Ý][a-zà-ÿ']+)(?:[ \t]+[A-ZÀ-Ý][a-zà-ÿ']+){1,2})/);
    if(mt&&ctx!=='fornitore'){ var nt=clNomeBuono(mt[1]); if(nt&&!clMio(nt,M)) nomi.push({n:nt,c:'titolo'}); }
    var mn=b.match(/\bnome\s*[:=]\s*([A-Za-zÀ-ÿ' ]{2,30}?)\s*(?:[\n,;]|$)/i), mc=b.match(/\bcognome\s*[:=]\s*([A-Za-zÀ-ÿ' ]{2,30}?)\s*(?:[\n,;]|$)/i);
    if(mn&&mc) nomi.unshift({n:clTitolo(mn[1]+' '+mc[1]),c:'etichetta',lab:'Nome e Cognome'});
    var ms=b.match(/\b(?:sono|mi chiamo|io sono|qui (?:è|e')|da parte di|vi scrive|scrive)[ \t]+(?:il[ \t]+|la[ \t]+)?((?:[A-ZÀ-Ý][a-zà-ÿ']+)(?:[ \t]+(?:[A-ZÀ-Ý][a-zà-ÿ']+|de|di|del|della|d'))+)/);
    if(ms){ var n1=clNomeBuono(ms[1]); if(n1) nomi.push({n:n1,c:'presentazione'}); }
    if(ctx!=='fornitore'){
      var mp=b.match(/\bper[ \t]+(?:il[ \t]+|la[ \t]+)?(?:sig(?:\.|nor)?(?:ra|a)?\.?[ \t]+|dott(?:\.|or)?(?:ssa)?\.?[ \t]+|famiglia[ \t]+|ditta[ \t]+|cliente[ \t]+)?((?:[A-ZÀ-Ý][\wà-ÿ']+)(?:[ \t]+(?:[A-ZÀ-Ý][\wà-ÿ']+|di|de|del|della|d'))*)/);
      if(mp&&!AS_SERIE.some(function(s){ return s[0].test(mp[1].toLowerCase()); })){ var n2=clNomeBuono(mp[1]); if(n2&&!AS_MARCHE.some(function(x){ return lc(x)===lc(n2.split(' ')[0]); })) nomi.push({n:n2,c:'testo'}); }
      // contatto incollato: prima riga corta senza numeri, seguita da indirizzo o telefono
      var r0=righe[0]&&righe[0].trim(); if(righe.length>=2&&r0&&!/\d/.test(r0)&&r0.split(/\s+/).length>=2&&r0.split(/\s+/).length<=5&&/^[A-ZÀ-Ý]/.test(r0)&&(clIndirizzo(righe.slice(1).join('\n'))||clTelefoni(righe.slice(1).join('\n')).length)){ var n3=clNomeBuono(r0); if(n3) nomi.push({n:n3,c:'contatto'}); }
      // firma in fondo al messaggio
      var ult=righe[righe.length-1]&&righe[righe.length-1].trim(); if(righe.length>=2&&ult&&/^(?:[A-ZÀ-Ý][a-zà-ÿ']+\s){1,2}[A-ZÀ-Ý][a-zà-ÿ']+$/.test(ult)){ var n4=clNomeBuono(ult); if(n4) nomi.push({n:n4,c:'firma'}); }
    }
    var ind=clIndirizzo(b); if(ind) set('addr',ind.addr,conf);
    var tel=clTelefoni(b).filter(function(x){ return !x.fax&&no.tel.indexOf(x.d)<0; }).sort(function(a,b){ return (b.cell?2:0)+(b.lab?1:0)-((a.cell?2:0)+(a.lab?1:0)); });
    if(tel[0]) set('tel',tel[0].t,conf);
    var em=clEmail(b).filter(function(e){ return no.email.indexOf(lc(e))<0; }), pec=em.filter(function(e){ return /pec|legalmail|postacert|arubapec|cert\./i.test(e); });
    var nor=em.filter(function(e){ return pec.indexOf(e)<0; }); if(nor[0]) set('email',nor[0],conf); if(pec[0]) set('pec',pec[0],conf);
    var k=clCodici(b); var cf=k.cf.filter(function(x){ return no.piva.indexOf(x)<0; }), pi=k.piva.filter(function(x){ return no.piva.indexOf(x)<0; });
    if(cf[0]) set('cf',cf[0],conf); else if(pi[0]) set('cf','P.IVA '+pi[0],conf);
    if(k.sdi) set('sdi',k.sdi,conf);
  });
  if(ctx!=='fornitore'){
    var mC=t.match(/(?:^|[^a-z])cognome(?!\s+e\s+nome)(?:\s*\/\s*surname)?[ \t]*[:.]?[ \t]*(?:\n[ \t]*)?([A-Za-zÀ-ÿ'][A-Za-zÀ-ÿ' ]{1,30}?)[ \t]*(?=\n|$|\s+nome\b)/i),
        mN=t.match(/(?:^|[^a-z])nome(?!\s+e\s+cognome)(?:\s*\/\s*(?:given\s+)?names?)?[ \t]*[:.]?[ \t]*(?:\n[ \t]*)?([A-Za-zÀ-ÿ'][A-Za-zÀ-ÿ' ]{1,30}?)[ \t]*(?=\n|$)/i);
    if(mC&&mN){ var nd=clNomeBuono(clTitolo(mN[1].trim())+' '+clTitolo(mC[1].trim())); if(nd&&!clMio(nd,M)) nomi.unshift({n:nd,c:'documento'}); }
    var mr=t.match(/(?:indirizzo\s+di\s+residenza|residenza|residente\s+(?:in|a)|domicilio)(?:\s*\/\s*(?:residence|address))?[ \t]*[:.]?[ \t]*(?:\n[ \t]*)?([^\n]{4,80}(?:\n[^\n]{2,40})?)/i);
    if(mr&&!R.addr){ var ir=clIndirizzo(' '+mr[1]); if(ir) set('addr',ir.addr,'documento'); else if(!/\d{3}/.test(mr[1].split('\n')[0])) set('addr',clTitolo(mr[1].split('\n')[0].trim()),'documento'); }
    if(!R.cf){ var kc=clCodici(t); if(kc.cf[0]&&no.piva.indexOf(kc.cf[0])<0) set('cf',kc.cf[0],'documento'); }
  }
  // il nome giusto: quello confermato dal codice fiscale, poi quello con etichetta
  var cfv=/^[A-Z]{6}/.test(R.cf)?R.cf:'', best=null;
  if(cfv) nomi.forEach(function(x){ if(!best&&clCfNome(x.n,cfv)) best=x; });
  if(!best){ var pr={documento:7,etichetta:6,titolo:5,contatto:4,presentazione:4,intestazione:3,firma:2,testo:1}; nomi.slice().sort(function(a,b){ return (pr[b.c]||0)-(pr[a.c]||0); }).forEach(function(x){ if(!best) best=x; }); }
  if(best){ R.name=best.n; R.fonti.name=best.lab?'«'+best.lab+'»':best.c; }
  return clFine(R);
}
function clFine(R){
  if(/^[A-Z]{6}\d/.test(R.cf)){ R.chk.cf=clCfOk(R.cf); if(R.name) R.chk.nomeCf=!!clCfNome(R.name,R.cf); }
  else if(/P\.IVA/.test(R.cf)) R.chk.piva=clPivaOk(R.cf);
  if(R.sdi) R.cf=(R.cf?R.cf+' · ':'')+'SDI '+R.sdi;
  if(!R.email&&R.pec){ R.email=R.pec; R.fonti.email=R.fonti.pec; }
  // già in rubrica? completo i dati mancanti
  var d=clDig(R.tel), e=lc(R.email), n=lc(R.name), hit=null;
  (DB.clients||[]).forEach(function(c){ if(hit) return; if((n&&lc(c.name)===n)||(d.length>=8&&clDig(c.tel).slice(-9)===d.slice(-9))||(e&&lc(c.email)===e)) hit=c; });
  if(hit){ R.rubrica=hit.name; ['name','addr','tel','email','cf'].forEach(function(k){ if(!R[k]&&hit[k]){ R[k]=hit[k]; R.fonti[k]='rubrica'; } }); }
  R.n=['name','addr','tel','email','cf'].filter(function(k){ return R[k]; }).length;
  return R;
}

// ===================== 3. dal preventivo del fornitore alle voci =====================
var DOC_ABBR=[[/\bint\.?\s*magn(?:etot)?\.?(?=\s|$)/gi,'interruttore magnetotermico'],[/\bmagnetot\.(?=\s|$)/gi,'magnetotermico'],[/\bdiff\.(?=\s|$)/gi,'differenziale'],[/\bscat\.(?=\s|$)/gi,'scatola'],[/\bderiv\.(?=\s|$)/gi,'derivazione'],[/\bcorr\.(?=\s|$)/gi,'corrugato'],[/\bbip\.(?=\s|$)/gi,'bipasso'],[/\buniv\.(?=\s|$)/gi,'universale'],[/\bconf\.(?=\s*\d)/gi,'confezione da'],[/\bcont\.\s*magn\.(?=\s|$)/gi,'contatto magnetico'],[/\bril\.(?=\s|$)/gi,'rilevatore'],[/\balim\.(?=\s|$)/gi,'alimentatore'],[/\bc\/(?=\s)/gi,'con'],[/\bbco(?=\s|$)/gi,'bianco'],[/\bnr\.?\s?(?=\d)/gi,'']];
var DOC_SIGLE=/^(IP\d*|POE|LED|NVR|DVR|XVR|HDD|SSD|UPS|USB|LAN|WAN|RJ45|UTP|FTP|STP|LSZH|CPR|GSM|LTE|4G|5G|IR|AC|DC|AX|TV|SAT|LNB|KNX|PIR|RFID|GDPR|CEE|DIN|IEC|CEI|PVC|SPD|HDMI|VA|MPPT|BMS|PLC|HMI|WLAN|FE|HD|UHD|4K|8K|CCTV|IPC|PTZ|SD|NFC|BUS|WIFI|WI-FI|ABS|DALI|RGB|RGBW|CCT|UGR|CRI|AWG|PE|PVC|MCB|RCD|RCBO|ATS|SIM|APP|AI|LCD|TFT|IK\d*|ANPR|UNEL|CAT|TT|TN|SPA|SRL|EV|AC\/DC)$/;
function docPulisci(s,brands){
  s=String(s||'').replace(/\s+/g,' ').trim();
  DOC_ABBR.forEach(function(a){ s=s.replace(a[0],a[1]); });
  var U=function(re,f){ s=s.replace(re,function(m,pre,n,u){ return pre+n+' '+(typeof f==='function'?f(u):f); }); };
  U(/(^|[\s(x×X\/])(\d+(?:[.,]\d+)?)\s?(MMQ|MM2)\b/gi,'mm²'); U(/(^|[\s(x×X\/])(\d+(?:[.,]\d+)?)\s?(MT|ML|MTL)\b\.?/g,'m'); U(/(^|[\s(x×X\/])(\d+(?:[.,]\d+)?)\s?(MM|CM)\b/g,function(u){ return u.toLowerCase(); });
  U(/(^|[\s(x×X\/])(\d+(?:[.,]\d+)?)\s?(KWH)\b/gi,'kWh'); U(/(^|[\s(x×X\/])(\d+(?:[.,]\d+)?)\s?(KWP)\b/gi,'kWp'); U(/(^|[\s(x×X\/])(\d+(?:[.,]\d+)?)\s?(KW)\b/gi,'kW'); U(/(^|[\s(x×X\/])(\d+(?:[.,]\d+)?)\s?(WP)\b/gi,'Wp');
  U(/(^|[\s(x×X\/])(\d+(?:[.,]\d+)?)\s?(W)\b/g,'W'); U(/(^|[\s(x×X\/])(\d+(?:[.,]\d+)?)\s?(KA)\b/gi,'kA'); U(/(^|[\s(x×X\/])(\d+(?:[.,]\d+)?)\s?(MA)\b/g,'mA');
  U(/(^|[\s(x×X\/])(\d+(?:[.,]\d+)?)\s?(TB|GB|MP|VA|VAC|VDC|AH)\b/gi,function(u){ u=u.toUpperCase(); return u==='AH'?'Ah':u==='VAC'?'Vac':u==='VDC'?'Vdc':u; }); U(/(^|[\s(x×X\/])(\d+(?:[.,]\d+)?)(M)\b/g,'m');
  var up=(s.match(/[A-ZÀ-Ý]/g)||[]).length, lo=(s.match(/[a-zà-ÿ]/g)||[]).length;
  if(up>lo){
    s=s.split(' ').map(function(w,i,arr){
      if(!/[A-Z]/.test(w)||/[a-z]/.test(w)) return w;
      var core=w.replace(/[^A-Z0-9\-\/+]/g,'');
      if(/\d/.test(w)&&/[A-Z]/.test(w)) return w;
      if(DOC_SIGLE.test(core)||/[\-\/]/.test(core)&&core.split(/[\-\/]/).every(function(x){ return !x||DOC_SIGLE.test(x); })) return w;
      if(/^(MP|TB|GB|VA|AH|W|V|A|HZ|LM|MA|KVA)$/.test(core)&&/\d$/.test(arr[i-1]||'')) return w;
      if(/^[B-DF-HJ-NP-Z]$/.test(core)||/^[AEIO]$/.test(core)&&/^(tipo|classe|curva|cat)\.?$/i.test(arr[i-1]||'')) return w;
      return w.toLowerCase().replace(/([aeiou])'$/,function(m,v){ return {a:'à',e:'è',i:'ì',o:'ò',u:'ù'}[v]; });
    }).join(' ');
  }
  AS_SERIE.forEach(function(x){ if(x[2]&&x[2].length>2) s=s.replace(new RegExp('(^|[^A-Za-z])'+x[2].replace(/[.*+?^${}()|[\]\\]/g,'\\$&').replace(/\s+/g,'\\s?')+'(?![A-Za-z])','i'),function(m,a){ return a+x[2]; }); });
  (brands||[]).forEach(function(b){ s=s.replace(new RegExp('(^|[^A-Za-z0-9])'+b.replace(/[.*+?^${}()|[\]\\]/g,'\\$&').replace(/\s+/g,'\\s+')+'(?![A-Za-z0-9])','gi'),function(m,a){ return a+b; }); });
  s=s.replace(/\bPOE\b/g,'PoE').replace(/\bWI-?FI\b/gi,'Wi-Fi').replace(/\s+([,.;:])/g,'$1').replace(/\s+/g,' ').trim();
  return s.charAt(0).toUpperCase()+s.slice(1);
}
function docUm(u){ u=lc(u).replace(/\.$/,''); if(!u||/^(n|nr|pz|pezzi|pezzo|cad|cd|ca|num|un|unit|n°)$/.test(u)) return 'cad'; if(/^(m|mt|ml|mtl|metri|metro)$/.test(u)) return 'm'; if(/^(mq|m2)$/.test(u)) return 'mq'; if(/^(cf|conf|confezione|ct|crt|scatola|sc)$/.test(u)) return 'conf'; if(/^(h|ora|ore)$/.test(u)) return 'h'; if(/^(rt|rotolo|bobina|matassa|coll|collo)$/.test(u)) return u==='coll'||u==='collo'?'collo':'rotolo'; if(/^(set|kit)$/.test(u)) return u; if(/^(kg|lt|l)$/.test(u)) return u==='lt'?'l':u; return u; }
var DOC_SPESE=/^(spese|trasporto|porto|spedizione|imballo|imballaggio|contributo|contrib\.|diritti|bollo|incasso|commission|arrotondament|abbuono|acconto|cauzione|eco\s?contributo|raee)/i;
var DOC_TIPI={
  vid:/telecamer|\bbullet\b|\bdome\b|\bturret\b|\bnvr\b|\bdvr\b|\bxvr\b|videoregistrator|hard\s?disk|\bhdd\b|\bptz\b|varifocal|videosorveglian|\bcctv\b|acusense|colorvu|\bipc\b/,
  all:/centrale (?:d'?|di )?allarm|antifurto|antintrusion|volumetric|doppia tecnologia|contatt[oi] magnetic|\bsirena|rivelator|tastiera (?:di comando|allarme|lcd)|inseritor|comunicator|barriera (?:a )?infrarossi|\bpir\b|telecomando allarme|ajax|hub ?2/,
  vcit:/videocitofon|citofon|posto (?:esterno|interno)|\btarga\b|pulsantier|monitor (?:vivavoce|videocit|interno|7|10)|alimentatore (?:per )?(?:bus|2 fili|videocit)|elettroserratur|apriporta|\b2 fili\b/,
  aut:/motor[ei]? (?:per )?(?:cancell|scorrevol|battent|sezional|basculant)|motoriduttor|fotocellul|lampeggiant|radiocomand|trasmettitor|centrale (?:di comando|per (?:cancell|motor))|cremaglier|costa (?:di sicurezza|sensibil)|selettore a chiave|\bsbarra\b|automazion/,
  fv:/fotovoltaic|\bmodul[oi] (?:fv|fotov|solare|\d{3})|pannell[oi] (?:solar|fotov)|\binverter\b(?! (?:per )?motor| vettorial)|ottimizzator|accumulo|batteri[ae] (?:di accumulo|litio|lifepo|al litio)|luna2000|\bkwp\b|struttura (?:di supporto|zavorrat|k2|per (?:\d+ )?moduli)|\bmc4\b|cavo solare|h1z2z2|quadro di campo|\bstring|smart dongle|smart meter|\b\d{3} ?wp?\b.*modul/,
  wb:/wallbox|colonnin[ae]|ricarica (?:auto|veicol|ev)|\btype ?2\b|\btipo 2\b|ev charger|tipo b\b/,
  tv:/antenn|parabol|\blnb\b|multiswitch|centralin[oi] (?:tv|da palo|amplificat)|amplificator(?:e)? (?:tv|da palo|di linea)|derivator|partitor|presa tv|coassial|demiscelator|miscelator|digitale terrestre/,
  ind:/carpenteria|armadio (?:metallico|elettrico)|scatolat|contattor|inverter (?:per )?motor|inverter vettorial|\bplc\b|passerell|canal[ae] metallic|\bcee\b|blindo|rel[eè] termic|salvamotor|trasformator|rifasament|campana led|proiettore industrial|fg16|fg7|\b3p\+n\+t\b/,
  sw:/licenza|software|\bhmi\b|\bscada\b|\bknx\b|firmware|programmazione/,
  dom:/\bfrutt[oi]\b|\bplacca\b|\bplacche\b|supporto \d m|presa (?:bipasso|schuko|unel|universale|2p\+t|10\/16)|interruttore(?! scatolato| di manovra)|deviator|invertitor|pulsante|scatola (?:da incasso|503|504|506|rettangolare|tonda|di derivazione)|cassetta di derivazione|corrugat|\btubo\b|fs17|n07v|magnetotermic|differenzial|centralin[oi] (?:da incasso|\d+ moduli)|faretto|plafonier|lampad|termostat|cronotermostat|living now|livinglight|plana|arke|eikon|matix|axolute|chorus|\bsystem\b|unica|zenit/
};
function docN(t){ return ' '+String(t||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[’`]/g,"'").replace(/\b(\d+),(\d+)\b/g,'$1.$2').replace(/\s+/g,' ')+' '; }
function docToks(t,salta){ return docN(t).split(/[^a-z0-9']+/).filter(function(w){ return w&&w.length>=2&&AS_STOP.indexOf(' '+w+' ')<0&&!(salta&&salta.test(w)); }).map(asStem).filter(Boolean); }
function docTipoLavoro(righe){
  var sc={}, tot=0, mot={}; Object.keys(DOC_TIPI).forEach(function(k){ sc[k]=0; mot[k]=[]; });
  righe.forEach(function(r){ tot+=Math.max(0,num(r.q)*num(r.cost)); });
  righe.forEach(function(r){ var t=docN(r.d0+' '+r.d+' '+(r.br||'')), w=1+(tot?3*num(r.q)*num(r.cost)/tot:0), hit=0;
    Object.keys(DOC_TIPI).forEach(function(k){ if(DOC_TIPI[k].test(t)){ hit++; } });
    Object.keys(DOC_TIPI).forEach(function(k){ var mm=t.match(DOC_TIPI[k]); if(mm){ sc[k]+=w/hit; var pa=(mm[0]+(t.slice(mm.index+mm[0].length).match(/^[a-z0-9']*/)||[''])[0]).trim(); if(mot[k].indexOf(pa)<0&&mot[k].length<4) mot[k].push(pa); } });
    var mk=(r.br?asMarche(docN(r.br),r.br):[]).map(function(x){ return x.t; }).filter(Boolean)[0]; if(mk&&sc[mk]!=null) sc[mk]+=0.3; });
  var ord=Object.keys(sc).filter(function(k){ return sc[k]>0; }).sort(function(a,b){ return sc[b]-sc[a]; }), s=0; ord.forEach(function(k){ s+=sc[k]; });
  if(!ord.length) return {model:S.model==='app'?'dom':S.model,perc:0,mot:[],alt:[],certo:false};
  var m=ord[0]; return {model:m,perc:Math.round(sc[m]/s*100),mot:mot[m],alt:ord.slice(1,3),certo:sc[m]/s>=0.5};
}
var DOC_POSA=/\binstallaz|\bposa\b|\bmontaggio|cablaggio|collaudo|configuraz|programmaz|puntamento|messa in servizio|manodopera|pratiche|dichiarazione di conformit|regolazion|sintonizzazion|orientamento|collegamento e configurazione|fissaggio|formazione/i;
var DOC_POSAW=/^(installazion\w*|e|di|del|della|dei|delle|per|con|il|la|lo|le|posa|montaggio|cablaggio|collaudo|configurazion\w*|programmazion\w*|puntament\w*|messa|in|servizio|collegament\w*|regolazion\w*|fissaggio|formazion\w*|al|cliente|accesso|remoto|da|app|istruzioni|d'uso|uso|a|corpo|e\/o)$/i;
function docKwp(righe){ var w=0; righe.forEach(function(r){ var t=docN(r.d0+' '+r.d); if(!/modul|pannell/.test(t)) return; var m=t.match(/\b(\d{3})\s?wp?\b/); if(m) w+=+m[1]*num(r.q); }); return r2(w/1000); }
function docPosa(model,righe){
  var cat=(S.cat&&S.cat[model])||(MODELS[model]||{}).items||[], out=[], visti={};
  cat.forEach(function(it){
    var nm=String(it[0]||''), u=String(it[1]||''); if(!DOC_POSA.test(nm)||/^(piattaforma|ponteggio|smontaggio|smaltimento|trasferta|noleggio)/i.test(nm)||visti[nm]) return; visti[nm]=1;
    if(righe.some(function(r){ return lc(r.d)===lc(nm); })) return;
    var x={d:nm,u:u,p:num(it[2]),q:1,on:false,perche:''}, obj=docToks(nm,DOC_POSAW).filter(function(w){ return w.length>=3&&!/^\d/.test(w); });
    var ha=function(r){ var t=docToks(r.d0+' '+r.d); return obj.length&&t.indexOf(obj[0])>-1&&(obj.length<2||t.indexOf(obj[1])>-1); };
    if(/^kwp$/i.test(u)){ var kw=docKwp(righe); if(kw>0){ x.q=kw; x.on=true; x.perche='dai moduli: '+qfmt(kw)+' kWp'; } }
    else if(/^(cad|pt|nr|n)$/i.test(u)&&obj.length){ var q=0; righe.forEach(function(r){ if(r.on!==false&&docUm(r.u)!=='m'&&ha(r)) q+=num(r.q); }); if(q>0){ x.q=q; x.on=true; x.perche='per '+qfmt(q)+' '+(q===1?'pezzo':'pezzi')+' del fornitore'; } }
    else if(/^(m|ml)$/i.test(u)&&obj.length){ var mt=0, st=false; righe.forEach(function(r){ if(r.on===false||!ha(r)) return; if(docUm(r.u)==='m') mt+=num(r.q); else { var mm=docN(r.d0+' '+r.d).match(/\b(\d{2,4})\s?(?:m|mt|metri)\b/); if(mm){ mt+=+mm[1]*num(r.q); st=true; } } }); if(mt>0){ x.q=mt; x.on=true; x.perche=st?'stimato dalla matassa del fornitore':'dai metri del fornitore'; } }
    else if(/corpo/i.test(u)) x.perche='a corpo';
    if(/^h$/i.test(u)&&out.some(function(o){ return o.on; })) return;
    out.push(x);
  });
  return out.sort(function(a,b){ return (b.on?1:0)-(a.on?1:0); }).slice(0,7);
}
function docTotali(doc){
  var T={merce:null,imponibile:null,totale:null,tot:null,iva:null,spese:[]}, re=/\b(totale\s+(?:merce|articoli|netto|materiale|materiali|prodotti|righe)|totale\s+imponibile|tot\.?\s*imponibile|imponibile|totale\s+(?:documento|offerta|preventivo|generale|ivato|iva\s+inclusa|da\s+pagare|a\s+pagare)|netto\s+a\s+pagare|totale(?!\s+iva\b))\b[^0-9\n]{0,30}?((?:€\s*)?\d{1,3}(?:\.\d{3})*,\d{2}|\d+[.,]\d{2})(?!\d)/i;
  doc.righe.forEach(function(c){
    var t=c.map(function(x){ return x.s; }).join(' ');
    if(/a\s+riportare|riporto|da\s+riportare/i.test(t)) return;
    var m=t.match(re); if(m){ var v=pnum(m[2]); if(v){ var k=lc(m[1]); if(/merce|articoli|netto\b(?!\s+a)|materiale|prodotti|righe/.test(k)&&!/pagare/.test(k)) T.merce=T.merce==null?v.v:T.merce; else if(/imponibile/.test(k)) T.imponibile=v.v; else if(/documento|offerta|preventivo|generale|ivato|inclusa|pagare/.test(k)) T.totale=v.v; else T.tot=v.v; } }
    var mi=t.match(/\biva\s*(?:al\s*)?(\d{1,2})\s*%/i); if(mi&&T.iva==null) T.iva=+mi[1];
    var ms=t.match(/^\s*((?:spese(?:\s+di)?\s+(?:trasporto|spedizione|incasso|imballo|bancarie)|trasporto|contributo\s+(?:raee|ambientale|spese|trasporto)|imballo|eco\s?contributo)[^0-9\n]{0,25}?)((?:€\s*)?\d{1,3}(?:\.\d{3})*,\d{2}|\d+[.,]\d{2})\s*(?:€)?\s*$/i);
    if(ms){ var sv=pnum(ms[2]); if(sv&&sv.v>0) T.spese.push({d:clTitolo(ms[1].replace(/[:.\s]+$/,'')),v:sv.v}); }
  });
  return T;
}
function docControllo(righe,T,spese){
  var somma=0; righe.forEach(function(r){ if(r.vera) somma+=r.imp; }); somma=r2(somma);
  var sp=0; (spese||[]).forEach(function(x){ sp+=x.v; }); sp=r2(sp);
  var ok=function(a,b){ return b!=null&&Math.abs(a-b)<=0.06; }, iv=T.iva!=null?T.iva:22;
  if(ok(somma,T.merce)) return {ok:true,somma:somma,rif:T.merce,t:'il totale merce del fornitore'};
  if(ok(r2(somma+sp),T.imponibile)) return {ok:true,somma:somma,rif:T.imponibile,t:'l\'imponibile del fornitore'+(sp?' (spese comprese)':'')};
  if(ok(somma,T.imponibile)) return {ok:true,somma:somma,rif:T.imponibile,t:'l\'imponibile del fornitore'};
  if(ok(somma,T.tot)||ok(r2(somma+sp),T.tot)) return {ok:true,somma:somma,rif:T.tot,t:'il totale del fornitore'};
  var ivato=null; [T.totale,T.tot].forEach(function(x){ if(x!=null&&!ivato&&Math.abs(r2((somma+sp)*(1+iv/100))-x)<=0.15) ivato={ok:true,somma:somma,rif:x,t:'il totale IVA compresa del fornitore'}; });
  if(ivato) return ivato;
  var rif=T.merce!=null?T.merce:T.imponibile!=null?r2(T.imponibile-sp):T.tot!=null?T.tot:null;
  if(rif==null&&T.totale!=null) rif=r2(T.totale/(1+iv/100)-sp);
  return rif==null?{ok:null,somma:somma}:{ok:false,somma:somma,rif:rif,diff:r2(rif-somma)};
}
function docFornitore(doc){
  var t=doc.testo||'', M=clMieiDati(), nome='', num_='', data='';
  var L=t.split('\n').map(function(s){ return s.trim(); }).filter(Boolean).slice(0,30);
  L.some(function(s){ if(clMio(s,M)||CL_LAB.test(s)&&/^(spett|alla|c\.a|egr|gent)/i.test(s)) return false; var m=s.match(/([A-Z0-9À-Ý][\w&.'\- À-ÿ]{2,50}?\s(?:S\.?\s?r\.?\s?l\.?s?|S\.?\s?p\.?\s?A\.?|S\.?\s?n\.?\s?c\.?|S\.?\s?a\.?\s?s\.?|SRL|SPA|SNC|SAS))(?=$|[\s,.\-])/i); if(m){ nome=clTitolo(m[1]); return true; } return false; });
  if(!nome){ var em=clEmail(t).filter(function(e){ return !clMio(e,M); })[0]; if(em) nome=clTitolo(em.split('@')[1].split('.')[0]); }
  var mo=t.match(/\b(offerta|preventivo|proposta|conferma d'ordine|ordine|quotazione)\s*(?:n\.?|nr\.?|numero|n°|num\.?)?\s*[:.]?\s*([A-Z]{0,4}[\-\/]?\d[\w\/\-.]{0,18})?(?:\s*(?:del|data|in data)\s*[:.]?\s*(\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{2,4}))?/i);
  if(mo){ num_=mo[2]||''; data=mo[3]||''; }
  if(!data){ var md=t.match(/\bdata\s*[:.]?\s*(\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{2,4})/i); if(md) data=md[1]; }
  return {nome:nome,num:num_.replace(/[.\-]+$/,''),data:data,cosa:mo?clTitolo(mo[1]):''};
}
// righe del fornitore: tengo solo quelle che sono davvero articoli
function docVoci(doc){
  var P=parseLines(doc.tab||doc.righe), out=[], scarti=[], visti={}, T=docTotali(doc);
  P.righe.forEach(function(r,i){
    var d0=String(r.descrizione||'').trim(), code=String(r.codice||'').trim(), q=num(r.qta)||1, net=num(r.prezzo_netto), imp=r.importo!=null?num(r.importo):r2(q*net);
    if(code&&!/\d/.test(code)&&code.length<=4&&maTrova(code)){ d0=code+' '+d0; code=''; }
    var txt=(code+' '+d0).trim();
    if(DOC_SPESE.test(d0)){ T.spese.push({d:clTitolo(d0),v:r2(imp)}); return; }
    if(/\b(totale|subtotale|imponibile|riporto|a riportare|iva\s+\d{1,2}\s*%)\b/i.test(d0)) return;
    if(!/[A-Za-zÀ-ÿ]{3}/.test(d0)){ scarti.push({t:txt,perche:'senza descrizione leggibile'}); return; }
    if(new RegExp('^(?:'+CL_VIA+'|tel|fax|e-?mail|iban|p\\.?\\s?iva|c\\.f\\.|cap\\.? soc|rea|banca|pagamento|scadenza|consegna|resa|validit)\\b','i').test(d0)){ scarti.push({t:txt,perche:'dati del documento, non un articolo'}); return; }
    if(!(net>0)){ scarti.push({t:txt,perche:'senza prezzo'}); return; }
    if(!code&&/\b(preventivo|offerta|ordine|rif\.|riferimento|cliente|spett|tel\.?|cell\.?|c\.f\.|p\.?\s?iva|iban|del\s+\d{1,2}[\/.\-]\d{1,2})\b|\b\d{5}\s+[A-Z][a-z]/i.test(d0)){ scarti.push({t:txt,perche:'intestazione del documento, non un articolo'}); return; }
    if(q>=10000&&!/^(m|mt|ml|metri)$/i.test(String(r.um||''))){ scarti.push({t:txt,perche:'quantità non credibile ('+q+')'}); return; }
    var ver=r.importo!=null&&Math.abs(r2(q*net)-num(r.importo))<=Math.max(0.03,num(r.importo)*0.006), sc=0, warn=[];
    if(code) sc+=2; if(ver) sc+=2; if(r._hdr) sc+=1; if(r.um) sc+=1; if(d0.split(/\s+/).length>=2) sc+=1; if(/,\d{2}/.test(String(r.prezzo_netto))||net%1) sc+=0;
    if(r.dubbio){ sc-=3; warn.push('i prezzi della riga non tornano: controlla'); }
    if(r.importo!=null&&!ver&&!r.dubbio){ sc-=1; warn.push('importo diverso da quantità × prezzo'); }
    var key=lc(code+'|'+d0+'|'+q+'|'+net); if(visti[key]){ warn.push('riga uguale a un\'altra: forse ripetuta'); sc-=4; } visti[key]=1;
    var tk=d0.split(/\s+/), bm0=tk[0]&&maTrova(tk[0]);
    if((!code||code.length<=4)&&tk.length>2&&bm0&&isCodeTok(tk[1])&&tk[1].length>=5&&/\d/.test(tk[1])){ if(!r.marca) r.marca=bm0.n; code=tk[1]; d0=tk.slice(2).join(' '); }
    else if(!code&&tk.length>2&&tk[0].length<=3&&/^[A-Za-z0-9][\w\-.,\/+]{3,24}$/.test(tk[1])&&/\d/.test(tk[1])&&/[A-Za-z]/.test(tk[1])){ code=tk[1]; d0=tk.slice(2).join(' '); }
    else if(code&&code.length<=4&&tk.length>2&&isCodeTok(tk[0])&&tk[0].length>=5&&/\d/.test(tk[0])&&/[A-Za-z]/.test(tk[0])){ code=tk[0]; d0=tk.slice(1).join(' '); }
    txt=(code+' '+d0).trim();
    var mk=asMarche(docN(txt),txt), br=String(r.marca||'').trim(); if(br){ var bm=maTrova(br)||(asMarche(docN(br),br)[0]?{n:asMarche(docN(br),br)[0].b}:null); br=bm?bm.n:clTitolo(br); } if(!br&&mk[0]) br=mk[0].b;
    var brands=mk.map(function(x){ return x.b; }); if(br&&brands.indexOf(br)<0) brands.push(br);
    out.push({on:sc>=2,vera:true,d0:d0,d:docPulisci(d0,brands),code:code,br:br,u:docUm(r.um),q:q,cost:r2(net),list:num(r.prezzo_listino)||0,disc:r.sconto||'',imp:r2(imp),ver:ver,sc:sc,warn:warn,pg:r._pg||1,y0:r._y0,y1:r._y1,h:r._h||9,img:'',imgK:'',doc:doc});
  });
  return {righe:out,scarti:scarti,T:T,P:P};
}
// foto del documento accanto alla riga giusta (stessa pagina, stessa altezza)
function docAbbina(doc,righe){
  var L=righe.filter(function(r){ return r.doc===doc&&r.y0!=null; });
  doc.imgs.forEach(function(b){
    var best=null, bv=-1e9, bh=b.y1-b.y0;
    L.forEach(function(r){ if(r.pg!==b.pg) return; var top=r.y0+r.h, bot=r.y1-r.h*0.3, ov=Math.min(top,b.y1)-Math.max(bot,b.y0), d=ov>0?ov:-Math.min(Math.abs(b.y0-top),Math.abs(bot-b.y1));
      if(ov<=0&&-d>Math.max(6,bh*0.45)) return; if(d>bv){ bv=d; best=r; } });
    if(best&&(!best.box||bv>best.bv)){ best.box=b; best.bv=bv; }
  });
}
function docLibFoto(r){
  var c=lc(r.code), n=lc(r.d), hit='';
  if(c) DB.arts.concat(DB.prods||[],S.products||[]).forEach(function(x){ if(!hit&&lc(x.code)===c&&x.photos&&x.photos.length) hit=x.photos[0]; });
  if(!hit) (DB.prods||[]).forEach(function(x){ if(!hit&&lc(x.name)===n&&x.photos&&x.photos.length) hit=x.photos[0]; });
  return hit;
}
function docMk(){ try{ var v=localStorage.getItem('ieci-doc-mk'); if(v!=null&&v!=='') return num(v); }catch(e){} return num(AI.markup)||30; }
function docPrezzo(r,R){ var mk=num(R.prezzo.mk); if(R.prezzo.mode==='lis'&&r.list>0) return r2(r.list); if(R.prezzo.mode==='cos') return r2(r.cost); return r2(r.cost*(1+mk/100)); }

// ===================== 4. analisi completa di uno o più documenti =====================
function docPrezziOn(){ try{ return localStorage.getItem('ieci-doc-prezzi')!=='0'; }catch(e){ return true; } }
function docAnalizza(docs,opt){
  opt=opt||{};
  var R={soloCliente:!!opt.cliente,prezzi:docPrezziOn(),file:docs.map(function(d){ return d.nome; }),righe:[],scarti:[],spese:[],forn:null,ctrl:null,tipo:null,posa:[],cliente:null,titolo:'',prezzo:{mode:'ric',mk:docMk()},arch:true,note:[],ocr:docs.some(function(d){ return d.ocr; })};
  var clienti=[];
  docs.forEach(function(d){
    var V=(d.tipo==='vcf'||opt.cliente)?{righe:[],scarti:[],T:{spese:[]}}:docVoci(d);
    var fornit=V.righe.length>=1&&(V.righe.filter(function(r){ return r.on; }).length>=1);
    if(fornit){
      docAbbina(d,V.righe); R.righe=R.righe.concat(V.righe); R.scarti=R.scarti.concat(V.scarti); R.spese=R.spese.concat(V.T.spese);
      var f=docFornitore(d); if(!R.forn) R.forn=f;
      var c=docControllo(V.righe,V.T,V.T.spese);
      if(c.ok===false&&c.rif!=null){ var colpa=V.righe.filter(function(r){ return Math.abs(r2(c.somma-r.imp)-c.rif)<=0.06; });
        if(colpa.length===1){ colpa[0].on=false; colpa[0].vera=false; colpa[0].warn.unshift('esclusa: con questa riga il totale del fornitore non tornava'); c=docControllo(V.righe,V.T,V.T.spese); if(c.ok) c.esclusa=colpa[0].d0; } }
      c.doc=d.nome; R.ctrl=R.ctrl||c; if(R.ctrl!==c&&c.ok===false) R.ctrl=c;
      var cl=clLeggi(d.testo,'fornitore'); if(cl.n) clienti.push({c:cl,p:1,doc:d.nome});
    } else { var cl2=clLeggi(d.testo,d.tipo==='vcf'||d.tipo==='foto'||opt.cliente?'contatto':'libero'); if(cl2.n) clienti.push({c:cl2,p:2,doc:d.nome}); }
  });
  // cliente: prima i documenti del cliente (contatto, messaggio), poi i riferimenti nel preventivo del fornitore
  clienti.sort(function(a,b){ return b.p-a.p||b.c.n-a.c.n; });
  if(clienti.length){ var C=clienti[0].c; clienti.slice(1).forEach(function(x){ if(x.c.name&&C.name&&lc(x.c.name)!==lc(C.name)) R.note.push('Nel documento «'+x.doc+'» c\'è anche «'+x.c.name+'»: ho usato i dati di «'+C.name+'» ('+clienti[0].doc+'). Se il cliente è l\'altro, correggilo qui sotto.'); if(x.c.name&&C.name&&lc(x.c.name)!==lc(C.name)) return; ['name','addr','tel','email','cf'].forEach(function(k){ if(!C[k]&&x.c[k]){ C[k]=x.c[k]; C.fonti[k]=x.c.fonti[k]; } }); }); C.doc=clienti[0].doc; R.cliente=C; }
  if(R.righe.length){
    R.tipo=docTipoLavoro(R.righe);
    R.righe.forEach(function(r){ if(!r.box){ var lf=docLibFoto(r); if(lf){ r.img=lf; r.imgK='libreria'; } } });
    R.posa=docPosa(R.tipo.model,R.righe);
    R.titolo=(typeof TTL_T!=='undefined'&&TTL_T[R.tipo.model])||MODELS[R.tipo.model].name;
    var nl=R.righe.filter(function(r){ return r.list>r.cost; }).length; R.haListino=nl>=Math.max(1,R.righe.length*0.6);
  }
  return R;
}
// le foto si ritagliano dopo l'analisi (servono solo per le righe abbinate)
function docFoto2(R,cb){
  var jobs=R.righe.filter(function(r){ return r.box&&!r.img; }), k=0;
  (function nx(){ var r=jobs[k++]; if(!r){ cb(); return; }
    (r.box.url?Promise.resolve(r.box.url):docCrop(r.doc,r.box)).then(function(u){ if(u){ r.img=u; r.imgK='documento'; } nx(); },function(){ nx(); }); })();
}
// testo incollato che sembra un preventivo del fornitore (3 o più righe con quantità e prezzi)
function docSembraFornitore(t){
  if(String(t||'').split('\n').length<3) return false;
  try{ var V=docVoci(docTesto(t)); return V.righe.filter(function(r){ return r.on; }).length>=3; }catch(e){ return false; }
}

// ===================== 5. interfaccia nell'assistente =====================
function docSt(t,cls){ var el=$('as-doc-st'); if(!el) return; el.hidden=!t; el.className='as-doc-st'+(cls?' '+cls:''); el.textContent=t||''; }
function docApri(files,opt){
  opt=opt||{}; files=Array.prototype.slice.call(files||[]).filter(Boolean).slice(0,6); if(!files.length||DOCA.busy) return;
  DOCA.busy=true; AS.res=null; AS.doc=null; asRender(); var docs=[], errs=[], k=0;
  docSt(opt.cliente?'Leggo i dati del cliente '+(files.length===1?'dalla foto':'da '+files.length+' foto')+' qui sul dispositivo…':'Leggo '+(files.length===1?'«'+files[0].name+'»':files.length+' documenti')+' qui sul dispositivo…','run');
  (function nx(){
    var f=files[k++];
    if(!f){
      if(!docs.length){ DOCA.busy=false; docSt(errs.join(' · ')||'Non ho trovato niente da leggere.','err'); return; }
      try{ var R=docAnalizza(docs,opt); }catch(e){ DOCA.busy=false; docSt('Non riesco ad analizzare il documento: '+(e&&e.message||e),'err'); return; }
      R.err=errs; docSt(R.righe.some(function(r){ return r.box; })?'Ritaglio le foto dei prodotti dal documento…':'','run');
      docFoto2(R,function(){ DOCA.busy=false; AS.doc=R; AS.docPrima=null; docSt(''); asRender(); try{ $('as-out').scrollIntoView({behavior:'smooth',block:'start'}); }catch(e){} });
      return;
    }
    docLeggi(f,function(t){ docSt(t,'run'); }).then(function(d){ docs.push(d); nx(); },function(e){ errs.push(e&&e.message||String(e)); nx(); });
  })();
}
function docDiverso(a,b){ var n=function(x){ return docN(x).replace(/[^a-z0-9]/g,'').replace(/mmq|mm2/g,'mm'); }; return n(a)!==n(b)&&docToks(a).join(' ')!==docToks(b).join(' '); }
function docPz(r,R){ return !R.prezzi?0:(r.pman!=null?num(r.pman):docPrezzo(r,R)); }
function docTot(R){ var s=0; R.righe.forEach(function(r){ if(r.on) s+=num(r.q)*docPz(r,R); }); R.posa.forEach(function(x){ if(x.on) s+=num(x.q)*num(x.p); }); return r2(s); }
function docRender(){
  var R=AS.doc, box=$('as-out'); if(!R||!box) return;
  var on=R.righe.filter(function(r){ return r.on; }), tot=docTot(R), iva=num(S.meta.iva), C=R.cliente, f=R.forn, h='';
  var md=R.tipo?R.tipo.model:S.model, nm=MODELS[md]?(MODELS[md].short||MODELS[md].name):md;
  // 1. cosa ho letto
  h+='<div class="as-sum"><div><small>'+(R.righe.length?'Tipo di lavoro':'Documento')+'</small><b>'+(R.righe.length?esc(nm):esc(R.file.join(', ')))+'</b></div>'+(R.righe.length?'<div><small>Voci</small><b>'+on.length+'</b></div><div><small>Totale cliente</small><b>'+(R.prezzi?eur(tot*(1+iva/100)):'prezzi da inserire')+'</b></div>':'<div><small>Cliente</small><b>'+(C&&C.name?esc(C.name):'—')+'</b></div>')+'</div>';
  var lett=[]; if(f&&f.nome) lett.push('<b>'+esc(f.nome)+'</b>'); if(f&&(f.num||f.data)) lett.push(esc((f.cosa||'Offerta')+(f.num?' n. '+f.num:'')+(f.data?' del '+f.data:'')));
  if(R.righe.length) lett.push(R.righe.length+(R.righe.length===1?' riga articolo':' righe articolo')); var nf=R.righe.filter(function(r){ return r.img; }).length; if(nf) lett.push(nf+' foto');
  h+='<div class="as-doc-r"><span class="as-doc-i">📄</span><div>'+esc(R.file.join(' · '))+(lett.length?'<br><small>'+lett.join(' · ')+'</small>':'')+'</div></div>';
  // controllo del totale: la prova che non ho inventato né perso righe
  var c=R.ctrl; if(c){
    if(c.ok) h+='<div class="as-ok">✓ Ho ricontrollato: la somma delle righe ('+eur(c.somma)+') coincide con '+esc(c.t)+' ('+eur(c.rif)+'). Ho letto tutte le righe, nessuna inventata.'+(c.esclusa?' Ho escluso «'+esc(c.esclusa.slice(0,60))+'», che non è un articolo.':'')+'</div>';
    else if(c.ok===false) h+='<div class="as-warn">⚠ La somma delle righe lette ('+eur(c.somma)+') non coincide con il totale del fornitore ('+eur(c.rif)+'): mancano '+eur(Math.abs(c.diff))+(c.diff<0?' in più':'')+'. Forse una riga non è leggibile: confronta con il documento prima di inviare.</div>';
    else h+='<div class="as-note">Nel documento non trovo un totale da confrontare: controlla che le righe siano tutte.</div>';
  }
  (R.note||[]).forEach(function(x){ h+='<div class="as-note">'+esc(x)+'</div>'; });
  if(R.ocr) h+='<div class="as-note">Ho letto una foto o una scansione: controlla bene numeri e descrizioni.</div>';
  (R.err||[]).forEach(function(e){ h+='<div class="as-warn">'+esc(e)+'</div>'; });
  // 2. cliente
  if(!R.righe.length&&!(C&&C.n)) h+='<div class="as-warn">Non ho trovato dati del cliente '+(R.ocr?'nella foto: rifalla dritta, vicina e con buona luce (carta d\'identità, tessera sanitaria, biglietto da visita, schermata del messaggio).':'in questo documento.')+'</div>';
  if(C&&C.n){
    var lab={name:'Nome',addr:'Indirizzo cantiere',tel:'Telefono',email:'Email',cf:'C.F. / P.IVA'}, chips=[];
    if(C.chk.cf) chips.push('<span class="as-k">C.F. valido'+(C.chk.nomeCf?' e corrisponde al nome':'')+'</span>'); else if(C.chk.cf===false) chips.push('<span class="as-k m">C.F. non valido: controllalo</span>');
    if(C.chk.piva) chips.push('<span class="as-k">P.IVA valida</span>'); else if(C.chk.piva===false) chips.push('<span class="as-k m">P.IVA non valida</span>');
    if(C.rubrica) chips.push('<span class="as-k">già in rubrica</span>');
    if(C.escl.length) chips.push('<span class="as-k">non confusi con i '+esc(C.escl.join(' e i '))+'</span>');
    h+='<div class="as-dcli"><label class="chk"><input type="checkbox" id="as-dcli-on"'+(R.cliOff?'':' checked')+'><b>Dati del cliente</b></label>'+(chips.length?'<div class="as-chips">'+chips.join('')+'</div>':'')+
      '<div class="grid2">'+['name','addr','tel','email','cf'].map(function(k){ var FO={documento:'dal documento d\'identità',etichetta:'dal documento',testo:'dal testo',contatto:'dal contatto',presentazione:'si presenta così',rubrica:'dalla rubrica',titolo:'dal biglietto da visita',intestazione:'dall\'intestazione',firma:'dalla firma'}, fo=C.fonti[k]; return '<label class="f">'+lab[k]+(C[k]&&fo?' <small class="as-src">'+esc(/^«/.test(fo)?'da '+fo:(FO[fo]||fo))+'</small>':'')+'<textarea rows="1" class="t1" data-dcl="'+k+'">'+esc(C[k]||'')+'</textarea></label>'; }).join('')+'</div></div>';
  }
  if(R.righe.length){
    // 3. tipo, prezzi, titolo
    var opts=ORDER.filter(function(k){ return MODELS[k]&&k!=='app'&&k!=='rip'; }).map(function(k){ return '<option value="'+k+'"'+(k===md?' selected':'')+'>'+esc(MODELS[k].short||MODELS[k].name)+'</option>'; }).join('');
    h+='<div class="as-dset"><label class="f">Tipo di preventivo'+(R.tipo&&R.tipo.perc?' <small class="as-src">'+(R.tipo.certo?'sicuro':'probabile')+' · '+R.tipo.perc+'% del materiale'+(R.tipo.mot.length?': '+esc(R.tipo.mot.join(', ')):'')+'</small>':'')+'<select id="as-dmod">'+opts+'</select></label>'+
      '<label class="f">Titolo<textarea rows="1" class="t1" id="as-dtit">'+esc(R.titolo)+'</textarea></label>'+
      '<div class="as-dpz"><label class="chk"><input type="checkbox" id="as-dprezzi"'+(R.prezzi?' checked':'')+'><b>Porta nel preventivo i prezzi del documento</b></label>'+
      (R.prezzi?'<div class="f"><span>Prezzo al cliente</span><div class="as-seg" role="group"><button type="button" data-dpm="ric" aria-pressed="'+(R.prezzo.mode==='ric')+'">Costo + ricarico</button>'+(R.haListino?'<button type="button" data-dpm="lis" aria-pressed="'+(R.prezzo.mode==='lis')+'">Prezzo di listino</button>':'')+'<button type="button" data-dpm="cos" aria-pressed="'+(R.prezzo.mode==='cos')+'">Al costo</button></div></div>'+
      (R.prezzo.mode==='ric'?'<label class="f">Ricarico %<input type="number" id="as-dmk" min="0" step="any" inputmode="decimal" value="'+esc(R.prezzo.mk)+'"></label>':'')
      :'<p class="hint">Le voci entrano <b>senza prezzo</b>: lo scrivi tu nel preventivo. I costi del fornitore restano visibili qui sotto come riferimento.</p>')+'</div></div>';
    // 4. voci dal fornitore
    h+='<div class="as-righe'+(R.righe.some(function(r){ return r.img; })?'':' no-im')+'"><details class="as-gd" open><summary class="as-g"><span>Materiale dal fornitore</span><span>'+on.length+' di '+R.righe.length+(R.prezzi?' · '+eur(on.reduce(function(s,r){ return s+num(r.q)*docPz(r,R); },0)):'')+'</span></summary>'+
      R.righe.map(function(r,i){ var pv=docPrezzo(r,R);
        return '<div class="as-dr'+(r.on?'':' off')+'"><label class="as-dr-c"><input type="checkbox" data-drr="'+i+'"'+(r.on?' checked':'')+' aria-label="Includi"></label>'+
          (r.img?'<img class="as-dr-im" src="'+r.img+'" alt="" title="'+(r.imgK==='documento'?'foto dal documento del fornitore':'foto dalla tua libreria')+'">':'<span class="as-dr-im no" aria-hidden="true"></span>')+
          '<div class="as-dr-t"><textarea class="t1 as-dr-d" rows="1" data-drd="'+i+'" aria-label="Descrizione">'+esc(r.d)+'</textarea>'+
          '<small>'+(r.br?'<b>'+esc(r.br)+'</b> · ':'')+(r.code?esc(r.code)+' · ':'')+'costo '+eur(r.cost)+(r.list>r.cost?' (listino '+eur(r.list)+(r.disc?', sc. '+esc(r.disc)+'%':'')+')':'')+' · pag. '+r.pg+(r.ver?' · <span class="as-v">✓ importo verificato</span>':'')+'</small>'+
          (r.warn.length?'<small class="as-w">'+esc(r.warn.join(' · '))+'</small>':'')+(docDiverso(r.d,r.d0)?'<small class="as-o">dal fornitore: «'+esc(r.d0)+'»</small>':'')+'</div>'+
          '<div class="as-dr-n"><label><input type="number" min="0" step="any" inputmode="decimal" class="as-q" data-drq="'+i+'" value="'+r.q+'" aria-label="Quantità"> '+esc(r.u)+'</label>'+(R.prezzi?'<span>×</span><label>€ <input type="number" min="0" step="0.01" inputmode="decimal" class="as-pz" data-drp="'+i+'" value="'+(r.pman!=null?r.pman:pv)+'" aria-label="Prezzo unitario al cliente"></label><b>'+eur(num(r.q)*docPz(r,R))+'</b>':'<em class="as-np">senza prezzo</em>')+'</div></div>'; }).join('')+'</details>';
    // 5. posa dal mio listino
    if(R.posa.length) h+='<details class="as-gd" open><summary class="as-g"><span>Posa e lavori · dal tuo listino</span><span>'+R.posa.filter(function(x){ return x.on; }).length+' di '+R.posa.length+'</span></summary>'+R.posa.map(function(x,i){
      return '<label class="as-r'+(x.on?'':' off')+'"><input type="checkbox" data-dpo="'+i+'"'+(x.on?' checked':'')+'><span class="as-d">'+esc(x.d)+(x.perche?'<small class="as-why">'+esc(x.perche)+'</small>':'')+'</span><input type="number" min="0" step="any" class="as-q" data-dpq="'+i+'" value="'+x.q+'" aria-label="Quantità"><span class="as-u">'+esc(x.u)+'</span><span class="as-pr">'+eur(num(x.q)*num(x.p))+'</span></label>'; }).join('')+'</details>';
    h+='</div>';
    if(R.spese.length) h+='<div class="as-note">Spese del fornitore non messe nel preventivo: '+esc(R.spese.map(function(x){ return x.d+' '+eur(x.v); }).join(' · '))+'. Se vuoi farle pagare al cliente, aggiungile tu.</div>';
    if(R.scarti.length) h+='<details class="sv"><summary>Righe che ho scartato ('+R.scarti.length+')</summary>'+R.scarti.map(function(x){ return '<div class="hint">«'+esc(x.t.slice(0,90))+'» · '+esc(x.perche)+'</div>'; }).join('')+'</details>';
    if(f&&f.nome) h+='<label class="chk"><input type="checkbox" id="as-darc"'+(R.arch?' checked':'')+'>Salva gli articoli e i costi di «'+esc(f.nome)+'» in Fornitori (per lo storico dei prezzi)</label>';
  }
  var vuoto=!S.lines.length, solo=!R.righe.length;
  h+='<div class="row">'+(solo?'<button type="button" class="btn" id="as-dcli-go"'+(C&&C.n?'':' disabled')+'>Usa questi dati del cliente</button>':'<button type="button" class="btn" id="as-dok">'+(vuoto?'Crea il preventivo':'Nuovo preventivo con queste voci')+'</button>'+(vuoto?'':'<button type="button" class="btn ghost" id="as-dadd">Aggiungi alle voci attuali</button>'))+'<button type="button" class="btn ghost" id="as-dx">Annulla</button></div>'+
    '<p class="hint">'+(solo?'Ho letto i dati qui sul dispositivo, senza mandarli a nessuno. Controllali e correggili prima di usarli.':'Ho letto il documento qui sul dispositivo, senza mandarlo a nessuno. Ogni voce viene da una riga vera del fornitore: quelle con un avviso sono da controllare, quelle spente non le aggiungo.')+'</p>';
  box.innerHTML=h;
}
function docCliente(R){
  if(!R.cliente||R.cliOff) return 0; var n=0, C=R.cliente;
  ['name','addr','tel','email','cf'].forEach(function(k){ var v=String(C[k]||'').trim(); if(v&&S.client[k]!==v){ S.client[k]=v; n++; } });
  return n;
}
function docApplica(nuovo){
  var R=AS.doc; if(!R) return;
  var righe=R.righe.filter(function(r){ return r.on&&num(r.q)>0; }), posa=R.posa.filter(function(x){ return x.on&&num(x.q)>0; });
  if(!righe.length&&!posa.length){ toast('Nessuna voce selezionata'); return; }
  var model=R.tipo?R.tipo.model:S.model, prev=S.model;
  if(nuovo&&(S.lines.length||String(S.client.name||'').trim())){
    if(S.lines.length&&!confirm('Creo un nuovo preventivo con le '+(righe.length+posa.length)+' voci lette? Quello aperto resta salvato nell\'archivio.')) return;
    newQuote(); showPanel('prev'); var acc=$('acc-as'); if(acc) acc.open=true;
  }
  if(nuovo&&model!==S.model){ S.model=model; typeTitle(prev); condSwitch(prev); }
  var tit=$('as-dtit')?$('as-dtit').value.trim():R.titolo; if(nuovo&&tit) S.meta.title=tit;
  var nc=docCliente(R);
  var sup=R.forn&&R.forn.nome||'', foto=0, nuoveSchede=0, noFoto=0;
  righe.forEach(function(r){
    var l={d:String(r.d).trim(),u:r.u,q:num(r.q),p:docPz(r,R),s:0};
    if(r.br) l.br=r.br; if(!nuovo) brTag(l);
    if(S.model==='app'&&curKey()&&!nuovo) l.r=curKey();
    S.lines.push(l);
    var lk=linkLine(l,{force:true,name:l.d,brand:r.br||'',code:r.code||''});
    if(lk&&lk.p){ var p=lk.p; if(lk.created) nuoveSchede++; if(r.code&&!p.code) p.code=r.code; if(r.br&&!p.brand) p.brand=r.br;
      if(r.img&&(!p.photos||!p.photos.length)){ p.photos=[r.img]; p.po=['']; foto++; if(r.imgK==='documento'){ p.cr=p.cr||{}; p.cr[iwH(r.img)]='Foto: '+(sup||'documento del fornitore'); } }
      if(!p.photos||!p.photos.length) noFoto++; }
  });
  posa.forEach(function(x){ var l={d:x.d,u:x.u,q:num(x.q),p:num(x.p),s:0}; if(!nuovo) brTag(l); S.lines.push(l); });
  // articoli e costi nell'archivio Fornitori (storico prezzi)
  var na=0; if(R.arch&&sup){ var dt=today(); righe.forEach(function(r){ var a=findArt(sup,r.code,r.d0||r.d); if(!a){ a={id:uid(),sup:sup,code:r.code,name:r.d,brand:r.br||'',um:r.u,cost:0,markup:num(R.prezzo.mk),price:0,desc:'',specs:'',link:'',pdfurl:'',photos:[],hist:[],upd:0}; DB.arts.push(a); na++; } else if(num(a.cost)!==num(r.cost)) (a.hist=a.hist||[]).push({d:dt,c:a.cost});
    a.cost=r.cost; a.price=artPrice(a); if(r.img&&!(a.photos||[]).length) a.photos=[r.img]; a.sdate=dt; a.upd=Date.now(); }); DB.arts.sort(byName); dbSave(); try{ renderArts(); renderAq(); }catch(e){} }
  if(S.model==='vcit') vmSync();
  AS.doc=null; renderAll(); touch(); syncFields();
  var msg=righe.length+' voci dal fornitore'+(R.prezzi?'':' senza prezzo')+(posa.length?' e '+posa.length+' di posa':'')+(foto?' · '+foto+' foto':'')+(nc?' · dati del cliente':'');
  toast((nuovo?'Preventivo preparato: ':'Aggiunte: ')+msg);
  var box=$('as-out'); if(box) box.innerHTML='<div class="as-ok">✓ Fatto: '+esc(msg)+'.'+(na?' '+na+' articoli nuovi salvati in Fornitori.':'')+'</div>'+(noFoto&&iwMode()!=='off'?'<div class="row"><button type="button" class="btn ghost" id="as-dfoto">Cerca le foto mancanti ('+noFoto+')</button></div>':'');
  try{ var lb=$('lines'); if(lb) lb.scrollIntoView({behavior:'smooth',block:'start'}); }catch(e){}
}
function docSoloCliente(){
  var R=AS.doc; if(!R) return; var n=docCliente(R); AS.doc=null; syncFields(); try{ renderInvio(); }catch(e){} touch(); asRender();
  toast(n?'Dati del cliente inseriti: '+(S.client.name||''):'Dati del cliente già uguali');
}
(function(){
  var go=$('as-doc'); if(!go) return;
  go.addEventListener('change',function(e){ var fl=e.target.files; docApri(fl); e.target.value=''; });
  var cf_=$('as-cli-foto'); if(cf_) cf_.addEventListener('change',function(e){ var fl=e.target.files; docApri(fl,{cliente:true}); e.target.value=''; });
  var ta=$('as-txt'), zona=ta.closest('.accb')||ta;
  ['dragover','dragleave','drop'].forEach(function(ev){ zona.addEventListener(ev,function(e){ if(!e.dataTransfer||!Array.prototype.some.call(e.dataTransfer.types||[],function(t){ return t==='Files'; })) return; e.preventDefault(); zona.classList.toggle('as-over',ev==='dragover'); if(ev==='drop') docApri(e.dataTransfer.files); }); });
  ta.addEventListener('paste',function(e){ var fl=e.clipboardData&&e.clipboardData.files; if(fl&&fl.length){ e.preventDefault(); docApri(fl); } });
  var out=$('as-out');
  out.addEventListener('click',function(e){
    var R=AS.doc, t=e.target, b;
    if(t.id==='as-dfoto'){ iwFill(); return; }
    if(!R) return;
    if(t.id==='as-dok') return docApplica(true);
    if(t.id==='as-dadd') return docApplica(false);
    if(t.id==='as-dcli-go') return docSoloCliente();
    if(t.id==='as-dx'){ AS.doc=null; asRender(); return; }
    if((b=t.closest('[data-dpm]'))){ R.prezzo.mode=b.getAttribute('data-dpm'); R.righe.forEach(function(r){ r.pman=null; }); docRender(); }
  });
  out.addEventListener('change',function(e){
    var R=AS.doc; if(!R) return; var t=e.target, a;
    if((a=t.getAttribute('data-drr'))!=null){ R.righe[+a].on=t.checked; R.posa=docPosaAgg(R); docRender(); }
    else if((a=t.getAttribute('data-drq'))!=null){ R.righe[+a].q=Math.max(0,num(t.value)); docRender(); }
    else if((a=t.getAttribute('data-drp'))!=null){ R.righe[+a].pman=Math.max(0,num(t.value)); docRender(); }
    else if((a=t.getAttribute('data-drd'))!=null){ R.righe[+a].d=t.value; }
    else if((a=t.getAttribute('data-dpo'))!=null){ R.posa[+a].on=t.checked; docRender(); }
    else if((a=t.getAttribute('data-dpq'))!=null){ R.posa[+a].q=Math.max(0,num(t.value)); R.posa[+a].man=1; docRender(); }
    else if((a=t.getAttribute('data-dcl'))!=null){ R.cliente[a]=t.value.trim(); }
    else if(t.id==='as-dcli-on'){ R.cliOff=!t.checked; }
    else if(t.id==='as-darc'){ R.arch=t.checked; }
    else if(t.id==='as-dprezzi'){ R.prezzi=t.checked; try{ localStorage.setItem('ieci-doc-prezzi',t.checked?'1':'0'); }catch(x){} docRender(); }
    else if(t.id==='as-dtit'){ R.titolo=t.value; }
    else if(t.id==='as-dmk'){ R.prezzo.mk=Math.max(0,num(t.value)); try{ localStorage.setItem('ieci-doc-mk',String(R.prezzo.mk)); }catch(x){} R.righe.forEach(function(r){ r.pman=null; }); docRender(); }
    else if(t.id==='as-dmod'){ R.tipo.model=t.value; R.tipo.perc=0; R.posa=docPosa(t.value,R.righe); var nt=(TTL_T[t.value]||MODELS[t.value].name); if(!R.titolo||Object.keys(TTL_T).some(function(k){ return TTL_T[k]===R.titolo; })||R.titolo===TTL_G) R.titolo=nt; docRender(); }
  });
})();
function docPosaAgg(R){ var nuove=docPosa(R.tipo.model,R.righe); nuove.forEach(function(x){ var v=R.posa.filter(function(o){ return o.d===x.d; })[0]; if(v&&v.man){ x.q=v.q; x.on=v.on; } }); return nuove; }
// arrivato da «Condividi» di un'altra app (app installata): apro l'assistente con il documento
function docCondiviso(){
  if(!/[?&]condiviso=1/.test(location.search)||!('caches' in window)) return;
  try{ history.replaceState(null,'',location.pathname); }catch(e){}
  var tent=0;
  (function attendi(){
    if((!dbReady||document.documentElement.classList.contains('locked'))&&tent++<600){ setTimeout(attendi,200); return; }
    caches.open('ieci-condivisi').then(function(c){ return c.keys().then(function(ks){ return Promise.all(ks.map(function(k){ return c.match(k).then(function(r){ return r.blob().then(function(b){ return {k:k.url,b:b,n:decodeURIComponent(r.headers.get('x-nome')||''),t:r.headers.get('content-type')||''}; }); }); })); }).then(function(L){ caches.delete('ieci-condivisi'); return L; }); })
    .then(function(L){
      var files=[], testo='';
      L.forEach(function(x){ if(/\/condiviso\/testo$/.test(x.k)) return; files.push(new File([x.b],x.n||'documento',{type:x.t.split(';')[0]})); });
      L.forEach(function(x){ if(/\/condiviso\/testo$/.test(x.k)) files.length?0:files.push(new File([x.b],'Messaggio condiviso.txt',{type:'text/plain'})); });
      if(!files.length) return;
      showPanel('prev'); var acc=$('acc-as'); if(acc) acc.open=true;
      setTimeout(function(){ try{ acc.scrollIntoView({behavior:'smooth',block:'start'}); }catch(e){} docApri(files); },150);
      toast('Documento ricevuto: lo leggo qui, senza mandarlo a nessuno');
    }).catch(function(){});
  })();
}
setTimeout(docCondiviso,300);
(function(T){ if(!T) return; T.docLeggi=docLeggi; T.docAnalizza=docAnalizza; T.docApri=docApri; T.clLeggi=clLeggi; T.clCfOk=clCfOk; T.clPivaOk=clPivaOk; T.docPulisci=docPulisci; T.AS=function(){ return AS; }; })(window.IECI_T);
