/* DogWalk · Lokaler Planer. Koordinaten intern [Breite, Länge]. */
(() => {
  "use strict";
  const key = "dogwalk.paths.v1";
  const highway = "footway|pedestrian|path|steps|living_street|residential";
  const distances = (a,b) => Math.hypot((a[0]-b[0])*111200, (a[1]-b[1])*111200*Math.cos((a[0]+b[0])*Math.PI/360));
  const toPoint = p => [p[1], p[0]];
  const validPoint = p => Array.isArray(p) && p.length === 2 && p.every(Number.isFinite) && Math.abs(p[0])<=90 && Math.abs(p[1])<=180;
  function allowed(t) {
    return (!t.access || /^(yes|designated|permissive)$/.test(t.access))
      && (!t.foot || /^(yes|designated|permissive)$/.test(t.foot))
      && (!t.dog || /^(yes|leashed|designated|permissive)$/.test(t.dog))
      && !Object.keys(t).some(k=>/^(access|foot|dog)(:|$).*conditional/.test(k))
      && !t.opening_hours && !t.barrier && !t.construction && t.area !== "yes"
      && t.locked!=="yes" && t.indoor!=="yes" && t.highway!=="elevator"
      && (t.tunnel!=="building_passage" || /^(yes|designated|permissive)$/.test(t.foot||t.access||""))
      && !t["oneway:foot"] && !t["foot:forward"] && !t["foot:backward"];
  }
  function cross(a,b,c) { return (b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]); }
  function intersects(a,b,c,d) {
    if ([0,1].some(i=>Math.max(a[i],b[i])<Math.min(c[i],d[i]) || Math.max(c[i],d[i])<Math.min(a[i],b[i]))) return false;
    return cross(a,b,c)*cross(a,b,d)<=0 && cross(c,d,a)*cross(c,d,b)<=0;
  }
  function inside(p,ring) {
    let yes=false;
    for(let i=0,j=ring.length-1;i<ring.length;j=i++) {
      const a=ring[i], b=ring[j];
      if((a[0]>p[0]) !== (b[0]>p[0]) && p[1] < (b[1]-a[1])*(p[0]-a[0])/(b[0]-a[0])+a[1]) yes=!yes;
    }
    return yes;
  }
  function places(fc, start, radius) {
    const out=[];
    for(const f of fc.features) {
      const g=f.geometry;
      if(!g) continue;
      const groups=g.type==="MultiPolygon"?g.coordinates:g.type==="Polygon"?[g.coordinates]:[];
      const points=g.type==="Point"?[g.coordinates]:g.type==="MultiPoint"?g.coordinates:[];
      for(const point of points) {
        const p=toPoint(point);
        if(distances(start,p)<radius+250) out.push({p,props:f.properties});
      }
      for(const group of groups) {
        const rings=group.map(r=>r.map(toPoint));
        const box=[Infinity,Infinity,-Infinity,-Infinity];
        for(const [y,x] of rings[0]) {
          box[0]=Math.min(box[0],y); box[1]=Math.min(box[1],x);
          box[2]=Math.max(box[2],y); box[3]=Math.max(box[3],x);
        }
        const near=start.map((v,i)=>Math.max(box[i],Math.min(box[i+2],v)));
        if(distances(start,near)>radius+250) continue;
        out.push({p:[(box[0]+box[2])/2,(box[1]+box[3])/2],rings,box,props:f.properties});
      }
    }
    return out;
  }
  function touches(a,b,place) {
    if(!place.rings) {
      // A point record gives no boundary. A conservative buffer covers its immediate surroundings.
      const x=(b[1]-a[1])*Math.cos(a[0]*Math.PI/180), y=b[0]-a[0];
      const k=Math.max(0,Math.min(1,((place.p[1]-a[1])*Math.cos(a[0]*Math.PI/180)*x+(place.p[0]-a[0])*y)/(x*x+y*y || 1)));
      return distances(place.p,[a[0]+k*y,a[1]+k*(b[1]-a[1])])<35;
    }
    if([0,1].some(i=>Math.max(a[i],b[i])<place.box[i] || Math.min(a[i],b[i])>place.box[i+2])) return false;
    if(inside(a,place.rings[0]) && !place.rings.slice(1).some(r=>inside(a,r))) return true;
    return place.rings.some(r=>r.some((p,i)=>i>0 && intersects(a,b,p,r[i-1])));
  }
  function fenced(props={}) {
    return Object.entries(props).some(([k,v])=>/fenc|fried|z[aä]un|umz/i.test(k) && /^(1|ja|yes|true|eingezäunt)$/i.test(String(v).trim()));
  }
  let graphCache;
  async function network(start,radius) {
    if(graphCache && graphCache.until>Date.now() && distances(start,graphCache.start)+radius<=graphCache.radius) return graphCache.data;
    const queryRadius=radius+140;
    const dy=queryRadius/111200, dx=dy/Math.cos(start[0]*Math.PI/180);
    const bbox=[start[0]-dy,start[1]-dx,start[0]+dy,start[1]+dx].map(n=>n.toFixed(5)).join(",");
    const q='[out:json][timeout:22];way["highway"~"^('+highway+')$"]('+bbox+');(._;>;);out body qt;';
    const response=await fetch("https://overpass-api.de/api/interpreter",{method:"POST",body:new URLSearchParams({data:q}),signal:AbortSignal.timeout(30000)});
    if(!response.ok) throw Error("Das OSM-Wegenetz ist gerade nicht erreichbar ("+response.status+"). Bitte später erneut versuchen.");
    const data=await response.json();
    if(data.remark || !Array.isArray(data.elements)) throw Error("Das Wegenetz wurde unvollständig geliefert. Bitte erneut versuchen.");
    graphCache={data,start,radius:queryRadius,until:Date.now()+10*60*1000};
    return data;
  }
  function nearNode(nodes,p,limit,connected) {
    let result;
    for(const n of nodes.values()) {
      if(connected && (!n.edges.length || typeof n.id!=="number")) continue;
      const d=distances(n.p,p);
      if(d<limit) {limit=d;result=n;}
    }
    return result;
  }
  function buildGraph(osm,start,radius,prefs,prohibited,paths) {
    const nodes=new Map();
    for(const e of osm.elements) {
      if(e.type!=="node" || !allowed(e.tags||{})) continue;
      const p=[e.lat,e.lon];
      if(distances(p,start)<=radius+90) nodes.set(e.id,{id:e.id,p,edges:[]});
    }
    function join(a,b,weight,custom=false) {
      if(!a || !b || a===b || prohibited.some(zone=>touches(a.p,b.p,zone))) return;
      const length=distances(a.p,b.p);
      if(length<0.05) return;
      a.edges.push({to:b,length,weight:length*weight,custom});
      b.edges.push({to:a,length,weight:length*weight,custom});
    }
    for(const e of osm.elements) {
      if(e.type!=="way" || !allowed(e.tags||{})) continue;
      const t=e.tags;
      if(t.highway==="steps" && prefs.steps) continue;
      if(t.highway==="path" && !/^(yes|designated|permissive)$/.test(t.foot||t.access||"")) continue;
      if(prefs.level && t.incline && !/^(0(%|°)?|flat)$/i.test(t.incline)) continue;
      const weight=prefs.quiet && t.highway==="residential"?1.7:1;
      for(let i=1;i<e.nodes.length;i++) join(nodes.get(e.nodes[i-1]),nodes.get(e.nodes[i]),weight);
    }
    for(const f of paths) {
      const t=f.properties;
      if(t.passage && t.passage!=="Belegt und begehbar")continue;
      if(t.review!=="lokal geprüft" || t.access!=="erlaubt" || !t.evidence || (prefs.steps && t.steps!=="nein") || (prefs.level && t.slope!=="eben bestätigt")) continue;
      const points=f.geometry.coordinates.map(toPoint);
      const a=nearNode(nodes,points[0],8,true), b=nearNode(nodes,points.at(-1),8,true);
      if(!a || !b || a===b) continue;
      const chain=[a,...points.slice(1,-1).map((p,i)=>({p,id:f.id+"-"+i,edges:[]})),b];
      if(chain.some((n,i)=>i>0 && prohibited.some(z=>touches(chain[i-1].p,n.p,z)))) continue;
      chain.slice(1,-1).forEach(n=>nodes.set(n.id,n));
      for(let i=1;i<chain.length;i++)join(chain[i-1],chain[i],1,true);
    }
    return nodes;
  }
  // Dijkstra with a binary heap. Adjacent branches plus their connecting edge form a closed walk.
  function tree(origin,limit) {
    const heap=[], cost=new Map([[origin,0]]), parent=new Map(), length=new Map([[origin,0]]);
    function push(entry) {
      let i=heap.length;
      heap.push(entry);
      while(i>0) {const j=(i-1)>>1;if(heap[j][0]<=entry[0])break;heap[i]=heap[j];i=j;}
      heap[i]=entry;
    }
    function pop() {
      const first=heap[0],last=heap.pop();
      if(!heap.length)return first;
      let i=0;
      while(i*2+1<heap.length) {
        let j=i*2+1;
        if(j+1<heap.length && heap[j+1][0]<heap[j][0])j++;
        if(heap[j][0]>=last[0])break;
        heap[i]=heap[j];i=j;
      }
      heap[i]=last;return first;
    }
    push([0,origin]);
    while(heap.length) {
      const [c,n]=pop();
      if(c!==cost.get(n))continue;
      for(const e of n.edges) {
        const next=c+e.weight;
        if(next>limit || next>=(cost.get(e.to)??Infinity))continue;
        cost.set(e.to,next);length.set(e.to,length.get(n)+e.length);parent.set(e.to,n);push([next,e.to]);
      }
    }
    return {cost,parent,length};
  }
  function solve(origin,target,parks,dogs,prefs) {
    const {cost,parent,length}=tree(origin,target*1.1);
    const ancestry=n=>{const path=[];while(n){path.push(n);n=parent.get(n);}return path;};
    let best=null;
    const green=new Map(), zones=new Map();
    function nearby(n,features,cache,meters) {
      if(!cache.has(n))cache.set(n,features.some(f=>distances(n.p,f.p)<meters || (f.rings && touches(n.p,n.p,f))));
      return cache.get(n);
    }
    for(const [a,d] of length) for(const e of a.edges) {
      const b=e.to;
      if(!length.has(b) || String(a.id)>=String(b.id) || parent.get(a)===b || parent.get(b)===a)continue;
      const total=d+e.length+length.get(b);
      if(total<target*.6 || total>target*1.45)continue;
      const left=ancestry(a).reverse(),right=ancestry(b);
      let common=0;
      while(common<Math.min(left.length,right.length) && left[common]===right[right.length-1-common])common++;
      const shared=length.get(left[common-1])||0;
      if(shared*2>total*.45)continue;
      const line=[...left,...right];
      if(prefs.zone!=="egal" && prefs.zone!=="meiden" && !line.some(n=>nearby(n,dogs,zones,70)))continue;
      const lush=prefs.green?line.filter(n=>nearby(n,parks,green,90)).length/line.length:0;
      const score=Math.abs(total-target)/target+shared/total*.5+(cost.get(a)+cost.get(b)-d-length.get(b))/total*.45-lush*.18;
      if(!best || score<best.score)best={line:line.map(n=>n.p),total,score};
    }
    return best;
  }
  async function routingLayers(load, prefs, start, radius) {
    const read = async kind => {
      try {
        const fc = await load(kind);
        return {areas: places(fc, start, radius), incomplete: Boolean(fc.partial)};
      } catch {
        return {areas: [], incomplete: true};
      }
    };
    const unused = {areas: [], incomplete: false};
    const [bans, dogs, parks] = await Promise.all([
      read("bans"),
      prefs.zone === "egal" ? unused : read("dogs"),
      prefs.green ? read("parks") : unused
    ]);
    if (dogs.incomplete) throw Error("Für deinen Hundezonenwunsch fehlen verlässliche Flächen. Wähle unter Hundezonen „Ohne Vorgabe“ und berechne die Runde erneut.");
    const notes = [];
    if (bans.incomplete) notes.push("Hundeverbote sind nur teilweise oder gar nicht kartiert. Prüfe den Verlauf und die Beschilderung vor Ort.");
    if (parks.incomplete) notes.push("Die Grünpräferenz konnte nicht berücksichtigt werden.");
    return {bans: bans.areas, dogs: dogs.areas, parks: parks.incomplete ? [] : parks.areas, preview: bans.incomplete, notes};
  }
  if (typeof module === "object" && module.exports) {
    module.exports = { buildGraph, solve, places, allowed, routingLayers };
    return;
  }
  window.setupWalk=function(map,panel,notify=()=>{}) {
    const node=document.createElement("div");
    node.className="dw-tools";
    panel.append(node);
    node.innerHTML=`
      <details class="dw-card" data-section="route"><summary>Rundweg planen</summary><div class="dw-form">
        <button type="button" data-act="start">Kartenmitte als Start wählen</button><small data-v="start">Startpunkt noch offen.</small>
        <div class="dw-pair"><label>Ziel nach<select name="unit"><option value="km">Kilometern</option><option value="min">Minuten</option></select></label>
        <label><span data-v="amount">Strecke in km</span><input name="amount" type="number" min=".5" max="5" step=".1" value="1"></label></div>
        <label class="dw-check"><input type="checkbox" name="local">Lokal geprüfte Wege einbeziehen</label>
        <small>Grünflächen werden bevorzugt. Bekannte Hundeverbote werden berücksichtigt.</small>
        <small>Die Wegesuche sendet den gerundeten Startpunkt an Overpass. Beschilderung, Stiegen und Steigung können in den Kartendaten fehlen.</small>
        <button class="dw-primary" type="button" data-act="route">Rundweg suchen</button>
        <output data-v="result" aria-live="polite"></output></div></details>
      <details class="dw-card" data-section="community"><summary>Weg erfassen</summary><div class="dw-form">
        <div class="dw-pair"><button data-act="draw">Auf Karte zeichnen</button><button data-act="gps">GPS aufnehmen</button></div>
        <output data-v="draft" aria-live="polite">Noch kein Entwurf.</output>
        <div class="dw-pair"><button data-act="undo" disabled>Letzten Punkt lösen</button><button data-act="stop" disabled>Aufnahme beenden</button></div>
        <button data-act="inspect" disabled>Mit OSM-Wegen vergleichen</button><output data-v="inspection" aria-live="polite"></output>
        <label>Wegname<input name="title" maxlength="80" placeholder="z. B. Durchgang am Innenhof"></label>
        <label>Wegbeschaffenheit<select name="surface"><option>unbekannt</option><option>befestigt</option><option>Schotter</option><option>Erde oder Wiese</option></select></label>
        <div class="dw-pair"><label>Stiegen<select name="pathsteps"><option>unbekannt</option><option>nein</option><option>ja</option></select></label>
        <label>Gelände<select name="slope"><option>unbekannt</option><option>eben bestätigt</option><option>mit Steigung</option></select></label></div>
        <label>Öffentlicher Durchgang auf Privatgrund<select name="passage"><option value="">Ohne Angabe</option><option value="Hinweis">Vor Ort beobachtet · Recht ungeklärt</option><option value="Planfestlegung">Im Bebauungsplan festgelegt · Umsetzung offen</option><option value="Belegt und begehbar">Öffentliche Nutzung belegt und Weg begehbar</option></select></label>
        <small>Für einen belegten Durchgang bitte die Quelle angeben, etwa Plannummer und Textstelle, Schildwortlaut oder Auskunft der Verwaltung. <a href="https://www.wien.gv.at/verkehr/fusswegekarte" target="_blank" rel="noopener">Wiener Fußwegekarte</a></small>
        <label>Durchgang mit Hund<select name="access"><option>ungeklärt</option><option>erlaubt</option><option>gesperrt</option></select></label>
        <label>Quelle oder Beobachtung<input name="evidence" maxlength="180" placeholder="z. B. Auskunft der Hausverwaltung, Datum"></label>
        <label class="dw-check"><input type="checkbox" name="review">Verlauf, beide Anschlüsse und Zutritt mit Hund vor Ort geprüft</label>
        <button class="dw-primary" data-act="save" disabled>Weg lokal speichern</button><button data-act="discard" disabled>Entwurf verwerfen</button>
        <small>Einträge bleiben auf diesem Gerät. Nur ausdrücklich lokal geprüfte und erlaubte Wege können in deinen Routentest einfließen.</small>
        <div data-v="saved"></div><button data-act="export" disabled>Wege als GeoJSON exportieren</button>
      </div></details>`;
    const val=name=>node.querySelector('[name="'+name+'"]');
    const result=name=>node.querySelector('[data-v="'+name+'"]');
    const btn=name=>node.querySelector('[data-act="'+name+'"]');
    const on=(name,fn)=>btn(name).addEventListener("click",fn);
    let start=null, routeLine, startDot, generation=0, watch=null, mode=null, draft=[], editingId=null;
    let paths=[], inspectionRevision=0;
    const reference=L.layerGroup().addTo(map);
    function clearInspection(){inspectionRevision++;reference.clearLayers();result("inspection").textContent="";}
    try {
      const data=JSON.parse(localStorage.getItem(key)||"[]");
      if(Array.isArray(data))paths=data.filter(f=>f?.geometry?.type==="LineString" && f.properties && Array.isArray(f.geometry.coordinates) && f.geometry.coordinates.length>=2 && f.geometry.coordinates.every(c=>validPoint(toPoint(c))));
    } catch {result("draft").textContent="Der Gerätespeicher ist nicht lesbar.";}
    const drafts=L.layerGroup().addTo(map),saved=L.layerGroup().addTo(map);
    function invalidate() {
      generation++;
      if(routeLine){map.removeLayer(routeLine);routeLine=null;}
      result("result").textContent="";
      btn("route").disabled=false;
    }
    function setStart(p) {
      const pt=Array.isArray(p)?p:[p.lat,p.lng];
      if(!validPoint(pt))return;
      invalidate();start=pt;
      if(startDot)startDot.remove();
      startDot=L.circleMarker(pt,{radius:6,color:"#fff",weight:3,fillColor:"#164e44",fillOpacity:1}).bindTooltip("Startpunkt").addTo(map);
      result("start").textContent="Start bei "+pt.map(n=>n.toFixed(5)).join(", ")+".";
    }
    on("start",()=>setStart(map.getCenter()));
    node.querySelector('[data-section="route"]').addEventListener("change",invalidate);
    val("unit").onchange=()=>{
      const km=val("unit").value==="km",n=val("amount");
      n.min=km?".5":"8";n.max=km?"5":"75";n.step=km?".1":"1";n.value=km?"1":"15";
      result("amount").textContent=km?"Strecke in km":"Dauer in Minuten";
    };
    on("route",async()=>{
      if(!start){result("result").textContent="Bitte zuerst den Startpunkt wählen.";return;}
      if(!val("amount").reportValidity() || !val("amount").value)return;
      if(start[0]<48.11 || start[0]>48.33 || start[1]<16.17 || start[1]>16.59){result("result").textContent="Die Routenplanung ist für das Wiener Testgebiet verfügbar.";return;}
      invalidate();
      const seq=generation;
      const prefs={steps:false,level:false,zone:"egal",green:true,quiet:false};
      const target=Number(val("amount").value)*(val("unit").value==="km"?1000:4000/60);
      const radius=Math.ceil(Math.min(1900,Math.max(400,target*.42)));
      btn("route").disabled=true;
      result("result").textContent="Fußwege und Flächen werden geprüft …";
      try {
        const dy=(radius+250)/111200, dx=dy/Math.cos(start[0]*Math.PI/180);
        const area=DogData.region(start[1]-dx,start[0]-dy,start[1]+dx,start[0]+dy);
        const load=kind=>DogData.load(kind,kind==="parks"?area:undefined);
        const [osm, layers] = await Promise.all([network(start,radius), routingLayers(load,prefs,start,radius)]);
        const {bans, dogs, parks, preview, notes} = layers;
        if(seq!==generation)return;
        const forbidden=prefs.zone==="meiden"?[...bans,...dogs]:bans;
        const nodes=buildGraph(osm,start,radius,prefs,forbidden,!preview && val("local").checked?paths:[]);
        const from=nearNode(nodes,start,90,true);
        if(!from)throw Error("Kein geeigneter Wegknoten innerhalb von 90 m. Wähle einen Start auf einem öffentlichen Fußweg.");
        const answer=solve(from,target,parks,prefs.zone==="zaun"?dogs.filter(z=>fenced(z.props)):dogs,prefs);
        if(!answer)throw Error("Keine passende Runde gefunden. Ändere Start oder Strecke.");
        routeLine=L.polyline(answer.line,{color:"#b75027",weight:5,opacity:.95,dashArray:preview?"9 7":undefined}).addTo(map);
        if (preview) routeLine.bindTooltip("Routenvorschau · Hundeverbote unvollständig geprüft").bindPopup(notes.join(" "));
        map.fitBounds(routeLine.getBounds(),{padding:[22,22],maxZoom:17});
        result("result").textContent=(preview?"Routenvorschau · ":"")+(answer.total/1000).toLocaleString("de-AT",{maximumFractionDigits:2})+" km · ca. "+Math.round(answer.total*60/4000)+" Min. bei 4 km/h. Rundweg ab Wegknoten "+Math.round(distances(start,from.p))+" m vom gewählten Start. "+notes.join(" ");
      } catch(e) {if(seq===generation)result("result").textContent=e.name==="TimeoutError"?"Das OSM-Wegenetz hat nicht rechtzeitig geantwortet. Versuche es erneut oder wähle eine kürzere Runde.":e.message==="Failed to fetch"?"Der Datendienst ist nicht erreichbar. Bitte online erneut versuchen.":e.message;}
      finally {if(seq===generation)btn("route").disabled=false;}
    });
    function paintDraft(message) {
      clearInspection();
      btn("inspect").disabled=draft.length<2 || !!mode;
      drafts.clearLayers();
      if(draft.length>1)L.polyline(draft,{color:"#ab682e",dashArray:"5 6",interactive:false}).addTo(drafts);
      if(draft.length)L.circleMarker(draft.at(-1),{radius:4,color:"#79451d",interactive:false}).addTo(drafts);
      result("draft").textContent=message || (mode==="draw"?"Auf die Karte tippen. ":mode==="gps"?"GPS-Aufnahme läuft im Vordergrund. ":"")+draft.length+" Wegpunkte.";
      btn("stop").disabled=!mode;btn("undo").disabled=!draft.length || mode==="gps";btn("save").disabled=draft.length<2;btn("discard").disabled=!draft.length && !mode && !editingId;
    }
    function stop() {
      if(watch!==null)navigator.geolocation.clearWatch(watch);
      watch=null;mode=null;map.getContainer().classList.remove("dw-drawing");
      paintDraft();
    }
    function add(p) {
      if(!validPoint(p) || (draft.length && distances(draft.at(-1),p)<1))return;
      draft.push(p);paintDraft();
    }
    map.on("click",e=>{if(mode==="draw")add([e.latlng.lat,e.latlng.lng]);});
    on("draw",()=>{stop();mode="draw";map.getContainer().classList.add("dw-drawing");map.getContainer().scrollIntoView({block:"nearest"});paintDraft();});
    on("gps",()=>{
      stop();
      if(!navigator.geolocation){paintDraft("GPS steht in diesem Browser nicht zur Verfügung.");return;}
      mode="gps";paintDraft();
      watch=navigator.geolocation.watchPosition(pos=>{
        if(mode!=="gps")return;
        if(pos.coords.accuracy>30){paintDraft("GPS ungenau (±"+Math.round(pos.coords.accuracy)+" m). Warte auf ein genaueres Signal.");return;}
        const p=[pos.coords.latitude,pos.coords.longitude];
        if(draft.length && distances(draft.at(-1),p)>75){stop();paintDraft("GPS-Lücke über 75 m. Ergänze den fehlenden Verlauf auf der Karte oder speichere den bisherigen Abschnitt.");return;}
        if(!draft.length || distances(draft.at(-1),p)>=5){add(p);map.panTo(p);}
      },err=>{stop();paintDraft(err.code===1?"Standortfreigabe fehlt. Zeichnen ist weiterhin möglich.":"GPS-Aufnahme unterbrochen. Bisherige Punkte bleiben im Entwurf.");},{enableHighAccuracy:true,maximumAge:0,timeout:20000});
    });
    on("stop",stop);
    on("inspect",async()=>{
      clearInspection();
      const revision=inspectionRevision;
      result("inspection").textContent="OSM-Wege rund um den Entwurf werden geladen …";
      const center=L.latLngBounds(draft).getCenter(), p=[center.lat,center.lng];
      const radius=Math.ceil(draft.reduce((r,n)=>Math.max(r,distances(n,p)),0))+100;
      if(radius>1900){result("inspection").textContent="Der Abschnitt ist für den lokalen Vergleich zu groß. Bitte einen kürzeren Weg erfassen.";return;}
      try {
        const osm=await network(p,radius);
        if(revision!==inspectionRevision)return;
        const table=new Map(osm.elements.filter(n=>n.type==="node").map(n=>[n.id,[n.lat,n.lon]]));
        const eligible=buildGraph(osm,p,radius,{steps:false,level:false,quiet:false},[],[]);
        for(const w of osm.elements.filter(n=>n.type==="way")){
          const pts=w.nodes.map(id=>table.get(id));
          if(pts.length>1 && pts.every(Boolean))L.polyline(pts,{weight:3,color:"#305e9a",opacity:.7,interactive:false}).addTo(reference);
        }
        drafts.eachLayer(l=>l.bringToFront?.());
        const ends=[draft[0],draft.at(-1)].map(pt=>{
          const match=nearNode(eligible,pt,80,true);
          return match?Math.round(distances(pt,match.p))+" m":"über 80 m";
        });
        result("inspection").textContent="Blau zeigt die abgefragten OSM-Wegeklassen. Verlauf mit der Zeichnung vergleichen. Nächster geeigneter Knoten am Anfang: "+ends[0]+", am Ende: "+ends[1]+". Für einen Routentest müssen beide Anschlüsse innerhalb von 8 m liegen. Zugang und Ebenen vor Ort prüfen.";
      } catch {if(revision===inspectionRevision)result("inspection").textContent="OSM-Wege konnten nicht geladen werden. Der Entwurf bleibt erhalten.";}
    });
    on("undo",()=>{draft.pop();paintDraft();});
    function reset() {
      stop();draft=[];editingId=null;
      for(const k of ["surface","pathsteps","slope","access","passage"])val(k).selectedIndex=0;
      val("title").value="";val("evidence").value="";val("review").checked=false;
      btn("save").textContent="Weg lokal speichern";paintDraft();
    }
    on("discard",reset);
    function persist(next) {
      try{localStorage.setItem(key,JSON.stringify(next));paths=next;invalidate();return true;}
      catch{paintDraft("Speichern fehlgeschlagen. Prüfe den freien Gerätespeicher. Der Entwurf ist noch offen.");return false;}
    }
    function renderSaved() {
      const hasReviewed = paths.some(f=>f.properties.review==="lokal geprüft" && f.properties.access==="erlaubt");
      val("local").parentElement.hidden=!hasReviewed;
      if (!hasReviewed) val("local").checked=false;
      saved.clearLayers();const container=result("saved");container.replaceChildren();
      for(const f of paths) {
        const passage=f.properties.passage;
        const line=L.polyline(f.geometry.coordinates.map(toPoint),{color:passage?"#165daf":"#715489",weight:4,dashArray:passage==="Belegt und begehbar"?undefined:"4 7"}).addTo(saved);
        const title=document.createElement("span");title.textContent=f.properties.title+" · "+f.properties.review;if(passage)title.textContent+=" · "+passage+" · Hund: "+f.properties.access;line.bindTooltip(title);
        const row=document.createElement("div");row.className="dw-saved";
        const edit=document.createElement("button");edit.textContent=f.properties.title+" · bearbeiten";
        edit.onclick=()=>{
          if((draft.length || mode) && !confirm("Aktuellen Entwurf durch den gespeicherten Weg ersetzen?"))return;
          reset();editingId=f.id;draft=f.geometry.coordinates.map(toPoint);
          for(const [k,v] of Object.entries({title:"title",passage:"passage",access:"access",evidence:"evidence",surface:"surface",slope:"slope",pathsteps:"steps"}))val(k).value=f.properties[v]||"";
          val("review").checked=f.properties.review==="lokal geprüft";btn("save").textContent="Änderungen speichern";map.fitBounds(line.getBounds(),{maxZoom:18});paintDraft();
        };
        const del=document.createElement("button");del.textContent="Löschen";del.onclick=()=>{
          if(!confirm("„"+f.properties.title+"“ von diesem Gerät löschen?"))return;
          if(persist(paths.filter(p=>p.id!==f.id))){if(editingId===f.id)reset();renderSaved();}
        };
        row.append(edit,del);container.append(row);
      }
      btn("export").disabled=!paths.length;
    }
    on("save",()=>{
      if(draft.length<2)return;
      const passage=val("passage").value;
      if(["Planfestlegung","Belegt und begehbar"].includes(passage) && !val("evidence").value.trim()){
        paintDraft("Bitte die Quelle für den Durchgang eintragen.");return;
      }
      if(val("review").checked && passage && passage!=="Belegt und begehbar"){
        paintDraft("Als Entwurf speichern oder erst die öffentliche Nutzung und Begehbarkeit bestätigen.");return;
      }
      if(val("review").checked && (!val("evidence").value.trim() || val("access").value!=="erlaubt")){
        paintDraft("Für die lokale Freigabe sind erlaubter Zutritt und eine nachvollziehbare Quelle erforderlich.");return;
      }
      const feature={type:"Feature",id:editingId || crypto.randomUUID(),geometry:{type:"LineString",coordinates:draft.map(toPoint)},properties:{
        passage:val("passage").value,title:val("title").value.trim()||"Weg "+(paths.length+1),surface:val("surface").value,slope:val("slope").value,steps:val("pathsteps").value,access:val("access").value,evidence:val("evidence").value.trim(),review:val("review").checked?"lokal geprüft":"ungeprüft",updated:new Date().toISOString(),source:"private Beobachtung"}};
      if(!persist([...paths.filter(p=>p.id!==feature.id),feature]))return;
      reset();renderSaved();paintDraft("Weg gespeichert · "+feature.properties.review+".");
    });
    on("export",()=>{
      const url=URL.createObjectURL(new Blob([JSON.stringify({type:"FeatureCollection",features:paths},null,2)],{type:"application/geo+json"}));
      const link=document.createElement("a");link.href=url;link.download="dogwalk-wege.geojson";link.click();setTimeout(()=>URL.revokeObjectURL(url),2000);
    });
    document.addEventListener("visibilitychange",()=>{if(document.hidden && mode==="gps"){stop();paintDraft("GPS pausiert. Zum Fortsetzen GPS erneut starten.");}});
    renderSaved();
    return {setStart,cancel:stop};
  };
})();
