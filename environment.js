"use strict";

function setupEnvironment(map) {
  const el = (id) => document.getElementById(id);
  const wms = "https://inspire.lfrz.gv.at/000804/wms";
  const sources = {
    road: "2022_STRASSE_24H_ZONEN_OE",
    rail: "2022_SCHIENE_24H_ZONEN_OE",
  };
  map.createPane("noiseBands").style.zIndex = 355;
  // All green areas lie below everything else (and below the noise areas).
  map.createPane("greens").style.zIndex = 350;
  map.createPane("roadworks").style.zIndex = 470;
  const noise = {};
  // The official noise map has five colour bands. We only draw the loud ones (65, 70, 75+ dB)
  // as anthracite areas, darker the louder.
  const BANDS = [
    { rgb: [226, 242, 192], alpha: 0 }, // 55 dB: left out
    { rgb: [243, 197, 130], alpha: 0 }, // 60 dB: left out
    { rgb: [204, 71, 62], alpha: 0.2 }, // 65 dB
    { rgb: [118, 8, 92], alpha: 0.34 }, // 70 dB
    { rgb: [67, 11, 74], alpha: 0.5 }, // 75+ dB
  ];
  const ink = [0x2b, 0x2b, 0x2b];
  function band(r, g, b) {
    let best = 0,
      dist = Infinity;
    BANDS.forEach(({ rgb }, i) => {
      const d = (rgb[0] - r) ** 2 + (rgb[1] - g) ** 2 + (rgb[2] - b) ** 2;
      if (d < dist) [best, dist] = [i, d];
    });
    return BANDS[best];
  }
  // A WMS layer whose tiles are redrawn pixel by pixel.
  const HatchedWMS = L.TileLayer.WMS.extend({
    createTile(coords, done) {
      const tile = document.createElement("canvas"),
        size = this.getTileSize();
      tile.width = size.x;
      tile.height = size.y;
      const img = new Image();
      img.crossOrigin = "anonymous";
      const url = this.getTileUrl(coords);
      // Fallback if the browser does not allow reading the pixels: the plain image, all bands,
      // turned anthracite by a filter.
      const plain = () => {
        const fallback = new Image();
        fallback.onerror = () => done(new Error("Lärmkarte nicht geladen"), tile);
        fallback.onload = () => {
          const g = tile.getContext("2d");
          g.filter = "grayscale(1) brightness(0.35)";
          g.globalAlpha = 0.4;
          g.drawImage(fallback, 0, 0, size.x, size.y);
          done(null, tile);
        };
        fallback.src = url;
      };
      img.onerror = plain;
      img.onload = () => {
        const g = tile.getContext("2d", { willReadFrequently: true });
        g.drawImage(img, 0, 0, size.x, size.y);
        let pixels;
        try {
          pixels = g.getImageData(0, 0, size.x, size.y);
        } catch {
          g.clearRect(0, 0, size.x, size.y);
          return plain();
        }
        const d = pixels.data,
          w = size.x,
          h = size.y,
          level = new Float32Array(w * h);
        for (let p = 0; p < w * h; p++) {
          const i = p * 4;
          level[p] = d[i + 3] > 100 ? band(d[i], d[i + 1], d[i + 2]).alpha : 0;
        }
        for (let p = 0; p < w * h; p++) {
          const i = p * 4;
          d[i] = ink[0];
          d[i + 1] = ink[1];
          d[i + 2] = ink[2];
          d[i + 3] = Math.round(level[p] * 255);
        }
        g.putImageData(pixels, 0, 0);
        done(null, tile);
      };
      // Own address suffix: tiles the browser cached earlier without the CORS header would fail.
      img.src = url + "&px=1";
      return tile;
    },
  });
  // All green areas of the city, always shown: the city draws them as an image (fast). We keep only
  // the grey fill (not the black outlines, which reach into streets) and turn it light green. The
  // pane blends by multiplying, so street names and symbols of the base map stay readable.
  // Multiplied onto the grey residential areas (#e0dfdf) this gives the yellowish grass green of
  // the base map (#cdebb0), so the courtyards look like the parks around them.
  const GREEN = [233, 255, 201];
  // Building sites (construction.json, from OpenStreetMap) are cut out of the green: the city map
  // still shows some new sites as meadows.
  const sitesReady = fetch("construction.json")
    .then((r) => (r.ok ? r.json() : { sites: [] }))
    .then((d) =>
      d.sites.map((s) => {
        const xs = s.ring.map((p) => p[0]),
          ys = s.ring.map((p) => p[1]);
        return { ring: s.ring, box: [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)] };
      }),
    )
    .catch(() => []);
  const GreenWMS = L.TileLayer.WMS.extend({
    createTile(coords, done) {
      const tile = document.createElement("canvas"),
        size = this.getTileSize();
      tile.width = size.x;
      tile.height = size.y;
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onerror = () => done(new Error("Grünflächen nicht geladen"), tile);
      img.onload = () => {
        const g = tile.getContext("2d", { willReadFrequently: true });
        g.drawImage(img, 0, 0, size.x, size.y);
        let pixels;
        try {
          pixels = g.getImageData(0, 0, size.x, size.y);
        } catch {
          return done(null, tile);
        }
        const d = pixels.data;
        for (let i = 0; i < d.length; i += 4) {
          // Grey fill only (170,170,170); black outlines are dropped.
          const on = d[i + 3] > 40 && d[i] > 120;
          d[i] = GREEN[0];
          d[i + 1] = GREEN[1];
          d[i + 2] = GREEN[2];
          d[i + 3] = on ? 255 : 0;
        }
        g.putImageData(pixels, 0, 0);
        // Leave out building sites in this tile.
        const map = this._map,
          bounds = this._tileCoordsToBounds(coords),
          origin = coords.scaleBy(size);
        sitesReady.then((sites) => {
          g.globalCompositeOperation = "destination-out";
          for (const s of sites) {
            if (s.box[0] > bounds.getEast() || s.box[2] < bounds.getWest()) continue;
            if (s.box[1] > bounds.getNorth() || s.box[3] < bounds.getSouth()) continue;
            g.beginPath();
            s.ring.forEach(([x, y], i) => {
              const p = map.project([y, x], coords.z).subtract(origin);
              i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y);
            });
            g.closePath();
            g.fill();
          }
          g.globalCompositeOperation = "source-over";
          done(null, tile);
        });
      };
      img.src = this.getTileUrl(coords);
      return tile;
    },
  });
  new GreenWMS("https://data.wien.gv.at/daten/geo", {
    layers: "ogdwien:FMZKGRUEN2OGD",
    // Only green areas, no building sites, storage yards or sports pitches.
    CQL_FILTER: "LAYER IN ('Grünfläche','Sonstige Grünfläche','Wiese')",
    pane: "greens",
    version: "1.3.0",
    format: "image/png",
    transparent: true,
    minZoom: 14,
    maxZoom: 19,
    interactive: false,
    bounds: [
      [48.1, 16.17],
      [48.33, 16.59],
    ],
  }).addTo(map);
  function raster(endpoint, layers, pane, attribution, status) {
    const layer = new HatchedWMS(endpoint, {
      layers,
      pane,
      version: "1.3.0",
      format: "image/png",
      transparent: true,
      // Same limit as the base map (otherwise Leaflet hides the layer above zoom 18).
      maxZoom: 19,
      attribution,
      bounds: [
        [48.1, 16.17],
        [48.33, 16.59],
      ],
    });
    let failed = false;
    layer.on("loading", () => {
      failed = false;
      status.textContent = "Kartenausschnitt wird geladen …";
    });
    layer.on("tileerror", () => {
      failed = true;
      status.textContent =
        "Kartendienst teilweise oder ganz ausgefallen. Zum erneuten Laden Ebene aus- und einschalten.";
    });
    layer.on("load", () => {
      if (!failed) status.textContent = "";
    });
    return layer.addTo(map);
  }
  function showNoise(kind, on) {
    noise[kind]?.remove();
    delete noise[kind];
    const status = el(kind + "State");
    status.textContent = "";
    // The colour scale shows while at least one noise layer is on.
    el("noiseScale").hidden = !el("roadNoise").checked && !el("railNoise").checked;
    if (!on) return;
    noise[kind] = raster(
      wms,
      sources[kind],
      "noiseBands",
      'Datenquelle: <a href="https://www.laerminfo.at/">www.laerminfo.at</a>',
      status,
    );
    strength(kind);
    if (noise.road && noise.rail) noise.rail.bringToFront();
  }
  // "teilweise" at the chosen time (e.g. rail noise at night): the dark areas at half strength.
  const strength = (kind) => noise[kind]?.setOpacity(TimeNow.level(kind + "Noise") === 1 ? 0.5 : 1);
  // Noise is shown when switched on and not quiet at the chosen time (see time.js).
  const wanted = (kind) => el(kind + "Noise").checked && TimeNow.level(kind + "Noise") > 0;
  for (const kind of ["road", "rail"]) el(kind + "Noise").onchange = () => showNoise(kind, wanted(kind));
  TimeNow.onChange(() => {
    for (const kind of ["road", "rail"]) {
      if (Boolean(noise[kind]) !== wanted(kind)) showNoise(kind, wanted(kind));
      else strength(kind);
    }
  });
  showNoise("road", false);
}
