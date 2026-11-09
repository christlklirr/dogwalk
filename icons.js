"use strict";

// The same artwork is used on the map and beside its layer switch.
const MapIcons=(()=>{
  function sizeFor(key){return ["water","trough","bags","play"].includes(key)?34:key==="dogs"?27:28;}
  const drawings={
    dogs:'<ellipse cx="5" cy="10" rx="2.1" ry="3"/><ellipse cx="10" cy="6" rx="2" ry="3"/><ellipse cx="16" cy="6.5" rx="2" ry="3"/><ellipse cx="20" cy="11" rx="2" ry="2.8"/><path d="M6 17q6-12 12 0c2 6-3 4-6 3s-8 3-6-3Z"/>',
    bags:'<path d="M6 6h12v14H6zM9 3h6v3H9zM9 10h6m-6 4h6"/>',
    water:'<path d="M12 2S5 10 5 14a7 7 0 0 0 14 0c0-4-7-12-7-12Z"/>',
    trough:'<path d="M3 15h18l-3 5H6zM12 2s-3 4-3 6a3 3 0 0 0 6 0c0-2-3-6-3-6Z"/>',
    trees:'<path d="m12 2-7 9h4l-5 6h16l-5-6h4zM12 17v5"/>',
    parks:'<path d="M5 18C2 9 9 5 20 4c-1 12-7 17-15 14Zm0 2 10-11"/>',
    bans:'<circle cx="12" cy="12" r="9"/><path d="m6 6 12 12"/>',
    police:'<path d="m12 2 8 3v6q0 6-8 11-8-5-8-11V5z"/><path d="M8 11h8"/>',
    churches:'<path d="M12 2v6m-3-4h6M5 20v-7l7-6 7 6v7zM10 20v-5h4v5"/>',
    markets:'<path d="m3 10 3-6h12l3 6H3Zm2 1v9h14v-9M9 20v-5h6v5"/>',
    housing:'<path d="m2 11 10-8 10 8M5 10v11h14V10M10 21v-7h4v7"/>',
    passages:'<path d="M2 12h20m-5-5 5 5-5 5M7 7l-5 5 5 5"/>',
    play:'<path d="M2 20 7 4h8l7 16M8 5v9h6V5"/>',
    metro:'<path d="M6 4v10a6 6 0 0 0 12 0V4"/>',
    nearpaths:'<path d="m3 18 6-10 5 2 6-7M5 21l6-9 5 2 5-6"/>',
    greenways:'<path d="M4 19c0-6 15-3 15-9S6 9 7 4"/>',
    calm:'<path d="M8 2 5 22M16 2l3 20M12 5v3m0 5v3"/>',
    works:'<path d="m12 3 10 17H2zM12 9v5m0 2v1"/>',
    gps:'<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2"/><path d="M12 1v4m0 14v4M1 12h4m14 0h4"/>'
  };
  function badge(key,color){
    const span=document.createElement("span");
    span.className="map-badge";span.style.color=color;span.style.setProperty("--badge-size",sizeFor(key)+"px");span.setAttribute("aria-hidden","true");
    span.innerHTML='<svg viewBox="0 0 24 24" fill="'+(key==="dogs"?"currentColor":"none")+'" stroke="currentColor" stroke-width="'+(key==="dogs"?"0":"2")+'" stroke-linecap="round" stroke-linejoin="round">'+drawings[key]+'</svg>';
    return span;
  }
  const cache=new Map();
  function marker(ll,key,color,label,pane="markerPane"){
    const size=sizeFor(key),id=key+color;
    if(!cache.has(id))cache.set(id,L.divIcon({className:"map-badge-marker",html:badge(key,color).outerHTML,iconSize:[size,size],iconAnchor:[size/2,size/2],popupAnchor:[0,-size/2]}));
    return L.marker(ll,{icon:cache.get(id),pane,title:label,alt:label}).on("add",function(){
      this.getElement()?.setAttribute("aria-label",label);
    });
  }
  return {badge,marker};
})();
