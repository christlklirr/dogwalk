"use strict";
const byId = id => document.getElementById(id);
let statusTimer;
let walk;
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
for (const [button, planning] of [["exploreTab",false],["planTab",true]]) {
  byId(button).onclick = () => {
    if (!planning) walk?.cancel();
    byId("explore").hidden = planning;
    byId("walk").hidden = !planning;
    byId("exploreTab").setAttribute("aria-pressed", String(!planning));
    byId("planTab").setAttribute("aria-pressed", String(planning));
  };
}
const layers = [
  {key:"dogs",label:"Hundezonen",hint:"Auslauf und Hundewiesen",icon:"🐾",ink:"#835620",pale:"#f4e5c5",on:true},
  {key:"residences",label:"Genossenschaften & gemeinnützige Wohnanlagen",hint:"Pilot Alt-Erlaa · Zugang abschnittsweise prüfen",icon:"⌂",ink:"#2362a0",pale:"#dbeafd",on:true},
  {key:"parks",label:"Öffentliche Grünflächen",hint:"Parks und Grünanlagen",icon:"♧",ink:"#46774e",pale:"#dfebd4",on:true},
  {key:"bans",label:"Hundeverbotszonen",hint:"Gemeldete Einschränkungen",icon:"⊘",ink:"#a44940",pale:"#f7dfd7",on:true},
  {key:"passages",label:"Öffentliche Durchgänge",hint:"Dokumentierte Standorte",icon:"↔",ink:"#165daf",pale:"#dbeafd",on:true},
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
async function start() {
  if (!window.L) {
    byId("gps").disabled = true;
    byId("map").textContent = "Die Kartenbibliothek konnte nicht geladen werden. Bitte Internetverbindung prüfen und die Seite neu laden.";
    return;
  }
  const map = L.map("map",{zoomControl:false,preferCanvas:true}).setView([48.1511,16.3163],15);
  map.createPane("residences").style.zIndex=380;
  L.control.zoom({position:"bottomright"}).addTo(map);
  L.control.scale({imperial:false,position:"bottomleft"}).addTo(map);
  map.attributionControl.setPrefix(false);
  map.attributionControl.addAttribution('Datenquelle: <a href="https://data.wien.gv.at/">Stadt Wien – data.wien.gv.at</a>');
  const tiles = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'}).addTo(map);
  let tileWarned = false;
  tiles.on("tileerror",()=>{if(!tileWarned){tileWarned=true;notify("Hintergrundkarte teilweise nicht verfügbar. Bitte Verbindung prüfen.");}});
  walk = window.setupWalk?.(map,byId("walk"),notify);
  const pawIcon=L.divIcon({
    className:"dog-zone-paw",iconSize:[44,44],iconAnchor:[22,22],popupAnchor:[0,-18],
    html:'<img src="icon-192.png" width="36" height="36" alt="" draggable="false">'
  });
  let position;
  byId("gps").onclick = () => {
    if (!navigator.geolocation) return notify("GPS ist hier nicht verfügbar. Wähle die Kartenmitte unter „Runde & Wege“.");
    const btn = byId("gps"); btn.disabled=true; btn.textContent="Standort wird gesucht …";
    function reset(){btn.disabled=false;btn.textContent="◎   Mein Standort";}
    navigator.geolocation.getCurrentPosition(p=>{
      reset(); const ll=L.latLng(p.coords.latitude,p.coords.longitude);
      if(position)position.remove();
      position=L.circleMarker(ll,{radius:8,color:"#fff",weight:3,fillColor:"#285fb2",fillOpacity:1}).addTo(map).bindTooltip("Dein Standort");
      map.setView(ll,16);walk?.setStart(ll);notify("Startpunkt übernommen · GPS-Genauigkeit ca. "+Math.round(p.coords.accuracy)+" m");
    },()=>{reset();notify("Kein GPS-Standort verfügbar. Verschiebe die Karte und übernimm die Kartenmitte als Start.");},{enableHighAccuracy:true,timeout:15000,maximumAge:30000});
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
    if(config.key==="parks" && config.on){
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
      const pane=config.key==="residences"?"residences":"overlayPane";
      const style={pane, dashArray:config.key==="residences"?"6 4":undefined,color:config.ink,weight:2,fillOpacity:config.key==="bans"?.50:.28};
      config.group=L.geoJSON(data,{pane,style,pointToLayer:(f,ll)=>L.circleMarker(ll,{...style,radius:7,fillOpacity:.8}),onEachFeature:(f,s)=>{
        const details=document.createElement("div");details.append(description(f.properties.name||config.label,config.label));
        const p=document.createElement("p");p.textContent=({passages:"Freiwillig zugänglicher Durchgang zur Windmühlgasse. Standort am Eingang. Öffnungszeiten und Zutritt mit Hund vor Ort prüfen.",residences:"Gemeinnützige Wohnanlage. Belag und öffentlicher Durchgang sind je Weg zu prüfen. Laut Hausordnung gilt Leinenpflicht; Spielplätze und Parkanlagen sind hundefrei. Es gibt eine eigene Hundezone.",parks:"Hundezugang und Lösemöglichkeit separat prüfen.",housing:"Durchgang und Zugangsrechte ungeprüft.",bans:["Point","MultiPoint"].includes(f.geometry.type)?"Gemeldeter Verbotsstandort. Die genaue Ausdehnung ist unbekannt.":"Der rote Umriss zeigt die erfasste Verbotsfläche.",dogs:"Einfriedung: "+(f.properties.fenced===true?"ja":f.properties.fenced===false?"nein":"unbekannt")})[config.key];details.append(p);
        if(config.key==="residences"){
          const link=document.createElement("a"); link.href="https://www.alt-erlaa.at/hausordnung/";link.textContent="Hausordnung Alt-Erlaa";details.append(link);
        }
        if(config.key==="passages"){
          const link=document.createElement("a");link.href="https://bezirksmuseen-wien.at/wp-content/uploads/2023/12/stiegen_text.pdf";link.textContent="Durchgang im Bezirksmuseum-Führer";details.append(link);
        }
        s.bindPopup(details);
      }});
      if(config.key==="dogs"){
        const paws=L.layerGroup();
        config.group.eachLayer(shape=>{
          const position=shape.getLatLng?.() || shape.getBounds().getCenter();
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
    const parks=layers.find(c=>c.key==="parks");
    if(parks.on)update(parks,parks.status);
    drawPlaces();
  });drawPlaces();
}
start().catch(()=>notify("Die Karte konnte nicht vollständig gestartet werden. Bitte Seite neu laden."));
if("serviceWorker" in navigator)navigator.serviceWorker.register("./sw.js").catch(()=>{});
