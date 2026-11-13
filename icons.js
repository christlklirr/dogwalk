"use strict";

// The same artwork is used on the map and beside its layer switch.
const MapIcons = (() => {
  // Every icon shares one base size; the map scales them with the zoom (see style.css).
  const SIZE = 28;
  const drawings = {
    dogs: '<ellipse cx="5" cy="10" rx="2.1" ry="3"/><ellipse cx="10" cy="6" rx="2" ry="3"/><ellipse cx="16" cy="6.5" rx="2" ry="3"/><ellipse cx="20" cy="11" rx="2" ry="2.8"/><path d="M6 17q6-12 12 0c2 6-3 4-6 3s-8 3-6-3Z"/>',
    bags: '<path d="M9 2.5h6l-1.6 3.4C16.8 7.7 19 11.2 19 14.6a7 7 0 0 1-14 0c0-3.4 2.2-6.9 5.6-8.7Z"/>',
    water: '<path d="M12 2S5 10 5 14a7 7 0 0 0 14 0c0-4-7-12-7-12Z"/>',
    trough: '<path d="M3 15h18l-3 5H6zM12 2s-3 4-3 6a3 3 0 0 0 6 0c0-2-3-6-3-6Z"/>',
    trees: '<path d="m12 2-7 9h4l-5 6h16l-5-6h4zM12 17v5"/>',
    parks: '<path d="M5 18C2 9 9 5 20 4c-1 12-7 17-15 14Zm0 2 10-11"/>',
    bans: '<circle cx="12" cy="12" r="9"/><path d="m6 6 12 12"/>',
    police: '<path d="m12 2 8 3v6q0 6-8 11-8-5-8-11V5z"/><path d="M8 11h8"/>',
    churches: '<circle cx="12" cy="4" r="2"/><path d="M5 20v-7l7-6 7 6v7zM10 20v-5h4v5"/>',
    markets: '<path d="m3 10 3-6h12l3 6H3Zm2 1v9h14v-9M9 20v-5h6v5"/>',
    housing: '<path d="m2 11 10-8 10 8M5 10v11h14V10M10 21v-7h4v7"/>',
    play: '<path d="M4 20 7 5h10l3 15M10 5v9M14 5v9M8.5 14h7"/>',
    crowds:
      '<circle cx="8" cy="7" r="2.5"/><circle cx="16" cy="7" r="2.5"/><path d="M3 19v-2a4 4 0 0 1 4-4h2a4 4 0 0 1 4 4v2M11 19v-2a4 4 0 0 1 4-4h2a4 4 0 0 1 4 4v2"/>',
    metro: '<path d="M6 4v10a6 6 0 0 0 12 0V4"/>',
    works: '<path d="m12 3 10 17H2zM12 9v5m0 2v1"/>',
    gps: '<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2"/><path d="M12 1v4m0 14v4M1 12h4m14 0h4"/>',
  };
  // These icons are solid shapes instead of outlines.
  const FILLED = ["dogs", "bags"];
  function badge(key, color) {
    const span = document.createElement("span");
    span.className = "map-badge";
    span.style.color = color;
    span.setAttribute("aria-hidden", "true");
    span.innerHTML =
      '<svg viewBox="0 0 24 24" fill="' +
      (FILLED.includes(key) ? "currentColor" : "none") +
      '" stroke="currentColor" stroke-width="' +
      (FILLED.includes(key) ? "0" : "2") +
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
      '<rect width="7" height="7" fill="#7cc46e" fill-opacity="0.08"/>' +
      '<line x1="0" y1="0" x2="0" y2="7" stroke="#7cc46e" stroke-width="2.2" stroke-opacity="0.6"/>' +
      "</pattern></defs>";
    document.body.prepend(defs);
  }
  // Green areas: diagonal green lines as a tiny canvas pattern (fast, no SVG per area).
  let lines;
  function parkLines() {
    if (lines) return lines;
    const tile = document.createElement("canvas");
    tile.width = tile.height = 8;
    const g = tile.getContext("2d");
    g.fillStyle = "rgba(124, 196, 110, 0.08)";
    g.fillRect(0, 0, 8, 8);
    g.strokeStyle = "rgba(124, 196, 110, 0.6)";
    g.lineWidth = 2.2;
    g.beginPath();
    // one diagonal plus the two corner pieces, so the lines join seamlessly
    g.moveTo(0, 8);
    g.lineTo(8, 0);
    g.moveTo(-2, 2);
    g.lineTo(2, -2);
    g.moveTo(6, 10);
    g.lineTo(10, 6);
    g.stroke();
    lines = g.createPattern(tile, "repeat");
    return lines;
  }
  // Legend pictures that look like the map: hatched area, dashed path (base map), tree dots.
  const swatches = {
    parks: '<rect x="2" y="5" width="24" height="18" rx="3" fill="url(#parkHatch)"/>',
    nearpaths:
      '<path d="M2 20 Q14 4 26 10" fill="none" stroke="#f08a7e" stroke-width="2.5" stroke-dasharray="4 3"/>',
    trees:
      '<circle cx="8" cy="10" r="4" fill="' + COLORS.olive + '"/><circle cx="20" cy="9" r="3" fill="' + COLORS.olive + '"/><circle cx="14" cy="20" r="4.5" fill="' + COLORS.olive + '"/>',
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
  const SOUND_SOURCES = ["play", "churches", "metro", "crowds"];
  function figures() {
    const span = document.createElement("span");
    span.className = "crowd-figures";
    span.setAttribute("aria-hidden", "true");
    span.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">' +
      drawings.crowds +
      "</svg>";
    return span;
  }
  function marker(ll, key, color, label, pane = "markerPane") {
    const size = SIZE,
      id = key + color;
    if (!cache.has(id))
      cache.set(
        id,
        L.divIcon({
          className:
            "map-badge-marker icon-" + key + (SOUND_SOURCES.includes(key) ? " sound-source" : ""),
          html: (key === "crowds" ? figures() : badge(key, color)).outerHTML,
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
  // Orange paw without a circle, drawn on top of a dog zone (one shared icon).
  let pawIcon;
  const getPawIcon = () =>
    (pawIcon ??= L.divIcon({
      className: "paw-marker",
      html: '<svg viewBox="0 0 24 24" width="20" height="20" fill="' + COLORS.orange + '" aria-hidden="true"><ellipse cx="5" cy="10" rx="2.1" ry="3"/><ellipse cx="10" cy="6" rx="2" ry="3"/><ellipse cx="16" cy="6.5" rx="2" ry="3"/><ellipse cx="20" cy="11" rx="2" ry="2.8"/><path d="M6 17q6-12 12 0c2 6-3 4-6 3s-8 3-6-3Z"/></svg>',
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    }));
  function paw(ll, label) {
    return L.marker(ll, { icon: getPawIcon(), title: label, alt: label, pane: "dogPaws" });
  }
  return { badge, marker, swatch, paw, parkLines };
})();
