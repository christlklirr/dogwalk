"use strict";

// The same artwork is used on the map and beside its layer switch.
const MapIcons = (() => {
  // Every icon shares one base size; the map scales them with the zoom (see style.css).
  const SIZE = 28;
  const drawings = {
    dogs: '<ellipse cx="5" cy="10" rx="2.1" ry="3"/><ellipse cx="10" cy="6" rx="2" ry="3"/><ellipse cx="16" cy="6.5" rx="2" ry="3"/><ellipse cx="20" cy="11" rx="2" ry="2.8"/><path d="M6 17q6-12 12 0c2 6-3 4-6 3s-8 3-6-3Z"/>',
    bags: '<path d="M6 6h12v14H6zM9 3h6v3H9zM9 10h6m-6 4h6"/>',
    water: '<path d="M12 2S5 10 5 14a7 7 0 0 0 14 0c0-4-7-12-7-12Z"/>',
    trough: '<path d="M3 15h18l-3 5H6zM12 2s-3 4-3 6a3 3 0 0 0 6 0c0-2-3-6-3-6Z"/>',
    trees: '<path d="m12 2-7 9h4l-5 6h16l-5-6h4zM12 17v5"/>',
    parks: '<path d="M5 18C2 9 9 5 20 4c-1 12-7 17-15 14Zm0 2 10-11"/>',
    bans: '<circle cx="12" cy="12" r="9"/><path d="m6 6 12 12"/>',
    police: '<path d="m12 2 8 3v6q0 6-8 11-8-5-8-11V5z"/><path d="M8 11h8"/>',
    churches: '<path d="M12 2v6m-3-4h6M5 20v-7l7-6 7 6v7zM10 20v-5h4v5"/>',
    markets: '<path d="m3 10 3-6h12l3 6H3Zm2 1v9h14v-9M9 20v-5h6v5"/>',
    housing: '<path d="m2 11 10-8 10 8M5 10v11h14V10M10 21v-7h4v7"/>',
    play: '<path d="M4 20 8 5h8l4 15M9 6v8h6V6"/>',
    metro: '<path d="M6 4v10a6 6 0 0 0 12 0V4"/>',
    nearpaths: '<path d="m3 18 6-10 5 2 6-7M5 21l6-9 5 2 5-6"/>',
    works: '<path d="m12 3 10 17H2zM12 9v5m0 2v1"/>',
    gps: '<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2"/><path d="M12 1v4m0 14v4M1 12h4m14 0h4"/>',
  };
  function badge(key, color) {
    const span = document.createElement("span");
    span.className = "map-badge";
    span.style.color = color;
    span.setAttribute("aria-hidden", "true");
    span.innerHTML =
      '<svg viewBox="0 0 24 24" fill="' +
      (key === "dogs" ? "currentColor" : "none") +
      '" stroke="currentColor" stroke-width="' +
      (key === "dogs" ? "0" : "2") +
      '" stroke-linecap="round" stroke-linejoin="round">' +
      drawings[key] +
      "</svg>";
    return span;
  }
  // Hatch pattern for green areas, shared by the map and the legend.
  function ensurePatterns() {
    if (document.getElementById("parkHatch")) return;
    const defs = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    defs.setAttribute("width", "0");
    defs.setAttribute("height", "0");
    defs.setAttribute("aria-hidden", "true");
    defs.style.position = "absolute";
    defs.innerHTML =
      '<defs><pattern id="parkHatch" patternUnits="userSpaceOnUse" width="7" height="7" patternTransform="rotate(45)">' +
      '<rect width="7" height="7" fill="#3c8d40" fill-opacity="0.12"/>' +
      '<line x1="0" y1="0" x2="0" y2="7" stroke="#3c8d40" stroke-width="2.4" stroke-opacity="0.7"/>' +
      "</pattern></defs>";
    document.body.prepend(defs);
  }
  // Legend pictures that look like the map: hatched area, dashed path, tree dots.
  const swatches = {
    parks: '<rect x="2" y="5" width="24" height="18" rx="3" fill="url(#parkHatch)"/>',
    dogs: '<rect x="2" y="5" width="24" height="18" rx="3" fill="#8fd0de"/>',
    nearpaths:
      '<path d="M2 20 Q14 4 26 10" fill="none" stroke="#1a81a1" stroke-width="3.5" stroke-dasharray="5 3.5"/>',
    trees:
      '<circle cx="8" cy="10" r="4" fill="#1a81a1"/><circle cx="20" cy="9" r="3" fill="#1a81a1"/><circle cx="14" cy="20" r="4.5" fill="#1a81a1"/>',
  };
  function swatch(key) {
    ensurePatterns();
    const span = document.createElement("span");
    span.className = "map-swatch";
    span.setAttribute("aria-hidden", "true");
    span.innerHTML = '<svg viewBox="0 0 28 28" width="28" height="28">' + swatches[key] + "</svg>";
    return span;
  }
  const cache = new Map();
  // Possible noise sources get a soft glow in the 65 dB colour.
  const SOUND_SOURCES = ["play", "churches", "metro"];
  function marker(ll, key, color, label, pane = "markerPane") {
    const size = SIZE,
      id = key + color;
    if (!cache.has(id))
      cache.set(
        id,
        L.divIcon({
          className: "map-badge-marker" + (SOUND_SOURCES.includes(key) ? " sound-source" : ""),
          html: badge(key, color).outerHTML,
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
          popupAnchor: [0, -size / 2],
        }),
      );
    return L.marker(ll, { icon: cache.get(id), pane, title: label, alt: label }).on(
      "add",
      function () {
        this.getElement()?.setAttribute("aria-label", label);
      },
    );
  }
  return { badge, marker, swatch, ensurePatterns };
})();
