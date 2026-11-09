"use strict";

function setupEnvironment(map) {
  const el=id=>document.getElementById(id);
  const wms="https://inspire.lfrz.gv.at/000804/wms";
  const sources={
    road:"2022_STRASSE_24H_ZONEN_OE",
    rail:"2022_SCHIENE_24H_ZONEN_OE"
  };
  map.createPane("noiseBands").style.zIndex=355;
  map.createPane("roadworks").style.zIndex=470;
  const noise={};let works=null;
  function raster(endpoint, layers, pane, attribution, status) {
    const layer=L.tileLayer.wms(endpoint,{
      layers,pane,version:"1.3.0",format:"image/png",transparent:true,
      opacity:pane==="noiseBands"?.65:.9,attribution,
      bounds:[[48.10,16.17],[48.33,16.59]]
    });
    let failed=false;
    layer.on("loading",()=>{failed=false;status.textContent="Kartenausschnitt wird geladen …";});
    layer.on("tileerror",()=>{failed=true;status.textContent="Kartendienst teilweise oder ganz ausgefallen. Zum erneuten Laden Ebene aus- und einschalten.";});
    layer.on("load",()=>{if(!failed)status.textContent="";});
    return layer.addTo(map);
  }
  function showNoise(kind,on){
    noise[kind]?.remove();delete noise[kind];
    const status=el(kind+"State");status.textContent="";
    el(kind+"Legend").hidden=!on;
    if(!on)return;
    const params=new URLSearchParams({SERVICE:"WMS",VERSION:"1.3.0",REQUEST:"GetLegendGraphic",LAYER:sources[kind],FORMAT:"image/png"});
    const img=el(kind+"Key");img.hidden=false;img.onerror=()=>{img.hidden=true;};
    img.src=wms+"?"+params;
    noise[kind]=raster(wms,sources[kind],"noiseBands",'Datenquelle: <a href="https://www.laerminfo.at/">www.laerminfo.at</a>',status);
    if(noise.road && noise.rail)noise.rail.bringToFront();
  }
  function showWorks(on){
    works?.remove();works=null;
    el("officialWorks").checked=on;
    el("worksState").textContent="";
    if(on)works=raster("https://data.wien.gv.at/daten/geo","ogdwien:BAUSTELLENLINOGD,ogdwien:BAUSTELLENPKTOGD","roadworks","Datenquelle: Stadt Wien – data.wien.gv.at",el("worksState"));
  }
  for(const kind of ["road","rail"])el(kind+"Noise").onchange=e=>showNoise(kind,e.target.checked);
  el("officialWorks").onchange=e=>showWorks(e.target.checked);
  showNoise("road",true);

  const key="dogwalk.roadworks.v1";
  const reports=L.layerGroup().addTo(map), draftLayer=L.layerGroup().addTo(map);
  let drawing=false, points=[];
  function records(){
    const items=JSON.parse(localStorage.getItem(key)||"[]");
    if(!Array.isArray(items))throw Error("Ungültiger Speicherinhalt");
    return items;
  }
  function drawable(p){
    return Array.isArray(p)&&p.length===2&&p.every(Number.isFinite)&&Math.abs(p[0])<=90&&Math.abs(p[1])<=180;
  }
  function geometry(points){
    const style={pane:"roadworks",color:"#864000",weight:5,fillColor:"#ffc05b",fillOpacity:1,radius:9,dashArray:"4 4"};
    return points.length===1?MapIcons.marker(points[0],"works",style.color,"Eigene Baustelle"):L.polyline(points,style);
  }
  function render(){
    reports.clearLayers();
    try{
      for(const item of records()){
        if(!item?.points?.length || !item.points.every(drawable))continue;
        const box=document.createElement("div");
        const note=document.createElement("p");note.textContent=(item.note||"Eigene Baustelle")+" · gemeldet am "+new Date(item.date).toLocaleDateString("de-AT");
        const remove=document.createElement("button");remove.textContent="Als erledigt entfernen";
        remove.onclick=()=>{
          try{localStorage.setItem(key,JSON.stringify(records().filter(r=>r.id!==item.id)));render();}
          catch{el("editState").textContent="Änderung konnte nicht gespeichert werden.";}
        };
        box.append(note,remove);geometry(item.points).bindPopup(box).addTo(reports);
      }
    }catch{el("editState").textContent="Lokale Baustellen konnten nicht gelesen werden.";}
  }
  function finish(){
    drawing=false;points=[];draftLayer.clearLayers();el("editWorks").hidden=true;
    el("newWorks").hidden=false;el("workNote").value="";el("editState").textContent="";
    map.getContainer().classList.remove("dw-drawing");
  }
  el("newWorks").onclick=()=>{
    drawing=true;el("editWorks").hidden=false;el("newWorks").hidden=true;el("saveWorks").disabled=true;
    el("editState").textContent="Tippe für einen Standort einmal, für einen Abschnitt mehrmals auf die Karte.";
    map.getContainer().classList.add("dw-drawing");map.getContainer().scrollIntoView({block:"nearest"});
  };
  map.on("click",e=>{
    if(!drawing)return;
    points.push([e.latlng.lat,e.latlng.lng]);draftLayer.clearLayers();geometry(points).addTo(draftLayer);
    el("saveWorks").disabled=false;el("editState").textContent=points.length+" Punkt(e) gesetzt.";
  });
  el("cancelWorks").onclick=finish;
  el("saveWorks").onclick=()=>{
    if(!points.length)return;
    try{
      const next=records();next.push({id:crypto.randomUUID(),points,note:el("workNote").value.trim(),date:new Date().toISOString()});
      localStorage.setItem(key,JSON.stringify(next));finish();render();
      el("editState").textContent="Auf diesem Gerät gespeichert.";
    }catch{el("editState").textContent="Speichern fehlgeschlagen. Die Zeichnung ist noch offen.";}
  };

  el("environmentDetails").addEventListener("toggle",()=>{if(!el("environmentDetails").open&&drawing)finish();});
  window.addEventListener("storage",e=>{if(e.key===key||e.key===null)render();});
  render();
}
