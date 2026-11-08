"use strict";
window.DogData = (() => {
  const types={dogs:"HUNDEZONEFLOGD",parks:"OEFFGRUENFLOGD",housing:"GEMBAUTENFLOGD",bans:"HUNDEZONEOGD"};
  const names={dogs:"Hundezone",parks:"Grünfläche",housing:"Gemeindebau",bans:"Hundeverbot"};
  const samples={
    dogs:["Hausfeldstraße / Johann-Kutschera-Gasse",16.4935377,48.2336943,true],
    parks:["Dr.-Rudolf-Hatschek-Park",16.296444,48.143917,null]
  };
  const pending=new Map();
  async function banAreaType() {
    try {
      const response = await fetch("https://data.wien.gv.at/daten/geo?service=WFS&version=1.1.0&request=GetCapabilities",{signal:AbortSignal.timeout(8000)});
      if (!response.ok) return null;
      const catalog = new DOMParser().parseFromString(await response.text(),"application/xml");
      for (const item of catalog.getElementsByTagNameNS("*","FeatureType")) {
        const name = item.getElementsByTagNameNS("*","Name")[0]?.textContent || "";
        if (/hund.*verb.*fl.*ogd$/i.test(name)) return name;
      }
    } catch { /* The standort layer supplies display-only fallback points. */ }
    return null;
  }
  async function read(kind,bbox){
    const banAreas = kind==="bans" ? await banAreaType() : null;
    const url=new URL("https://data.wien.gv.at/daten/geo");
    url.search=new URLSearchParams({service:"WFS",request:"GetFeature",version:"1.0.0",typeName:banAreas || "ogdwien:"+types[kind],outputFormat:"json",srsName:"EPSG:4326"});
    if(bbox)url.searchParams.set("bbox",bbox.join(",")+",EPSG:4326");
    try{
      const res=await fetch(url,{signal:AbortSignal.timeout(15000)});
      if(!res.ok)throw Error("WFS "+res.status);
      const fc=await res.json();
      if(fc.type!=="FeatureCollection" || !Array.isArray(fc.features))throw Error("Keine Daten");
      const raw=fc.features.filter(f=>f.geometry);
      const features=raw.filter(f=>{
        const vals=Object.values(f.properties||{}).join(" ");
        return kind==="bans"?(banAreas || /hundeverbot/i.test(vals)):kind!=="dogs" || !/hundeverbot/i.test(vals);
      }).map(f=>{
        const p=f.properties||{}, fence=p.EINFRIEDUNG ?? p.EINGEZAEUNT ?? null;
        return {...f,properties:{...p,name:p.ANLAGE||p.ANL_NAME||p.BEZEICHNUNG||p.NAME||p.ADRESSE||names[kind],fenced:fence==null?null:/^(ja|1|eingezäunt)$/i.test(String(fence))?true:/^(nein|0|keine)$/i.test(String(fence))?false:null}};
      });
      if(!features.length && !(bbox && !fc.features.length))throw Error("Keine auswertbaren Objekte");
      const partial=Number(fc.totalFeatures ?? fc.numberMatched)>fc.features.length || kind==="bans"&&features.some(f=>!["Polygon","MultiPolygon"].includes(f.geometry.type));
      return {type:"FeatureCollection",features,partial,sourceLabel:partial?"Teildaten · nur zur Orientierung":"Stadt Wien · Live-Daten"};
    }catch(e){
      if(!samples[kind])throw e;
      const [name,lon,lat,fenced]=samples[kind];
      return {type:"FeatureCollection",partial:true,sourceLabel:"Lokaler Beispielpunkt · Auswahl",features:[{type:"Feature",properties:{name,fenced},geometry:{type:"Point",coordinates:[lon,lat]}}]};
    }
  }
  async function housingPilot() {
    const properties={name:"Wohnpark Alt-Erlaa", operator:"Gemeinnützige Wohnungsaktiengesellschaft Wohnpark Alt-Erlaa"};
    let geometry={type:"Point",coordinates:[16.31333,48.15211]};
    let sourceLabel="Alt-Erlaa · Standort, Umriss nicht geladen";
    try {
      const response=await fetch("https://api.openstreetmap.org/api/0.6/way/329356052/full.json",{signal:AbortSignal.timeout(7000)});
      if(!response.ok)throw Error("OSM");
      const {elements}=await response.json();
      const way=elements.find(e=>e.type==="way" && e.id===329356052);
      const nodes=new Map(elements.filter(e=>e.type==="node").map(e=>[e.id,[e.lon,e.lat]]));
      if(way?.tags?.landuse==="residential" && way.nodes.length>=4 && way.nodes[0]===way.nodes.at(-1)){
        const ring=way.nodes.map(id=>nodes.get(id));
        if(ring.every(p=>p && p.every(Number.isFinite))){
          geometry={type:"Polygon",coordinates:[ring]};
          sourceLabel="Alt-Erlaa · kartierter Anlagenumriss (OSM)";
        }
      }
    } catch { /* The sourced location remains available when OSM is offline. */ }
    return {type:"FeatureCollection",features:[{type:"Feature",properties,geometry}],sourceLabel};
  }
  // Quantised boxes let the map and nearby round trips share responses.
  function region(west,south,east,north) {
    return [Math.floor(west*20)/20,Math.floor(south*40)/40,
      Math.ceil(east*20)/20,Math.ceil(north*40)/40];
  }
  return {region,load(kind,bbox){
    if(kind==="residences")return housingPilot();
    if(kind==="passages")return Promise.resolve({
      type:"FeatureCollection",sourceLabel:"Pilot · dokumentierter Durchgang",
      features:[{type:"Feature",geometry:{type:"Point",coordinates:[16.355188,48.200047]},
        properties:{name:"Raimundhof · Eingang Mariahilfer Straße 45"}}]
    });
    if(!Object.hasOwn(types,kind))return Promise.reject(Error("Unbekannte Ebene"));
    const key=[kind,...(bbox||[])].join("/");
    if(!pending.has(key)){
      const request=read(kind,bbox).then(fc=>{
        setTimeout(()=>{if(pending.get(key)===request)pending.delete(key);},fc.partial?60000:600000);
        return fc;
      },e=>{pending.delete(key);throw e;});
      pending.set(key,request);
    }
    return pending.get(key);
  }};
})();
