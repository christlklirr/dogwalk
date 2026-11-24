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
    parks: '<path d="M5 18C2 9 9 5 20 4c-1 12-7 17-15 14Zm0 2 10-11"/>',
    bans: '<circle cx="12" cy="12" r="9"/><path d="m6 6 12 12"/>',
    police: '<path d="m12 2 8 3v6q0 6-8 11-8-5-8-11V5z"/><path d="M8 11h8"/>',
    markets: '<path d="m3 10 3-6h12l3 6H3Zm2 1v9h14v-9M9 20v-5h6v5"/>',
    play: '<path d="M4 20 7 5h10l3 15M10 5v9M14 5v9M8.5 14h7"/>',
    crowds:
      '<circle cx="8" cy="7" r="2.5"/><circle cx="16" cy="7" r="2.5"/><path d="M3 19v-2a4 4 0 0 1 4-4h2a4 4 0 0 1 4 4v2M11 19v-2a4 4 0 0 1 4-4h2a4 4 0 0 1 4 4v2"/>',
    // U-Bahn: train front.
    metro: '<rect x="6" y="3" width="12" height="14" rx="3.5"/><path d="M6 10.5h12M8.5 21 10 17.5M15.5 21 14 17.5"/><circle cx="9.5" cy="14" r=".6"/><circle cx="14.5" cy="14" r=".6"/>',
    // Flag: end station.
    terminal: '<path d="M6 21V4M6 4h11l-2.5 4L17 12H6"/>',
    // Stop sign with an H, like at Viennese tram and bus stops.
    transit: '<circle cx="12" cy="9" r="6.5"/><path d="M9.5 6v6M14.5 6v6M9.5 9h5M12 15.5V22"/>',
    // Two people walking, seen from the side: busy places (day and evening).
    walkers:
      '<circle cx="8" cy="4" r="2" fill="currentColor"/><path d="M8 7 7 13M7 13l-2 7M7 13l3 7M7.8 9 5 11M7.8 9l2.7 1.5"/>' +
      '<circle cx="17" cy="7" r="1.8" fill="currentColor"/><path d="M17 9.5 16.2 14.5M16.2 14.5 14.5 20M16.2 14.5 18.8 20M16.8 11l-2.2 1.8M16.8 11l2.2 1.3"/>',
    // Wine glass: busy restaurant and bar streets in the evening.
    evening: '<path d="M7 3h10l-1 6.5a4 4 0 0 1-8 0L7 3ZM12 13.5V20M8 21h8"/>',
    works: '<path d="m12 3 10 17H2zM12 9v5m0 2v1"/>',
    // Sun over waves: bathing spot.
    bathing: '<circle cx="12" cy="7" r="3"/><path d="M2 15q2.5-2 5 0t5 0 5 0 5 0M2 20q2.5-2 5 0t5 0 5 0 5 0"/>',
    // A winding route from start to finish.
    walks: '<circle cx="6" cy="18" r="2"/><circle cx="18" cy="6" r="2"/><path d="M8 18h6a3 3 0 0 0 0-6h-4a3 3 0 0 1 0-6h6"/>',
    // Toilet seen from the side.
    wc: '<path d="M6 3h5v8H6zM4 11h16a8 8 0 0 1-8 7v3H9v-3.3A8 8 0 0 1 4 11Z"/>',
    // School house with a flag.
    schools: '<path d="M3 20V10l9-5 9 5v10M2 20h20M9 20v-5h6v5M12 5V2h3"/>',
    // Public transport: small vehicles, white on a disc in the colour of the kind.
    tram: '<path d="M9 2.5 12 4.5 15 2.5"/><rect x="6" y="6" width="12" height="13" rx="3"/><path d="M6 12.5h12M8 22h8"/><circle cx="9.5" cy="16" r=".6"/><circle cx="14.5" cy="16" r=".6"/>',
    bus: '<rect x="5" y="4" width="14" height="15" rx="3"/><path d="M5 11.5h14"/><circle cx="8.5" cy="21" r="1.3"/><circle cx="15.5" cy="21" r="1.3"/>',
    nightbus: '<rect x="4" y="8" width="13" height="11" rx="3"/><path d="M4 13.5h13"/><circle cx="7.5" cy="21" r="1.3"/><circle cx="13.5" cy="21" r="1.3"/><path d="M19 2.5a3.2 3.2 0 1 0 3 4 2.6 2.6 0 0 1-3-4z"/>',
    rail: '<rect x="7" y="3" width="10" height="14" rx="3"/><path d="M7 10h10M4 22h16M8.5 19.5 7 22M15.5 19.5 17 22"/>',
    gps: '<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2"/><path d="M12 1v4m0 14v4M1 12h4m14 0h4"/>',
  };
  // These icons are solid shapes instead of outlines.
  const FILLED = ["dogs", "bags"];
  // These icons are white on a disc of their colour (public transport).
  const SOLID = ["metro", "tram", "bus", "nightbus", "rail"];
  function badge(key, color) {
    const span = document.createElement("span");
    span.className = "map-badge badge-" + key;
    span.style.color = color;
    if (SOLID.includes(key)) {
      span.classList.add("badge-solid");
      span.style.background = color;
    }
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
  // Dog-ban areas: thin red diagonal lines, drawn the same fast way as the green ones were.
  let banPattern;
  function banLines() {
    if (banPattern) return banPattern;
    const tile = document.createElement("canvas");
    tile.width = tile.height = 8;
    const g = tile.getContext("2d");
    g.fillStyle = "rgba(180, 71, 63, 0.08)";
    g.fillRect(0, 0, 8, 8);
    g.strokeStyle = "rgba(180, 71, 63, 0.6)";
    g.lineWidth = 1.6;
    g.beginPath();
    g.moveTo(0, 8);
    g.lineTo(8, 0);
    g.moveTo(-2, 2);
    g.lineTo(2, -2);
    g.moveTo(6, 10);
    g.lineTo(10, 6);
    g.stroke();
    banPattern = g.createPattern(tile, "repeat");
    return banPattern;
  }
  // Legend pictures that look like the map: hatched area, dashed path (base map), tree dots.
  const swatches = {
    parks: '<rect x="2" y="5" width="24" height="18" rx="3" fill="url(#parkHatch)"/>',
    // Light green like the parks in the base map.
    greens: '<rect x="3" y="6" width="22" height="16" rx="4" fill="#cdebb0" stroke="#a9d18a" stroke-width="1"/>',
    // Red dashed path across a green area, as footpaths look in the parks of the base map.
    nearpaths:
      '<rect x="2" y="4" width="24" height="20" rx="4" fill="#cdebb0" stroke="#a9d18a" stroke-width="1"/>' +
      '<path d="M3 21 Q14 5 25 11" fill="none" stroke="#e5604f" stroke-width="2.5" stroke-dasharray="4 3"/>',
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
  const SOUND_SOURCES = ["play", "metro", "crowds", "schools", "works"];
  function figures() {
    const span = document.createElement("span");
    span.className = "crowd-figures";
    span.setAttribute("aria-hidden", "true");
    span.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' +
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
  // U-Bahn station: one small coloured chip per line (U1 red, U2 violet …), glow behind.
  const metroIcons = new Map();
  const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(",");
  function metroLines(ll, lines, label) {
    const id = lines.join();
    if (!metroIcons.has(id)) {
      const width = lines.length * 22 + (lines.length - 1) * 2;
      metroIcons.set(
        id,
        L.divIcon({
          className: "map-badge-marker icon-metro metro-lines",
          // Only the line chips (U1, U6 …); soft glow in the colour of the (first) line.
          html:
            '<i class="metro-glow" style="--g:' +
            rgb(COLORS.metro[lines[0].slice(1)] || COLORS.red) +
            '"></i>' +
            '<b class="metro-chips">' +
            lines
              .map((l) => '<span style="background:' + (COLORS.metro[l.slice(1)] || COLORS.red) + '">' + l + "</span>")
              .join("") +
            "</b>",
          iconSize: [width, 18],
          iconAnchor: [width / 2, 9],
        }),
      );
    }
    return L.marker(ll, { icon: metroIcons.get(id), title: label, alt: label });
  }
  // A tiny person walking, for busy places; some look left, some right.
  const walkerIcons = new Map();
  function walker(ll, color, flip) {
    const id = color + flip;
    if (!walkerIcons.has(id))
      walkerIcons.set(
        id,
        L.divIcon({
          className: "walker-marker" + (flip ? " flip" : ""),
          html:
            '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="' + color +
            '" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" style="color:' + color + '" aria-hidden="true"><circle cx="12" cy="4" r="2.4" fill="currentColor"/><path d="M12 7.5 11 14M11 14l-2.5 7M11 14l3.5 7M11.8 9.5 8.5 12M11.8 9.5 15 11.5"/></svg>',
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        }),
      );
    return L.marker(ll, { icon: walkerIcons.get(id), interactive: false, keyboard: false });
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
  return { badge, marker, swatch, paw, parkLines, banLines, walker, metroLines };
})();
