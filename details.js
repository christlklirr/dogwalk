"use strict";

// Each row defines one switch, its visual style and its minimum zoom.
const detailLayers=[
  {id:"calm",group:"streetLayers",label:"Verkehrsberuhigte Abschnitte",zoom:16,on:true,color:"#336376"},
  {id:"trees",group:"streetLayers",label:"Baumstandorte",zoom:17,on:true,color:"#38764a",wfs:"BAUMKATOGD"},
  {id:"bags",group:"supplyLayers",label:"Gackerlsackerl-Spender",zoom:17,on:true,color:"#965200",wfs:"HUNDESACKERLOGD"},
  {id:"water",group:"supplyLayers",label:"Trinkbrunnen und Hundetränken",zoom:17,on:true,color:"#127aab",wfs:"TRINKBRUNNENOGD"},
  {id:"markets",group:"optionalLayers",label:"Märkte",zoom:14,color:"#a24c00"},
  {id:"churches",group:"optionalLayers",label:"Katholische Kirchen",zoom:14,color:"#705783"},
  {id:"police",group:"optionalLayers",label:"Polizei · 100 m je Straßenrichtung",zoom:15,color:"#1a81a1"}
];
async function loadDetails(spec,bounds,signal){
  const [w,s,e,n]=bounds;
  if(spec.wfs){
    const url=new URL("https://data.wien.gv.at/daten/geo");
    url.search=new URLSearchParams({service:"WFS",version:"1.0.0",request:"GetFeature",typeName:"ogdwien:"+spec.wfs,srsName:"EPSG:4326",outputFormat:"json",bbox:bounds.join(",")+",EPSG:4326"});
    const res=await fetch(url,{signal});
    if(!res.ok)throw Error("WFS "+res.status);
    const data=await res.json();
    if(!Array.isArray(data.features))throw Error("Keine Geodaten");
    return data.features.filter(f=>spec.id!=="water" || [2,4,5,10,14,17,18].includes(Number(f.properties.TYP_NUM)) || /trink|tränke/i.test(f.properties.TYP_TXT||""))
      .map(f=>({...f,properties:{label:f.properties.GATTUNG_ART||f.properties.ADRESSE||spec.label,
        note:spec.id==="water"?([2,5,17,18].includes(Number(f.properties.TYP_NUM))?"Mit Hundetränke":"Trinkwasser · eigene Schale mitnehmen"):spec.id==="trees"?"Kartierter Baumstandort. Zugänglichkeit der Baumscheibe vor Ort prüfen.":"Kartierter Spender · Füllstand unbekannt."}}));
  }
  const box=[s,w,n,e].join(",");
  const selectors={
    markets:'nwr["amenity"="marketplace"]',
    churches:'nwr["amenity"="place_of_worship"]["denomination"~"^(catholic|roman_catholic|greek_catholic)$",i]',
    police:'nwr["amenity"="police"]',
    calm:'(way["highway"~"^(pedestrian|living_street)$"]('+box+');way["zone:traffic"~"30|Begegnung",i]('+box+');way["maxspeed"="30"]["highway"]('+box+');)'
  };
  const selector=selectors[spec.id];
  const streets='way["highway"~"^(living_street|residential|unclassified|tertiary|secondary|primary|service)$"]["area"!="yes"]["tunnel"!="yes"]';
  const query=spec.id==="police"?'[out:json][timeout:15];'+selector+'('+box+')->.stations;.stations out center;'+streets+'(around.stations:220);out geom;':
    '[out:json][timeout:15];'+(spec.id==="calm"?selector+';out geom;':selector+'('+box+');out center;');
  const res=await fetch("https://overpass-api.de/api/interpreter",{method:"POST",body:new URLSearchParams({data:query}),signal});
  if(!res.ok)throw Error("OSM "+res.status);
  const data=await res.json();
  if(!Array.isArray(data.elements)||data.remark)throw Error("Unvollständige Antwort");
  const features=[];
  function feature(type,coordinates,label,note){
    features.push({type:"Feature",geometry:{type,coordinates},properties:{label,note}});
  }
  const roads=data.elements.filter(o=>o.type==="way" && o.tags?.highway && !["private","no"].includes(o.tags.access));
  for(const o of data.elements){
    const t=o.tags||{};
    if(spec.id==="calm"){
      if(o.geometry?.length>1){
        const category=t.highway==="pedestrian"?"Fußgängerbereich":t.highway==="living_street"?"Wohnstraße":/begegnung/i.test(t["zone:traffic"]||"")?"Begegnungszone":"Tempo 30";
        feature("LineString",o.geometry.map(p=>[p.lon,p.lat]),t.name||category,category+" · Verkehrsmerkmal, keine Lärmmessung.");
      }
      continue;
    }
    if(spec.id==="police" && t.amenity!=="police")continue;
    const pt=o.center||o;if(!Number.isFinite(pt.lat)||!Number.isFinite(pt.lon))continue;
    const label=t.name||spec.label;
    const lines=spec.id==="police"?policeCorridor({...pt,street:t["addr:street"]},roads):[];
    const note=spec.id==="police"?(lines.length?"Persönlicher Orientierungsbereich an der zugeordneten Straße, bis zu 100 m je Richtung. Einfahrten und Einsatzwege sind unbekannt.":"Stationspunkt · keine eindeutige Straßenlinie ableitbar."):
      spec.id==="churches"?"Katholischer Gottesdienststandort laut OSM. Läutezeiten und Hörbereich ungeprüft.":"Marktstandort. Öffnungszeiten und Hinweise zu Hunden vor Ort prüfen.";
    for(const line of lines)feature("LineString",line.map(([lat,lon])=>[lon,lat]),label,note);
    feature("Point",[pt.lon,pt.lat],label,note);
  }
  return features;
}

function setupDetails(map){
  const states=detailLayers.map(spec=>{
    const row=document.createElement("label"),input=document.createElement("input"),name=document.createElement("span"),status=document.createElement("small");
    input.type="checkbox";input.checked=Boolean(spec.on);name.textContent=spec.label;
    row.className="map-option";row.append(input,MapIcons.badge(spec.id,spec.color),name,status);document.getElementById(spec.group).append(row);
    const state={spec,input,status,group:null,key:null,controller:null};
    input.onchange=()=>refresh(state);
    return state;
  });
  async function refresh(state){
    const {spec,status,input}=state,b=map.getBounds().pad(.08);
    const coords=[b.getWest(),b.getSouth(),b.getEast(),b.getNorth()].map(v=>Number(v.toFixed(5)));
    const key=input.checked && map.getZoom()>=spec.zoom?coords.join(","):null;
    if(!key)status.textContent=input.checked?"Beim Hineinzoomen ab Stufe "+spec.zoom:"";
    if(key===state.key)return;
    state.controller?.abort();state.group?.remove();state.group=null;state.key=key;
    if(!key)return;
    const controller=new AbortController();state.controller=controller;
    const timer=setTimeout(()=>controller.abort(),18000);
    status.textContent="Wird geladen …";
    try{
      const data=await loadDetails(spec,coords,controller.signal);
      if(state.controller!==controller||state.key!==key)return;
      const style={color:spec.color,weight:spec.id==="police"?9:2,opacity:spec.id==="police"?.55:.9,dashArray:spec.id==="calm"?"4 4":undefined};
      state.group=L.geoJSON(data,{style,pointToLayer:(f,ll)=>MapIcons.marker(ll,spec.id==="water" && f.properties.note==="Mit Hundetränke"?"trough":spec.id,spec.color,f.properties.label),
        onEachFeature:(f,layer)=>{const box=document.createElement("div"),title=document.createElement("strong"),note=document.createElement("p");title.textContent=f.properties.label;note.textContent=f.properties.note;box.append(title,note);layer.bindPopup(box);}
      }).addTo(map);
      status.textContent=data.length?"":"Keine Einträge im geladenen Ausschnitt.";
    }catch{
      if(state.controller===controller && state.key===key){state.key=null;status.textContent="Daten fehlen · aus/ein zum Wiederholen";}
    }finally{clearTimeout(timer);}
  }
  let timer;
  map.on("moveend",()=>{clearTimeout(timer);timer=setTimeout(()=>states.forEach(refresh),250);});
  states.forEach(refresh);
}
