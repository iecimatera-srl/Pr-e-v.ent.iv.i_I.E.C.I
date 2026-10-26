/* ---------- colori ---------- */
function hex2rgb(h){ h=String(h||'#000000').replace('#',''); if(h.length===3) h=h.replace(/./g,'$&$&'); var n=parseInt(h,16); return [(n>>16)&255,(n>>8)&255,n&255]; }
function rgb2hex(c){ return '#'+c.map(function(v){ v=Math.max(0,Math.min(255,Math.round(v))); return (v<16?'0':'')+v.toString(16); }).join(''); }
function lum(h){ var c=hex2rgb(h); return (0.299*c[0]+0.587*c[1]+0.114*c[2])/255; }
function mix(a,b,t){ var x=hex2rgb(a),y=hex2rgb(b); return rgb2hex([x[0]+(y[0]-x[0])*t,x[1]+(y[1]-x[1])*t,x[2]+(y[2]-x[2])*t]); }
function hue(c){ var r=c[0]/255,g=c[1]/255,b=c[2]/255,mx=Math.max(r,g,b),mn=Math.min(r,g,b),d=mx-mn,h=0; if(!d) return 0;
  if(mx===r) h=((g-b)/d)%6; else if(mx===g) h=(b-r)/d+2; else h=(r-g)/d+4; h*=60; return h<0?h+360:h; }
function extractPalette(url,cb){
  var im=new Image();
  im.onload=function(){
    try{
      var w0=im.naturalWidth||300,h0=im.naturalHeight||300,s=64/Math.max(w0,h0),w=Math.max(1,Math.round(w0*s)),h=Math.max(1,Math.round(h0*s));
      var c=document.createElement('canvas'); c.width=w; c.height=h; var x=c.getContext('2d'); x.drawImage(im,0,0,w,h);
      var d=x.getImageData(0,0,w,h).data, B={}, N={}, i;
      for(i=0;i<d.length;i+=4){
        if(d[i+3]<140) continue;
        var r=d[i],g=d[i+1],b=d[i+2],mx=Math.max(r,g,b),mn=Math.min(r,g,b),sat=mx?(mx-mn)/mx:0,l=(0.299*r+0.587*g+0.114*b)/255;
        if(l>0.93) continue;
        var key=(r>>5)+'-'+(g>>5)+'-'+(b>>5);
        var tgt=(sat>=0.28&&l>0.1&&l<0.92)?B:N;
        var e=tgt[key]||(tgt[key]={n:0,r:0,g:0,b:0,s:0}); e.n++; e.r+=r; e.g+=g; e.b+=b; e.s+=sat;
      }
      var list=Object.keys(B).map(function(k){var e=B[k]; return {c:[e.r/e.n,e.g/e.n,e.b/e.n],w:e.n*(0.5+e.s/e.n)};}).sort(function(a,b){return b.w-a.w;});
      if(list.length){
        var c1=list[0].c, c2=null, k;
        for(k=1;k<list.length;k++){ var dh=Math.abs(hue(list[k].c)-hue(c1)); dh=Math.min(dh,360-dh); if(dh>35 && list[k].w>list[0].w*0.04){ c2=list[k].c; break; } }
        var h1=rgb2hex(c1), h2=c2?rgb2hex(c2):mix(h1,'#000000',.4);
        if(lum(h1)>0.8) h1=mix(h1,'#000000',.2);
        return cb([h1,h2]);
      }
      var nl=Object.keys(N).map(function(k){var e=N[k]; return {c:[e.r/e.n,e.g/e.n,e.b/e.n],w:e.n};}).sort(function(a,b){return b.w-a.w;});
      if(nl.length){ var n1=rgb2hex(nl[0].c); return cb([n1,mix(n1,'#8A949E',.55)]); }
    }catch(e){}
    cb(null);
  };
  im.onerror=function(){ cb(null); };
  im.src=url;
}
function readImage(file,max,keepAlpha,cb){
  var fr=new FileReader();
  fr.onerror=function(){ toast('File non leggibile'); cb(''); };
  fr.onload=function(){
    if(file.type==='image/svg+xml'||/\.svg$/i.test(file.name)){ cb(fr.result.indexOf('data:image/svg')===0?fr.result:fr.result.replace(/^data:[^;]*;/,'data:image/svg+xml;')); return; }
    var im=new Image();
    im.onload=function(){
      var sc=Math.min(1,max/Math.max(im.width,im.height)),c=document.createElement('canvas');
      c.width=Math.max(1,Math.round(im.width*sc)); c.height=Math.max(1,Math.round(im.height*sc));
      var x=c.getContext('2d'); if(!keepAlpha){ x.fillStyle='#fff'; x.fillRect(0,0,c.width,c.height); }
      x.drawImage(im,0,0,c.width,c.height);
      cb(c.toDataURL(keepAlpha?'image/png':'image/jpeg',0.8));
    };
    im.onerror=function(){ toast('Immagine non leggibile'); cb(''); };
    im.src=fr.result;
  };
  fr.readAsDataURL(file);
}

