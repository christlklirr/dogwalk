"use strict";
const byId = id => document.getElementById(id);
let statusTimer;

function notify(message) {
  const box = byId("status");
  box.textContent = message;
  box.hidden = false;
  clearTimeout(statusTimer);
  statusTimer = setTimeout(() => box.hidden = true, 9000);
}
const dialog = byId("sources");
byId("info").onclick = () => dialog.showModal();
dialog.querySelector("button").onclick = () => dialog.close();
const layers = [
  {key:"dogs",label:"Hundezonen",hint:"Auslauf und Hundewiesen",icon:"🐾",ink:"#117347",pale:"#ddf6de",on:true},
  {key:"parks",label:"Öffentliche Grünflächen",hint:"Parks und Grünanlagen",icon:"♧",ink:"#46774e",pale:"#dfebd4",on:true},
  {key:"bans",label:"Hundeverbotszonen",hint:"Gemeldete Einschränkungen",icon:"⊘",ink:"#a44940",pale:"#f7dfd7",on:true},
  {key:"passages",label:"Öffentliche Durchgänge",hint:"Dokumentierte Standorte",icon:"↔",ink:"#165daf",pale:"#dbeafd",on:false},
  {key:"housing",label:"Gemeindebauten",hint:"Wohnanlagen und Standorte",icon:"⌂",ink:"#596683",pale:"#e3e7ef",on:false}
];
function symbol(config) {
  const el = document.createElement("span");
  el.className = "symbol"; el.textContent = config.icon; el.setAttribute("aria-hidden","true");
  el.style.setProperty("--ink",config.ink); el.style.setProperty("--pale",config.pale);
  return el;
}
function description(label, hint) {
  const el = document.createElement("span");
  const strong = document.createElement("strong"); strong.textContent = label;
  const sub = document.createElement("small"); sub.textContent = hint;
  el.append(strong,sub); return el;
}
// Place the paw on an interior span, also for concave zones or polygons with holes.
function pawPosition(shape) {
  const g=shape.feature.geometry;
  if(g.type==="Point")return L.latLng(g.coordinates[1],g.coordinates[0]);
  if(g.type==="MultiPoint")return L.latLng(g.coordinates[0][1],g.coordinates[0][0]);
  let best=null,width=0;
  for(const rings of g.type==="Polygon"?[g.coordinates]:g.type==="MultiPolygon"?g.coordinates:[]){
    let bottom=Infinity,top=-Infinity;
    for(const [,y] of rings[0]){bottom=Math.min(bottom,y);top=Math.max(top,y);}
    for(const fraction of [.5,.25,.75]){
      const y=bottom+(top-bottom)*fraction, hits=[];
      for(const ring of rings)for(let i=1;i<ring.length;i++){
        const [a,b]=[ring[i-1],ring[i]];
        if((a[1]>y)!==(b[1]>y))hits.push(a[0]+(y-a[1])*(b[0]-a[0])/(b[1]-a[1]));
      }
      hits.sort((a,b)=>a-b);
      for(let i=1;i<hits.length;i+=2)if(hits[i]-hits[i-1]>width){
        width=hits[i]-hits[i-1];best=L.latLng(y,(hits[i]+hits[i-1])/2);
      }
    }
  }
  return best;
}
async function start() {
  if (!window.L) {
    byId("gps").disabled = true;
    byId("map").textContent = "Die Kartenbibliothek konnte nicht geladen werden. Bitte Internetverbindung prüfen und die Seite neu laden.";
    return;
  }
  const map = L.map("map",{zoomControl:false,preferCanvas:true}).setView([48.1511,16.3163],15);
  map.createPane("dogZones").style.zIndex=450;
  L.control.zoom({position:"bottomright"}).addTo(map);
  L.control.scale({imperial:false,position:"bottomleft"}).addTo(map);
  map.attributionControl.setPrefix(false);
  map.attributionControl.addAttribution('Datenquelle: <a href="https://data.wien.gv.at/">Stadt Wien – data.wien.gv.at</a>');
  const tiles = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'}).addTo(map);
  let tileWarned = false;
  tiles.on("tileerror",()=>{if(!tileWarned){tileWarned=true;notify("Hintergrundkarte teilweise nicht verfügbar. Bitte Verbindung prüfen.");}});

  const pawIcon=L.divIcon({
    className:"dog-zone-paw",iconSize:[58,58],iconAnchor:[29,29],popupAnchor:[0,-25],
    html:'<img src="dog-zone-paw.png" width="54" height="54" alt="" draggable="false">'
  });
  let position;
  byId("gps").onclick = () => {
    if (!navigator.geolocation) return notify("GPS ist hier nicht verfügbar. Verschiebe die Karte mit dem Finger.");
    const btn = byId("gps"); btn.disabled=true; btn.textContent="Standort wird gesucht …";
    function reset(){btn.disabled=false;btn.textContent="◎   Mein Standort";}
    navigator.geolocation.getCurrentPosition(p=>{
      reset(); const ll=L.latLng(p.coords.latitude,p.coords.longitude);
      if(position)position.remove();
      position=L.circleMarker(ll,{radius:8,color:"#fff",weight:3,fillColor:"#285fb2",fillOpacity:1}).addTo(map).bindTooltip("Dein Standort");
      map.setView(ll,16);notify("Standort gefunden · GPS-Genauigkeit ca. "+Math.round(p.coords.accuracy)+" m");
    },()=>{reset();notify("Kein GPS-Standort verfügbar. Du kannst die Karte mit dem Finger verschieben.");},{enableHighAccuracy:true,timeout:15000,maximumAge:30000});
  };
  function drawPlaces() {
    const bounds=map.getBounds(), center=map.getCenter(), matches=[];
    for (const config of layers) {
      if(!config.on || !config.group)continue;
      config.group.eachLayer(shape=>{
        const ext=shape.getBounds?.();
        const ll=ext?ext.getCenter():shape.getLatLng();
        if(ext?bounds.intersects(ext):bounds.contains(ll))matches.push({config,shape,ll,dist:center.distanceTo(ll)});
      });
    }
    matches.sort((a,b)=>a.dist-b.dist);
    byId("total").textContent=String(matches.length);
    const list=byId("places");list.replaceChildren();
    if(!matches.length){const p=document.createElement("p");p.className="empty";p.textContent="Keine geladenen Orte im Ausschnitt. Verschiebe die Karte oder aktiviere eine Ebene.";list.append(p);
      const loaded = layers.filter(c => c.on && c.group && c.group.getLayers().length);
      if (loaded.length) {
        const show = document.createElement("button");
        show.className = "show-all"; show.textContent = "Geladene Orte auf der Karte zeigen";
        show.onclick = () => {
          const ext = L.latLngBounds([]);
          loaded.forEach(c => ext.extend(c.group.getBounds()));
          map.fitBounds(ext, {padding:[20,20],maxZoom:16});
          byId("map").scrollIntoView({block:"nearest"});
        };
        list.append(show);
      }
    }
    for(const {config,shape,ll,dist} of matches.slice(0,8)){
      const btn=document.createElement("button");btn.className="place";
      btn.append(symbol(config),description(shape.feature.properties.name || config.label,config.label+" · "+(dist/1000).toLocaleString("de-AT",{maximumFractionDigits:2})+" km zur Kartenmitte"));
      const arrow=document.createElement("span");arrow.className="arrow";arrow.textContent="↗";btn.append(arrow);
      btn.onclick=()=>{map.setView(ll,Math.max(map.getZoom(),16));shape.openPopup(ll);byId("map").scrollIntoView({block:"nearest"});};list.append(btn);
    }
  }
  function orderOverlays() {
    for (const key of ["passages","dogs","bans"]) {
      const layer=layers.find(item=>item.key===key);
      if(layer.on)layer.group?.bringToFront();
    }
  }
  async function update(config,small) {
    let bbox;
    if(["dogs","parks"].includes(config.key) && config.on){
      const b=map.getBounds();
      bbox=DogData.region(b.getWest(),b.getSouth(),b.getEast(),b.getNorth());
      const area=bbox.join(",");
      if(area!==config.area){
        config.area=area;config.request=undefined;config.busy=false;
        config.group?.remove();config.group=null;
      }
    }
    if(config.group){if(config.on)config.group.addTo(map);else config.group.remove();orderOverlays();drawPlaces();return;}
    if(!config.on||config.busy)return;
    const token=Symbol();config.request=token;config.busy=true;small.textContent="Daten werden geladen …";
    try{
      const data=await DogData.load(config.key,bbox);
      if(config.request!==token)return;
      const pane=config.key==="dogs"?"dogZones":"overlayPane";
      const style={pane, dashArray:config.key==="dogs"?"7 4":undefined,color:config.ink,weight:config.key==="dogs"?4:2,fillColor:config.key==="dogs"?"#c8f0c9":config.ink,fillOpacity:config.key==="dogs"?1:config.key==="bans"?.50:.28};
      config.group=L.geoJSON(data,{pane,style,pointToLayer:(f,ll)=>L.circleMarker(ll,{...style,radius:7,fillOpacity:.9}),onEachFeature:(f,s)=>{
        const details=document.createElement("div");details.append(description(f.properties.name||config.label,config.label));
        const p=document.createElement("p");p.textContent=({passages:"Freiwillig zugänglicher Durchgang zur Windmühlgasse. Standort am Eingang. Öffnungszeiten und Zutritt mit Hund vor Ort prüfen.",parks:"Hundezugang und Lösemöglichkeit separat prüfen.",housing:"Durchgang und Zugangsrechte ungeprüft.",bans:["Point","MultiPoint"].includes(f.geometry.type)?"Gemeldeter Verbotsstandort. Die genaue Ausdehnung ist unbekannt.":"Der rote Umriss zeigt die erfasste Verbotsfläche.",dogs:"Einfriedung: "+(f.properties.fenced===true?"ja":f.properties.fenced===false?"nein":"unbekannt")})[config.key];details.append(p);
        if(config.key==="passages"){
          const link=document.createElement("a");link.href="https://bezirksmuseen-wien.at/wp-content/uploads/2023/12/stiegen_text.pdf";link.textContent="Durchgang im Bezirksmuseum-Führer";details.append(link);
        }
        s.bindPopup(details);
      }});
      if(config.key==="dogs"){
        const paws=L.layerGroup();
        const placed=[];
        config.group.eachLayer(shape=>{
          const position=pawPosition(shape);
          if(!position)return;
          if(shape.feature.properties.osm && placed.some(p=>p.distanceTo(position)<30))return;
          placed.push(position);
          const name=shape.feature.properties.name || "Hundezone";
          const marker=L.marker(position,{icon:pawIcon,title:name,alt:"Hundezone: "+name});
          marker.bindPopup(shape.getPopup().getContent().cloneNode(true)).addTo(paws);
          marker.on("add",()=>marker.getElement()?.setAttribute("aria-label","Hundezone: "+name));
        });
        config.group.on("add",()=>paws.addTo(map));
        config.group.on("remove",()=>paws.remove());
      }
      small.textContent=data.sourceLabel||config.hint;
      if(config.on)config.group.addTo(map);
      orderOverlays();
    }catch{if(config.request!==token)return;if(config.retry){config.retry.hidden=false;small.textContent=config.key==="bans"?"Verbotsdaten nicht verfügbar":"Grünflächen nicht verfügbar";return;}small.textContent="Laden fehlgeschlagen · aus/ein für neuen Versuch";}
    finally{if(config.request===token){config.busy=false;drawPlaces();}}
  }
  for(const config of layers){
    const label=document.createElement("label");label.className="layer";
    const desc=description(config.label,config.hint);const check=document.createElement("input");check.type="checkbox";check.checked=config.on;check.setAttribute("aria-label",config.label);
    if(["bans","parks"].includes(config.key)){
      check.disabled=true;
      check.title="Immer aktiv";
      const retry=document.createElement("button");
      retry.type="button";retry.textContent="Erneut laden";retry.hidden=true;
      config.retry=retry;
      retry.onclick=()=>{retry.hidden=true;update(config,desc.lastChild);};
      label.append(symbol(config),desc,check,retry);
    }else label.append(symbol(config),desc,check);byId("layers").append(label);
    config.status=desc.lastChild;
    check.onchange=()=>{config.on=check.checked;update(config,desc.lastChild);};
    update(config,desc.lastChild);
  }
  map.on("moveend",()=>{
    for(const c of layers.filter(c=>["dogs","parks"].includes(c.key)&&c.on))update(c,c.status);
    drawPlaces();
  });drawPlaces();
  setupEnvironment(map);
  setupDetails(map);
}
start().catch(()=>notify("Die Karte konnte nicht vollständig gestartet werden. Bitte Seite neu laden."));
if("serviceWorker" in navigator)navigator.serviceWorker.register("./sw.js").catch(()=>{});
