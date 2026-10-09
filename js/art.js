// art.js: Art loading, terrain masks, colour tools
// (classic script: shares one global scope with the other files in js/, loaded in the order listed in game.html)
// ---------- art: two original AI-generated packs (see ASSETS.md); sprite rectangles live in atlas.js ----------
const FOR={terrain:"terrain.jpg",props:"props.png",npcs:"npcs.png",bugs:"bugs.png",effects:"effects.png",bg:"battle-background.jpg"},FI={};   // Syntax Forest (Region 2)
const MEA={map:"meadow-map.jpg",env:"environment.png",sys:"village-systems.png",pb:"player-byte.png",npc:"npcs.png",vil:"villager.png",bugA:"bugs-a.png",bugB:"bugs-b.png",fx:"effects.png",bg:"battle-background.jpg",hero:"../forest/npcs.png"},MI={};   // Meadow Mainframe (Region 1, Byte); hero = the hero and Nullo from the forest pack, used in both regions
let artReady=false;
// Region 1 art loads first so the game starts quickly; Region 2's art streams in behind it.
function loadArt(dir,files,into,then){
  let n=0;
  const keys=Object.keys(files),done=()=>{
    if(++n===keys.length)then()
  };
  keys.forEach(k=>{
    const i=new Image();
    i.onload=()=>{
      into[k]=i;
      done()
    };
    i.onerror=()=>{
      console.error("missing art: assets/"+dir+"/"+files[k]);
      done()
    };
    i.src="assets/"+dir+"/"+files[k]
  })
}
loadArt("meadow",MEA,MI,()=>{
  artReady=true;
  rebuild();
  loadArt("forest",FOR,FI,rebuild)
});
const CC={};
const TCELL=1254/8;
// one 64 px terrain texture cell (row r, column cc), cropped a few px inside so neighbours never bleed in; optionally rotated / mirrored
function tex(c,r,cc,X,Y,rot,flip,inset,sz,img){
  const i=inset==null?3:inset,x=cc*TCELL+i,y=r*TCELL+i,w=TCELL-2*i,S2=sz||64;
  c.save();
  c.translate(X+S2/2,Y+S2/2);
  if(rot)c.rotate(rot*Math.PI/2);
  if(flip)c.scale(-1,1);
  c.drawImage(img||FI.terrain,x,y,w,w,-S2/2,-S2/2,S2,S2);
  c.restore()
}
// ---- region shapes (paths, ponds) as a jagged pixel mask, so any width works and edges look hand-pixelled ----
function jaggedMask(isIn,w,h){
  const MK=document.createElement("canvas");
  MK.width=w*16;
  MK.height=h*16;
  const mc=MK.getContext("2d");
  const rr=(col,x,y,sw,sh)=>{
    if(col==="#000")mc.clearRect(x,y,sw,sh);
    else{
      mc.fillStyle="#fff";
      mc.fillRect(x,y,sw,sh)
    }
  };
  for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(isIn(x,y)){
    const X=x*16,Y=y*16,L=!isIn(x-1,y),Rt=!isIn(x+1,y),U=!isIn(x,y-1),D=!isIn(x,y+1);
    rr("#fff",X,Y,16,16);
    for(let i=0;i<16;i++){
      const j=n=>hash(x*16+i,y*16+i,n)<.3;
      if(U){
        rr(j(1)?"#000":"#fff",X+i,Y,1,1);
        if(j(11))rr("#000",X+i,Y+1,1,1)
      }
      if(D){
        rr(j(2)?"#000":"#fff",X+i,Y+15,1,1);
        if(j(12))rr("#000",X+i,Y+14,1,1)
      }
      if(L){
        rr(j(3)?"#000":"#fff",X,Y+i,1,1);
        if(j(13))rr("#000",X+1,Y+i,1,1)
      }
      if(Rt){
        rr(j(4)?"#000":"#fff",X+15,Y+i,1,1);
        if(j(14))rr("#000",X+14,Y+i,1,1)
      }
    }
    if(L&&U)rr("#000",X,Y,3,3);
    if(Rt&&U)rr("#000",X+13,Y,3,3);
    if(L&&D)rr("#000",X,Y+13,3,3);
    if(Rt&&D)rr("#000",X+13,Y+13,3,3);
    if(!L&&!U&&!isIn(x-1,y-1))rr("#000",X,Y,2,2);
    if(!Rt&&!U&&!isIn(x+1,y-1))rr("#000",X+14,Y,2,2);
    if(!L&&!D&&!isIn(x-1,y+1))rr("#000",X,Y+14,2,2);
    if(!Rt&&!D&&!isIn(x+1,y+1))rr("#000",X+14,Y+14,2,2)
  }
  const mk=document.createElement("canvas");
  mk.width=w*64;
  mk.height=h*64;
  const kc=mk.getContext("2d");
  kc.imageSmoothingEnabled=false;
  kc.drawImage(MK,0,0,w*64,h*64);
  MK.width=1;
  return mk
}
// a bushy rim around the masked shape: a soft outer fringe, then a solid dark inner edge
function rimAround(c,mk,outer,inner){
  const halo=document.createElement("canvas");
  halo.width=mk.width;
  halo.height=mk.height;
  const hc=halo.getContext("2d");
  hc.drawImage(mk,0,0);
  hc.globalCompositeOperation="source-in";
  hc.fillStyle=outer;
  hc.fillRect(0,0,halo.width,halo.height);
  const ring=(r0,r1,alpha)=>{
    c.globalAlpha=alpha;
    for(let r=r0;r<=r1;r+=3)for(let a=0;a<12;a++)c.drawImage(halo,Math.cos(a/12*6.283)*r,Math.sin(a/12*6.283)*r);
    c.globalAlpha=1
  };
  ring(9,12,.22);
  ring(5,8,.5);
  hc.fillStyle=inner;
  hc.fillRect(0,0,halo.width,halo.height);
  ring(2,5,1);
  halo.width=1
}
// paint through the mask: paint(ctx) draws on a scratch layer, only the masked part reaches c
function fillMasked(c,mk,paint){
  const l=document.createElement("canvas");
  l.width=mk.width;
  l.height=mk.height;
  const lc=l.getContext("2d");
  lc.imageSmoothingEnabled=true;
  lc.imageSmoothingQuality="high";
  paint(lc);
  lc.globalCompositeOperation="destination-in";
  lc.drawImage(mk,0,0);
  c.drawImage(l,0,0);
  l.width=1
}
// ---- colour work: recolour a sheet by HSL rules (slimes into species colours, the player into NPCs) ----
function rgb2hsl(r,g,b){
  r/=255;
  g/=255;
  b/=255;
  const mx=Math.max(r,g,b),mn=Math.min(r,g,b),l=(mx+mn)/2;
  let h=0,s=0;
  if(mx!=mn){
    const d=mx-mn;
    s=l>.5?d/(2-mx-mn):d/(mx+mn);
    h=mx==r?(g-b)/d+(g<b?6:0):mx==g?(b-r)/d+2:(r-g)/d+4;
    h*=60
  }
  return[h,s,l]
}
function hsl2rgb(h,s,l){
  h/=360;
  if(s==0){
    const v=Math.round(l*255);
    return[v,v,v]
  }
  const f=(p,q,t)=>{
    if(t<0)t+=1;
    if(t>1)t-=1;
    return t<1/6?p+(q-p)*6*t:t<1/2?q:t<2/3?p+(q-p)*(2/3-t)*6:p
  };
  const q=l<.5?l*(1+s):l+s-l*s,p=2*l-q;
  return[Math.round(f(p,q,h+1/3)*255),Math.round(f(p,q,h)*255),Math.round(f(p,q,h-1/3)*255)]
}
function recolor(key,src,fn){
  if(CC[key])return CC[key];
  if(!src)return null;
  const c=document.createElement("canvas");
  c.width=src.width;
  c.height=src.height;
  const x=c.getContext("2d");
  x.drawImage(src,0,0);
  try{
    const d=x.getImageData(0,0,c.width,c.height),a=d.data;
    for(let i=0;i<a.length;i+=4){
      if(!a[i+3])continue;
      const o=fn.apply(null,rgb2hsl(a[i],a[i+1],a[i+2]));
      if(o){
        const r=hsl2rgb(o[0],o[1],o[2]);
        a[i]=r[0];
        a[i+1]=r[1];
        a[i+2]=r[2]
      }
    }
    x.putImageData(d,0,0)
  }catch(e){
  }
  return CC[key]=c
}
