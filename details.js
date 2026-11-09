"use strict";

// Each row defines one switch, its visual style and its minimum zoom.
const detailLayers=[
  {id:"nearpaths",group:"streetLayers",label:"Fußwege in Cyan",zoom:16,color:"#007e9b"},
  {id:"greenways",group:"streetLayers",label:"Kartierte Wege im Grün",zoom:16,color:"#2467aa"},
  {id:"trees",group:"streetLayers",label:"Baumstandorte",zoom:15,on:true,color:"#1a81a1",wfs:"BAUMKATOGD"},
  {id:"bags",group:"supplyLayers",label:"Gackerlsackerl-Spender",zoom:17,on:true,color:"#1a81a1",wfs:"HUNDESACKERLOGD"},
  {id:"water",group:"supplyLayers",label:"Trinkbrunnen und Hundetränken",zoom:17,on:true,color:"#126c89",wfs:"TRINKBRUNNENOGD"},
  {id:"play",group:"soundLayers",label:"Spielplätze",zoom:15,on:true,color:"#78499b",wfs:"SPIELPLATZPUNKTOGD"},
  {id:"churches",group:"soundLayers",label:"Katholische Kirchen",zoom:14,color:"#76428b",wfs:"RELIGIONOGD",osm:'nwr["amenity"="place_of_worship"]["denomination"~"^(catholic|roman_catholic|greek_catholic)$",i]'},
  {id:"metro",group:"soundLayers",label:"U-Bahn-Stationen",zoom:14,color:"#67518a",wfs:"UBAHNHALTOGD",osm:'nwr["railway"="station"]["station"="subway"]'},
  {id:"markets",group:"optionalLayers",label:"Märkte",zoom:14,color:"#a24c00",wfs:"MARKTFLAECHEOGD",osm:'nwr["amenity"="marketplace"]'},
  {id:"police",group:"optionalLayers",label:"Polizei · bis 100 m je Straßenrichtung",zoom:15,color:"#1a81a1",wfs:"POLIZEIOGD",osm:'nwr["amenity"="police"]'}
];
function noteFor(id,p){
  const notes={trees:"Kartierter Baumstandort.",bags:"Kartierter Spender · Füllstand unbekannt.",churches:"Katholischer Standort. Läutezeiten und Hörbereich ungeprüft.",markets:"Marktstandort · Öffnungszeiten vor Ort prüfen.",police:"Stationsstandort. Straßenbereich nur bei zuordenbarem Straßenverlauf.",play:"Spielplatz · Geräusche und Nutzung können je nach Tageszeit wechseln.",metro:"U-Bahn-Station · kein Messwert für die aktuelle Personenfrequenz."};
  if(id==="water")return [2,5,17,18].includes(Number(p.TYP_NUM)) || /hund|tränke/i.test(p.TYP_TXT||"")?"Mit Hundetränke":"Trinkwasser · eigene Schale mitnehmen";
  return notes[id];
}
async function overpass(query,signal){
  const res=await fetch("https://overpass-api.de/api/interpreter",{method:"POST",body:new URLSearchParams({data:query}),signal});
  if(!res.ok)throw Error("OSM "+res.status);
  const data=await res.json();
  if(!Array.isArray(data.elements)||data.remark)throw Error("Unvollständige OSM-Antwort");
  return data.elements;
}
async function loadDetails(spec,bounds,signal){
  if(spec.wfs){
    try{
      const url=new URL("https://data.wien.gv.at/daten/geo");
      url.search=new URLSearchParams({service:"WFS",version:"1.0.0",request:"GetFeature",typeName:"ogdwien:"+spec.wfs,srsName:"EPSG:4326",outputFormat:"json",bbox:bounds.join(",")+",EPSG:4326"});
      const res=await fetch(url,{signal:AbortSignal.any([signal,AbortSignal.timeout(spec.osm?6500:15000)])});
      if(!res.ok)throw Error("Stadt Wien "+res.status);
      const data=await res.json();
      if(!Array.isArray(data.features))throw Error("Keine Geodaten");
      const features=data.features.filter(f=>{
        const p=f.properties||{};
        if(!f.geometry)return false;
        if(spec.id==="water")return [2,4,5,10,14,17,18].includes(Number(p.TYP_NUM)) || /trink|tränke/i.test(p.TYP_TXT||"");
        if(spec.id==="churches")return p.TYP==="Kirche/Kapelle" && /^(römisch|griechisch)-katholisch$/i.test(p.UNTERKATEGORIE||"");
        return true;
      }).map(f=>({...f,properties:{line:f.properties.LINFO,label:f.properties.HTXT||f.properties.ANL_NAME||f.properties.GATTUNG_ART||f.properties.NAME||f.properties.BEZEICHNUNG||f.properties.ADRESSE||spec.label,note:noteFor(spec.id,f.properties)+" · Stadt Wien",street:f.properties.STRASSE||f.properties.ADRESSE?.replace(/^\d+\.,\s*/, "").replace(/\s+\d.*$/, "")}}));
      if(spec.id==="metro"){
        const named=new Map();
        for(const f of features){
          const name=f.properties.label;
          if(!named.has(name))named.set(name,{f,lines:new Set()});
          if(f.properties.line)named.get(name).lines.add("U"+f.properties.line);
        }
        return [...named.values()].map(({f,lines})=>{
          f.properties.note=(lines.size>1?"Umstieg zwischen ":"Linie ")+[...lines].join(", ")+". Personenfrequenz unbekannt.";
          return f;
        });
      }
      if(spec.id!=="churches" || features.length || !data.features.length)return features;
    }catch(error){if(!spec.osm || signal.aborted)throw error;}
  }
  const [w,s,e,n]=bounds;
  if(spec.id==="nearpaths"){
    const padY=32/111195,padX=padY/Math.cos((s+n)*Math.PI/360);
    const box=[s-padY,w-padX,n+padY,e+padX].join(",");
    return overpass('[out:json][timeout:12];way["highway"~"^(footway|path|pedestrian|steps)$"]["area"!="yes"]('+box+');out geom;',signal);
  }
  if(spec.id==="greenways"){
    const box=[s,w,n,e].join(",");
    const query='[out:json][timeout:10];(way["leisure"="park"]('+box+');relation["leisure"="park"]('+box+');way["landuse"="grass"]('+box+'););map_to_area->.green;way(area.green)["highway"~"^(path|footway|pedestrian)$"]('+box+');out geom;';
    const rows=await overpass(query,signal);
    return rows.filter(r=>r.geometry?.length>1).map(r=>{
      const t=r.tags||{};
      const blocked=[t.foot,t.access,t.dog].some(v=>["no","private","customers","residents"].includes(v));
      const conditional=Object.keys(t).some(k=>k.endsWith(":conditional")) || t.opening_hours;
      const marked=!blocked&&!conditional&&["yes","designated"].includes(t.foot||t.access)&&["yes","leashed","designated"].includes(t.dog);
      const state=blocked?"restricted":marked?"documented":"unknown";
      const note=blocked?"Zugang eingeschränkt oder Hund ausgeschlossen (OSM).":marked?"Fuß- und Hundezutritt ausdrücklich in OSM angegeben. Beschilderung beachten.":"Kartierter Weg · Fuß- oder Hundezutritt ungeklärt.";
      return {type:"Feature",geometry:{type:"LineString",coordinates:r.geometry.map(p=>[p.lon,p.lat])},properties:{label:t.name||"Weg im Grün",note,state}};
    });
  }
  const rows=await overpass('[out:json][timeout:10];'+spec.osm+'('+[s,w,n,e]+');out center;',signal);
  return rows.flatMap(o=>{
    const pt=o.center||o,t=o.tags||{};
    if(!Number.isFinite(pt.lat)||!Number.isFinite(pt.lon))return [];
    return [{type:"Feature",geometry:{type:"Point",coordinates:[pt.lon,pt.lat]},properties:{label:t.name||spec.label,note:noteFor(spec.id,t)+" · OpenStreetMap",street:t["addr:street"]}}];
  });
}
async function addRoads(stations,group,bounds,signal){
  if(!stations.length)return;
  const [w,s,e,n]=bounds;
  const roadBox=[s-.002,w-.003,n+.002,e+.003];
  const roads=await overpass('[out:json][timeout:10];way["highway"~"^(living_street|residential|unclassified|tertiary|secondary|primary|service)$"]["area"!="yes"]["tunnel"!="yes"]('+roadBox+');out geom;',signal);
  for(const f of stations.filter(f=>f.geometry.type==="Point")){
    const [lon,lat]=f.geometry.coordinates;
    for(const line of policeCorridor({lat,lon,street:f.properties.street},roads.filter(r=>!["no","private"].includes(r.tags?.access)))){
      L.polyline(line,{color:"#1a81a1",weight:9,opacity:.5}).bindTooltip("Orientierungsbereich · bis zu 100 m je Richtung").addTo(group);
    }
  }
}

function setupDetails(map){
  const states=detailLayers.map(spec=>{
    const row=document.createElement("label"),input=document.createElement("input"),name=document.createElement("span"),status=document.createElement("small");
    input.type="checkbox";input.checked=Boolean(spec.on);name.textContent=spec.label;
    row.className="map-option";row.append(input,MapIcons.badge(spec.id,spec.color),name,status);document.getElementById(spec.group).append(row);
    const state={spec,input,status,group:null,key:null,controller:null};
    input.onchange=()=>refresh(state);
    if(spec.id==="nearpaths"){
      const label=document.createElement("label"),select=document.createElement("select");
      label.className="path-range";label.append("Wegabstand ",select);
      for(const [value,title] of [["0","Alle kartierten Fußwege"],["20","Bis ca. 20 m"],["30","Bis ca. 30 m"]]){
        const opt=document.createElement("option");opt.value=value;opt.textContent=title;select.append(opt);
      }
      select.value="30";state.range=select;
      select.onchange=()=>{input.checked=true;refresh(state);};
      document.getElementById(spec.group).append(label);
    }
    return state;
  });
  async function refresh(state){
    const {spec,status,input}=state,b=map.getBounds().pad(.08);
    const coords=[b.getWest(),b.getSouth(),b.getEast(),b.getNorth()].map(v=>Number(v.toFixed(5)));
    const areaKey=coords.join(",");
    const key=input.checked && map.getZoom()>=spec.zoom?areaKey+"|"+(state.range?.value||""):null;
    if(!key)status.textContent=input.checked?"Beim Hineinzoomen ab Stufe "+spec.zoom:"";
    if(key===state.key)return;
    state.controller?.abort();state.group?.remove();state.group=null;state.key=key;
    if(!key)return;
    const controller=new AbortController();state.controller=controller;
    const timer=setTimeout(()=>controller.abort(),18000);
    status.textContent="Wird geladen …";
    try{
      let data=spec.id==="nearpaths" && state.rawKey===areaKey?state.raw:await loadDetails(spec,coords,controller.signal);
      if(state.controller!==controller||state.key!==key)return;
      if(spec.id==="nearpaths"){
        state.rawKey=areaKey;state.raw=data;
        data=nearbyFootpaths(data,(coords[1]+coords[3])/2,Number(state.range.value));
      }
      const style={color:spec.color,weight:spec.id==="police"?9:2,opacity:spec.id==="police"?.55:.9,fillOpacity:.18};
      state.group=L.geoJSON(data,{style:f=>spec.id==="nearpaths"?{color:f.properties.restricted?"#697379":"#00bedd",weight:4,opacity:.95,dashArray:f.properties.restricted?"3 5":undefined}:spec.id==="greenways"?{color:f.properties.state==="restricted"?"#697379":"#2467aa",weight:4,dashArray:f.properties.state==="documented"?undefined:"4 5"}:style,pointToLayer:(f,ll)=>{
        if(spec.id==="trees")return L.circleMarker(ll,{radius:map.getZoom()<17?2.5:5,color:"#0f6477",weight:1,fillColor:spec.color,fillOpacity:.88});
        const key=spec.id==="water" && f.properties.note.startsWith("Mit Hundetränke")?"trough":spec.id;
        return MapIcons.marker(ll,key,spec.color,f.properties.label);
      },
        onEachFeature:(f,layer)=>{const box=document.createElement("div"),title=document.createElement("strong"),note=document.createElement("p");title.textContent=f.properties.label;note.textContent=f.properties.note;box.append(title,note);layer.bindPopup(box);}
      }).addTo(map);
      if(spec.id==="police" && data.length){
        const group=state.group;addRoads(data,group,coords,AbortSignal.any([controller.signal,AbortSignal.timeout(12000)])).catch(()=>{if(state.group===group)status.textContent="Stationen geladen · Straßenlinien nicht verfügbar.";});
      }
      status.textContent=data.length?"":"Keine Einträge im geladenen Ausschnitt.";
    }catch{
      if(state.controller===controller && state.key===key){state.key=null;status.textContent="Daten fehlen · aus/ein zum Wiederholen";}
    }finally{clearTimeout(timer);}
  }
  let timer;
  map.on("moveend",()=>{clearTimeout(timer);timer=setTimeout(()=>states.forEach(refresh),250);});
  states.forEach(refresh);
}
