"use strict";

// Work in metres around the viewport centre. A small spatial grid avoids
// comparing every sampled location with every path in the neighbourhood.
function nearbyFootpaths(rows, latitude, limit) {
  const east=111195*Math.cos(latitude*Math.PI/180), north=111195, cell=32;
  const grid=new Map(), ways=[];
  const gridKey=(x,y)=>Math.floor(x/cell)+","+Math.floor(y/cell);
  function distanceSquared(p,s){
    const t=Math.max(0,Math.min(1,((p.x-s.a.x)*s.dx+(p.y-s.a.y)*s.dy)/s.length2));
    return (p.x-s.a.x-t*s.dx)**2+(p.y-s.a.y-t*s.dy)**2;
  }
  for(const row of rows){
    const tags=row.tags||{};
    if(!["footway","path","pedestrian","steps"].includes(tags.highway)||tags.area==="yes"||
       row.geometry?.length<2 || !row.geometry?.every(p=>Number.isFinite(p?.lat)&&Number.isFinite(p?.lon)))continue;
    const points=row.geometry.map(p=>({x:p.lon*east,y:(p.lat-latitude)*north}));
    const segments=[];
    for(let i=1;i<points.length;i++){
      const a=points[i-1],b=points[i],dx=b.x-a.x,dy=b.y-a.y,length2=dx*dx+dy*dy;
      if(!length2)continue;
      const seg={id:row.id,a,b,dx,dy,length2,layer:tags.layer||"0"};
      segments.push(seg);
      const steps=Math.ceil(Math.sqrt(length2)/(cell/2));
      for(let j=0;j<=steps;j++){
        const k=gridKey(a.x+dx*j/steps,a.y+dy*j/steps);
        if(!grid.has(k))grid.set(k,new Set());
        grid.get(k).add(seg);
      }
    }
    ways.push({row,segments});
  }
  function hasNeighbour(p,s){
    // Include a half-cell margin for the sampled grid insertion above.
    const reach=limit+cell/2;
    for(let x=Math.floor((p.x-reach)/cell);x<=Math.floor((p.x+reach)/cell);x++){
      for(let y=Math.floor((p.y-reach)/cell);y<=Math.floor((p.y+reach)/cell);y++){
        for(const other of grid.get(x+","+y)||[]){
          if(other.id===s.id || other.layer!==s.layer)continue;
          // A way split into two at the same OSM node is not a second nearby path.
          if([s.a,s.b].some(v=>[other.a,other.b].some(w=>v.x===w.x && v.y===w.y)))continue;
          if(distanceSquared(p,other)<=limit*limit)return true;
        }
      }
    }
    return false;
  }
  const out=[];
  for(const {row,segments} of ways){
    const tags=row.tags,restricted=[tags.access,tags.foot,tags.dog].some(v=>["no","private","customers","residents"].includes(v));
    let coords=[];
    function flush(){
      if(coords.length>1)out.push({type:"Feature",geometry:{type:"LineString",coordinates:coords},properties:{
        label:tags.name||"Kartierter Fußweg",restricted,
        note:restricted?"Zugang laut OSM eingeschränkt.": "Kartierter Verlauf. Zugang mit Hund und Bodenbewuchs vor Ort prüfen."
      }});
      coords=[];
    }
    for(const s of segments){
      const parts=limit?Math.ceil(Math.sqrt(s.length2)/4):1;
      const at=t=>[(s.a.x+t*s.dx)/east,(s.a.y+t*s.dy)/north+latitude];
      for(let j=0;j<parts;j++){
        const mid=(j+.5)/parts;
        if(limit && !hasNeighbour({x:s.a.x+mid*s.dx,y:s.a.y+mid*s.dy},s)){flush();continue;}
        if(!coords.length)coords.push(at(j/parts));
        coords.push(at((j+1)/parts));
      }
    }
    flush();
  }
  return out;
}
if(typeof module!=="undefined")module.exports={nearbyFootpaths};
