"use strict";

// OSM supplies road geometry as points with lat/lon and shared node IDs.
// Distances are measured on a local metric plane at the station's latitude.
function policeCorridor(station, roads) {
  const east=111195*Math.cos(station.lat*Math.PI/180), north=111195;
  const delta=(a,b)=>[(b.lon-a.lon)*east,(b.lat-a.lat)*north];
  const length=v=>Math.hypot(...v);
  const dot=(a,b)=>a[0]*b[0]+a[1]*b[1];
  const mix=(a,b,t)=>({lat:a.lat+(b.lat-a.lat)*t,lon:a.lon+(b.lon-a.lon)*t});
  const edges=[], neighbors=new Map();
  function connect(id,edge){
    if(!neighbors.has(id))neighbors.set(id,[]);
    neighbors.get(id).push(edge);
  }
  for(const road of roads){
    if(!road.nodes || road.geometry?.length!==road.nodes.length)continue;
    for(let i=1;i<road.nodes.length;i++){
      const a=road.geometry[i-1],b=road.geometry[i];
      if(!a||!b||!length(delta(a,b)))continue;
      const edge={a,b,u:road.nodes[i-1],v:road.nodes[i],road};
      edges.push(edge);connect(edge.u,edge);connect(edge.v,edge);
    }
  }
  let best=null,distance=55;
  const street=station.street?.toLocaleLowerCase("de-AT");
  const pool=street?edges.filter(e=>e.road.tags?.name?.toLocaleLowerCase("de-AT")===street):edges;
  for(const edge of pool){
    const d=delta(edge.a,edge.b);
    const t=Math.min(1,Math.max(0,dot(delta(edge.a,station),d)/dot(d,d)));
    const p=mix(edge.a,edge.b,t), gap=length(delta(station,p));
    if(gap<distance){distance=gap;best={edge,p};}
  }
  if(!best)return [];
  function trace(forward){
    let edge=best.edge,p=best.p,remain=100;
    const line=[[p.lat,p.lon]],seen=new Set();
    while(edge && !seen.has(edge)){
      seen.add(edge);
      const dest=forward?edge.b:edge.a, id=forward?edge.v:edge.u;
      const heading=delta(forward?edge.a:edge.b,dest), leg=length(delta(p,dest));
      if(leg>=remain){p=mix(p,dest,remain/leg);line.push([p.lat,p.lon]);break;}
      if(leg>0)line.push([dest.lat,dest.lon]);
      remain-=leg;p=dest;
      const next=neighbors.get(id).filter(e=>!seen.has(e) &&
        (e.road.id===edge.road.id || (edge.road.tags?.name && e.road.tags?.name===edge.road.tags.name)));
      const same=next.filter(e=>e.road.id===edge.road.id);
      const candidates=same.length?same:next.filter(e=>{
        const direction=delta(p,e.u===id?e.b:e.a);
        return dot(direction,heading)>0.5*length(direction)*length(heading);
      });
      if(candidates.length!==1)break;
      edge=candidates[0];forward=edge.u===id;
    }
    return line;
  }
  return [trace(false),trace(true)].filter(line=>line.length>1);
}
if(typeof module!=="undefined")module.exports={policeCorridor};
