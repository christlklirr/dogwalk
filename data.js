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
  function dogKind(p) {
    const fields=Object.entries(p).filter(([key])=>/^(typ|art|kategorie|bezeichnung|hundetyp|zonenart|hundezonentyp|hundezone_typ|nutzung)(_|$)/i.test(key) || /^typtext$/i.test(key));
    function category(value){
      const v=String(value).trim().toLowerCase();
      if(/^(hundeverbot|hundeverbots(zone|bereich|fläche)|hunde verboten)(?:$|[ (/-])/.test(v))return "bans";
      if(/^(hundezone|hundeauslauf(platz|zone|fläche)?|hundewiese|hundefreilauf(zone|fläche)?)(?:$|[ (/-])/.test(v))return "dogs";
      return null;
    }
    for(const [,value] of fields){const k=category(value);if(k)return k;}
    for(const value of Object.values(p)){const k=category(value);if(k)return k;}
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
        if(kind!=="dogs" && kind!=="bans")return true;
        const category=dogKind(f.properties||{});
        if(category)return category===kind;
        return Boolean(kind==="bans" && banAreas);
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
  async function localDogs(bbox) {
    const [west,south,east,north]=bbox;
    if(east-west>.25 || north-south>.16)return [];
    const query='[out:json][timeout:6];(node["leisure"="dog_park"]('+[south,west,north,east]+');way["leisure"="dog_park"]('+[south,west,north,east]+'););out geom;';
    try{
      const response=await fetch("https://overpass.private.coffee/api/interpreter",{method:"POST",body:new URLSearchParams({data:query}),signal:AbortSignal.timeout(7500)});
      if(!response.ok)return [];
      const data=await response.json();
      return (data.elements||[]).flatMap(e=>{
        if(e.tags?.leisure!=="dog_park" || e.tags.dog==="no")return [];
        let geometry;
        if(e.type==="node" && Number.isFinite(e.lon) && Number.isFinite(e.lat))geometry={type:"Point",coordinates:[e.lon,e.lat]};
        else if(e.type==="way" && e.nodes?.length>=4 && e.nodes[0]===e.nodes.at(-1) && e.geometry?.length===e.nodes.length && e.geometry.every(p=>Number.isFinite(p?.lon)&&Number.isFinite(p?.lat))){
          geometry={type:"Polygon",coordinates:[e.geometry.map(p=>[p.lon,p.lat])]};
        }
        if(!geometry)return [];
        return [{type:"Feature",geometry,properties:{name:e.tags.name||"Hundezone (OSM)",fenced:e.tags.fenced==="yes"?true:e.tags.fenced==="no"?false:null,osm:true}}];
      });
    }catch{return [];}
  }
  async function mapDogs(bbox){
    const [city,osm]=await Promise.all([read("dogs",bbox),localDogs(bbox)]);
    return {...city,features:[...city.features,...osm],sourceLabel:osm.length?"Wiener Daten und OSM-Hundezonen":city.sourceLabel};
  }
  // Quantised boxes let the map and nearby round trips share responses.
  function region(west,south,east,north) {
    return [Math.floor(west*20)/20,Math.floor(south*40)/40,
      Math.ceil(east*20)/20,Math.ceil(north*40)/40];
  }
  return {region,load(kind,bbox){
    if(kind==="passages")return Promise.resolve({
      type:"FeatureCollection",sourceLabel:"Pilot · dokumentierter Durchgang",
      features:[{type:"Feature",geometry:{type:"Point",coordinates:[16.355188,48.200047]},
        properties:{name:"Raimundhof · Eingang Mariahilfer Straße 45"}}]
    });
    if(!Object.hasOwn(types,kind))return Promise.reject(Error("Unbekannte Ebene"));
    const key=[kind,...(bbox||[])].join("/");
    if(!pending.has(key)){
      const request=(kind==="dogs" && bbox?mapDogs(bbox):read(kind,bbox)).then(fc=>{
        setTimeout(()=>{if(pending.get(key)===request)pending.delete(key);},fc.partial?60000:600000);
        return fc;
      },e=>{pending.delete(key);throw e;});
      pending.set(key,request);
    }
    return pending.get(key);
  }};
})();
