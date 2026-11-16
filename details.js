"use strict";

// Each row defines one switch, its visual style and its minimum zoom.
const detailLayers = [
  {
    id: "nearpaths",
    group: "layers",
    label: "Fußwege",
    hint: "Rot gestrichelt in der Grundkarte (OpenStreetMap).",
    zoom: 14,
    on: true,
    fixed: true,
    // Legend only: the extra footpath layer stays off until the OSM servers answer reliably.
    legendOnly: true,
    color: COLORS.petrol,
  },
  {
    id: "trees",
    group: "supplyLayers",
    label: "Baumstandorte",
    zoom: 15,
    info: "Erst ab Zoomstufe 15 sichtbar, also wenn man ein paar Straßen groß sieht. Weiter draußen wären es zu viele Bäume.",
    color: COLORS.olive,
    wfs: "BAUMKATOGD",
  },
  {
    id: "bags",
    group: "supplyLayers",
    label: "Gackerlsackerl-Spender",
    zoom: 0,
    color: COLORS.petrol,
    wfs: "HUNDESACKERLOGD",
  },
  {
    id: "water",
    group: "supplyLayers",
    label: "Trinkbrunnen und Hundetränken",
    zoom: 0,
    color: COLORS.petrol,
    wfs: "TRINKBRUNNENOGD",
  },
  {
    id: "metro",
    group: "transitLayers",
    label: "U-Bahn",
    zoom: 0,
    color: COLORS.red,
    // Stations and the routes in the Wiener Linien colours.
    wfs: "UBAHNHALTOGD,ogdwien:UBAHNOGD",
    osm: 'nwr["railway"="station"]["station"="subway"]',
  },
  {
    id: "tram",
    group: "transitLayers",
    label: "Straßenbahn",
    zoom: 13,
    info: "Strecken ab Zoomstufe 13, Haltestellen mit ihren Linien ab Zoomstufe 14.",
    color: COLORS.tram,
    icon: "transit",
    wfs: "OEFFHALTESTOGD,ogdwien:OEFFLINIENOGD",
    types: [1],
    lines: /^(\d{1,2}|D|O)$/,
  },
  {
    id: "bus",
    group: "transitLayers",
    label: "Bus",
    zoom: 13,
    info: "Strecken ab Zoomstufe 13, Haltestellen mit ihren Linien ab Zoomstufe 14.",
    color: COLORS.bus,
    icon: "transit",
    wfs: "OEFFHALTESTOGD,ogdwien:OEFFLINIENOGD",
    types: [2],
    lines: /^\d+[A-Z]$/,
  },
  {
    id: "nightbus",
    group: "transitLayers",
    label: "Nachtbus",
    zoom: 13,
    info: "Strecken ab Zoomstufe 13, Haltestellen mit ihren Linien ab Zoomstufe 14.",
    color: COLORS.nightbus,
    icon: "transit",
    wfs: "OEFFHALTESTOGD,ogdwien:OEFFLINIENOGD",
    types: [10, 11],
    lines: /^N\d+$/,
  },
  {
    id: "rail",
    group: "transitLayers",
    label: "S-Bahn und Badner Bahn",
    zoom: 13,
    info: "Strecken ab Zoomstufe 13, Haltestellen mit ihren Linien ab Zoomstufe 14.",
    color: COLORS.rail,
    icon: "transit",
    wfs: "OEFFHALTESTOGD,ogdwien:OEFFLINIENOGD",
    types: [5, 6, 9],
    lines: /^(S\d+|WLB|R\d+|REX\d*|CJX\d*|CAT)$/,
  },
  {
    id: "terminals",
    group: "transitLayers",
    label: "Endstationen zum Üben",
    zoom: 0,
    info: "An Endstationen warten U-Bahn, Straßenbahn und Bus oft ein paar Minuten. Dort kann man in Ruhe Ein- und Aussteigen üben. Quelle: Wiener Linien.",
    color: COLORS.petrol,
    icon: "terminal",
    file: "terminals.json",
  },
  {
    id: "crowds",
    group: "soundLayers",
    label: "Viel los tagsüber",
    zoom: 0,
    color: COLORS.crowdDay,
    icon: "walkers",
    // Sights, hop-on-hop-off stops (two operators), pedestrian zones, shared-space streets and
    // shopping streets (a band along the street, from the city's structural plan).
    wfs: "SEHENSWUERDIGOGD,ogdwien:TOURISTIKHTSBIGOGD,ogdwien:TOURISTIKHTSVSLOGD,ogdwien:FUSSGEHERZONEOGD,ogdwien:BEGEGNUNGSZONEOGD,ogdwien:STRUKGESCHSTROGD",
    // Places inside a dog-ban area do not matter for a dog walk.
    banFree: true,
  },
  {
    id: "evening",
    group: "soundLayers",
    label: "Viel los abends",
    zoom: 0,
    color: COLORS.crowdEvening,
    icon: "walkers",
    // Pavement cafés (Schanigärten): where many lie close together, the pavement glows.
    wfs: "SCHANIGARTENOGD",
  },
  {
    id: "play",
    group: "soundLayers",
    label: "Spielplätze",
    zoom: 0,
    color: COLORS.red,
    wfs: "SPIELPLATZPUNKTOGD",
  },
  {
    id: "churches",
    group: "soundLayers",
    label: "Kirchen und Moscheen",
    zoom: 0,
    color: COLORS.red,
    wfs: "RELIGIONOGD",
    osm: 'nwr["amenity"="place_of_worship"]["religion"~"^(christian|muslim)$"]',
  },
  {
    id: "markets",
    group: "optionalLayers",
    label: "Märkte und Marktplätze",
    zoom: 0,
    color: COLORS.violet,
    wfs: "MARKTFLAECHEOGD,ogdwien:MARKTGEBIETOGD",
    osm: 'nwr["amenity"="marketplace"]',
  },
  {
    id: "police",
    group: "optionalLayers",
    label: "Polizei",
    zoom: 0,
    color: COLORS.violet,
    wfs: "POLIZEIOGD",
    osm: 'nwr["amenity"="police"]',
  },
];
// The city lists chapels inside care homes, hospitals, schools and offices as "Kirche/Kapelle",
// named after the institution. Leave those out, unless the name clearly says church or chapel.
const INSTITUTION =
  /caritas|pflege|senior|altenheim|kranken|spital|klinik|geriatrie|hospiz|heim|schule|internatsschule|kolping|akademiker|studenten|hochsch|sozialzentrum|gmbh|ges.m.b.h|ministerium|bundeskanzleramt|landhaus|institut|curanum|casa|missionswerke|arge|niederlassung|mutterhaus|rudolfinerhaus|wohnzimmer/i;
const CHURCH_WORD = /kirche|kapelle|pfarr|dom|basilika|moschee|münster/i;
function isWorshipPlace(p) {
  const name = p.NAME || "";
  return (
    ["Kirche/Kapelle", "Moschee"].includes(p.TYP) &&
    (CHURCH_WORD.test(name) || !INSTITUTION.test(name))
  );
}
// The city renamed TYP_TXT to BASIS_TYP_TXT in 2026; accept both.
function waterType(p) {
  return p.BASIS_TYP_TXT || p.TYP_TXT || "";
}
function noteFor(id, p) {
  const notes = {
    trees: "Kartierter Baumstandort.",
    bags: "Kartierter Spender · Füllstand unbekannt.",
    churches: "Kirche oder Moschee. Glocken, Gebetszeiten und Besucherandrang ungeprüft.",
    markets: "Markt oder Marktplatz.",
    police: "Polizeistation.",
    play: "Spielplatz · Geräusche und Nutzung können je nach Tageszeit wechseln.",
    metro: "U-Bahn-Station · kein Messwert für die aktuelle Personenfrequenz.",
    crowds:
      "Tagsüber oft viele Menschen: Sehenswürdigkeit, Sightseeing-Haltestelle, Fußgänger- oder Begegnungszone.",
    evening: "Viele Schanigärten nah beieinander · eher abends, März bis November.",
  };
  if (id === "markets" && p.MARKTZEITEN_VERKAUF)
    return "Marktzeiten: " + p.MARKTZEITEN_VERKAUF;
  if (id === "water")
    return /hund|tränke/i.test(waterType(p))
      ? "Mit Hundetränke"
      : "Trinkwasser · eigene Schale mitnehmen";
  return notes[id];
}
// Several public OSM servers; if one is down or busy, the next one is tried.
const OVERPASS_SERVERS = [
  "https://overpass.private.coffee/api/interpreter",
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];
async function overpass(query, signal) {
  let lastError;
  for (const server of OVERPASS_SERVERS) {
    if (signal?.aborted) break;
    try {
      const res = await fetch(server, {
        method: "POST",
        body: new URLSearchParams({ data: query }),
        signal: AbortSignal.any([signal, AbortSignal.timeout(8000)].filter(Boolean)),
      });
      if (!res.ok) throw Error("OSM " + res.status);
      const data = await res.json();
      if (!Array.isArray(data.elements) || data.remark) throw Error("Unvollständige OSM-Antwort");
      return data.elements;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || Error("OSM nicht erreichbar");
}
// End stations: a small file made by tools/build-terminals.cjs, loaded once.
let terminalFile;
async function loadDetails(spec, bounds, signal) {
  if (spec.file) {
    terminalFile ??= fetch(spec.file).then((r) => (r.ok ? r.json() : Promise.reject(Error("Datei fehlt"))));
    const [w, s, e, n] = bounds;
    return (await terminalFile).terminals
      .filter((t) => t.x >= w && t.x <= e && t.y >= s && t.y <= n)
      .map((t) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [t.x, t.y] },
        properties: {
          label: t.name,
          note:
            "Endstation von " +
            (t.lines.length > 1 ? "Linie " : "Linie ") +
            t.lines.join(", ") +
            ". Die Fahrzeuge warten hier oft: gut zum Üben von Ein- und Aussteigen · Wiener Linien",
        },
      }));
  }
  if (spec.wfs) {
    try {
      const url = new URL("https://data.wien.gv.at/daten/geo");
      url.search = new URLSearchParams({
        service: "WFS",
        version: "1.0.0",
        request: "GetFeature",
        typeName: "ogdwien:" + spec.wfs,
        srsName: "EPSG:4326",
        outputFormat: "json",
        bbox: bounds.join(",") + ",EPSG:4326",
      });
      const res = await fetch(url, {
        signal: AbortSignal.any([signal, AbortSignal.timeout(spec.osm ? 6500 : 15000)]),
      });
      if (!res.ok) throw Error("Stadt Wien " + res.status);
      const data = await res.json();
      if (!Array.isArray(data.features)) throw Error("Keine Geodaten");
      const features = data.features
        .filter((f) => {
          const p = f.properties || {};
          if (!f.geometry) return false;
          // Only drinkable water: drinking fountains, hydrants and outlet fountains
          // (not decorative fountains, play fountains or mist showers).
          if (spec.id === "water") return /trink|tränke|auslauf/i.test(waterType(p));
          if (spec.id === "churches") return isWorshipPlace(p);
          // Public transport: only stops and routes of this means of transport.
          if (spec.types) return spec.types.includes(Number(p.LTYP));
          return true;
        })
        .map((f) => ({
          ...f,
          properties: {
            line: f.properties.LINFO,
            hlinien: f.properties.HLINIEN,
            label:
              (f.id?.startsWith("STRUKGESCHSTROGD") && "Geschäftsstraße") ||
              (f.id?.startsWith("UBAHNOGD") && "U" + f.properties.LINFO) ||
              (f.properties.LBEZEICHNUNG && "Linie " + f.properties.LBEZEICHNUNG) ||
              f.properties.HTXT ||
              f.properties.ANL_NAME ||
              f.properties.GATTUNG_ART ||
              f.properties.NAME ||
              f.properties.MARKT_TXT ||
              f.properties.STAT_NAME ||
              f.properties.BEZEICHNUNG ||
              f.properties.ADRESSE ||
              waterType(f.properties) ||
              spec.label,
            note:
              (f.id?.startsWith("STRUKGESCHSTROGD")
                ? "Geschäftsstraße: tagsüber viel los (Einkauf, Erledigungen)."
                : noteFor(spec.id, f.properties)) + " · Stadt Wien",
            street:
              f.properties.STRASSE ||
              f.properties.ADRESSE?.replace(/^\d+\.,\s*/, "").replace(/\s+\d.*$/, ""),
          },
        }));
      if (spec.id === "metro") {
        const named = new Map(),
          routes = features.filter((f) => f.geometry.type !== "Point");
        for (const f of features.filter((f) => f.geometry.type === "Point")) {
          const name = f.properties.label;
          if (!named.has(name)) named.set(name, { f, lines: new Set() });
          if (f.properties.line) named.get(name).lines.add("U" + f.properties.line);
        }
        for (const r of routes) r.properties.note = "U-Bahn-Strecke · Stadt Wien";
        return [
          ...routes,
          ...[...named.values()].map(({ f, lines }) => {
            f.properties.lines = [...lines].sort();
            f.properties.note =
              (lines.size > 1 ? "Umstieg zwischen " : "Linie ") +
              [...lines].join(", ") +
              ". Personenfrequenz unbekannt.";
            return f;
          }),
        ];
      }
      if (spec.types) {
        const routes = features.filter((f) => f.geometry.type !== "Point");
        for (const r of routes) r.properties.note = spec.label + " · Stadt Wien";
        return [...routes, ...transitStops(features.filter((f) => f.geometry.type === "Point"), spec.lines)];
      }
      if (spec.id !== "churches" || features.length || !data.features.length) return features;
    } catch (error) {
      // Without an OSM fallback (or when the user moved on) the error goes to the switch.
      if (!spec.osm || signal.aborted) throw error;
    }
  }
  const [w, s, e, n] = bounds;
  const rows = await overpass(
    "[out:json][timeout:10];" + spec.osm + "(" + [s, w, n, e] + ");out center;",
    signal,
  );
  return rows.flatMap((o) => {
    const pt = o.center || o,
      t = o.tags || {};
    if (!Number.isFinite(pt.lat) || !Number.isFinite(pt.lon)) return [];
    return [
      {
        type: "Feature",
        geometry: { type: "Point", coordinates: [pt.lon, pt.lat] },
        properties: {
          label: t.name || spec.label,
          note: noteFor(spec.id, t) + " · OpenStreetMap",
          street: t["addr:street"],
        },
      },
    ];
  });
}
// One sign per stop name within ~150 m, listing its tram and bus lines (U-Bahn has its own layer).
function transitStops(features, pattern) {
  const KX = 74000,
    KY = 111000,
    stops = [];
  features.forEach((f) => {
    const lines = String(f.properties.hlinien || "")
      .split(",")
      .map((l) => l.trim())
      .filter((l) => l && pattern.test(l));
    if (!lines.length) return;
    const [x, y] = f.geometry.coordinates,
      name = f.properties.label;
    const near = stops.find(
      (s) => s.name === name && Math.hypot((s.x - x) * KX, (s.y - y) * KY) < 150,
    );
    if (near) lines.forEach((l) => near.lines.add(l));
    else stops.push({ name, x, y, lines: new Set(lines) });
  });
  return stops.map((s) => ({
    type: "Feature",
    geometry: { type: "Point", coordinates: [s.x, s.y] },
    properties: {
      label: s.name,
      note: "Linien: " + [...s.lines].sort((a, b) => a.localeCompare(b, "de", { numeric: true })).join(", ") + " · Stadt Wien",
    },
  }));
}
function insideRing([x, y], ring) {
  let c = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i],
      [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}
// Drop points that lie inside a dog-ban area (e.g. sights in Schönbrunn).
async function withoutBanned(features) {
  let bans;
  try {
    bans = await DogData.load("bans");
  } catch {
    return features;
  }
  const rings = bans.features
    .filter((f) => f.geometry.type === "MultiPolygon")
    .flatMap((f) => f.geometry.coordinates.map((rings) => rings[0]));
  return features.filter(
    (f) => f.geometry.type !== "Point" || !rings.some((r) => insideRing(f.geometry.coordinates, r)),
  );
}
// Restaurant and bar streets: keep only pavement cafés with at least 4 others within 80 m.
function gastroStreets(features) {
  const KX = 74000,
    KY = 111000,
    pts = features.filter((f) => f.geometry.type === "Point").map((f) => f.geometry.coordinates);
  return pts
    .filter(
      ([x, y]) =>
        pts.filter(([a, b]) => Math.hypot((a - x) * KX, (b - y) * KY) < 80).length >= 5,
    )
    .map((coordinates) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates },
      properties: { label: "Gastro-Meile", note: noteFor("evening") + " · Stadt Wien", glow: true },
    }));
}
// Points stay points; areas are turned into glow points every ~90 m along their outline.
function glowAlong(features) {
  const KX = 74000,
    KY = 111000,
    STEP = 90,
    out = [];
  for (const f of features) {
    const g = f.geometry;
    if (g.type === "Point") {
      out.push({ ...f, properties: { ...f.properties, glow: true } });
      continue;
    }
    for (const rings of g.type === "Polygon" ? [g.coordinates] : g.coordinates) {
      const ring = rings[0];
      let carry = 0;
      for (let i = 1; i < ring.length; i++) {
        const [ax, ay] = ring[i - 1],
          [bx, by] = ring[i],
          len = Math.hypot((bx - ax) * KX, (by - ay) * KY);
        for (let d = carry; d < len; d += STEP) {
          const t = d / len;
          out.push({
            type: "Feature",
            geometry: { type: "Point", coordinates: [ax + (bx - ax) * t, ay + (by - ay) * t] },
            properties: { ...f.properties, glow: true, along: true },
          });
        }
        carry = (carry - len) % STEP;
        if (carry < 0) carry += STEP;
      }
    }
  }
  return out;
}
// Spots for the little walking people: around each busy point, and every ~50 m along busy streets.
// The offsets come from the coordinates, so the people stay put when the map is redrawn.
function walkerSpots(features) {
  const KX = 74000,
    KY = 111000,
    spots = [];
  const jitter = (x, y, k) => {
    const h = Math.sin(x * 12.9898e3 + y * 78.233e3 + k * 37.7) * 43758.5453;
    return h - Math.floor(h);
  };
  const scatter = ([x, y], count, spread) => {
    for (let k = 0; k < count; k++) {
      const a = jitter(x, y, k) * Math.PI * 2,
        r = spread * (0.3 + 0.7 * jitter(y, x, k + 5));
      spots.push([[y + (Math.sin(a) * r) / KY, x + (Math.cos(a) * r) / KX], spots.length]);
    }
  };
  for (const f of features) {
    const g = f.geometry;
    // Along streets one or two people per glow, at single places two or three.
    if (g.type === "Point")
      scatter(
        g.coordinates,
        (f.properties.along ? 1 : 2) + Math.floor(jitter(...g.coordinates, 9) * 2),
        f.properties.along ? 14 : 22,
      );
    else
      for (const rings of g.type === "Polygon" ? [g.coordinates] : g.coordinates) {
        let last = null;
        for (const p of rings[0])
          if (!last || Math.hypot((p[0] - last[0]) * KX, (p[1] - last[1]) * KY) > 50) {
            scatter(p, 1 + Math.floor(jitter(...p, 3) * 2), 10);
            last = p;
          }
      }
  }
  return spots;
}
function setupDetails(map) {
  const states = detailLayers.map((spec) => {
    const input = document.createElement("input"),
      status = document.createElement("small");
    input.type = "checkbox";
    input.dataset.layer = spec.id;
    input.checked = Boolean(spec.on);
    if (spec.fixed) {
      // Always shown: a legend entry without a switch.
      const row = document.createElement("details"),
        heading = document.createElement("summary"),
        hint = document.createElement("small");
      row.className = "legend-entry";
      heading.append(MapIcons.swatch(spec.id), document.createTextNode(spec.label));
      hint.textContent = spec.hint;
      row.append(heading, hint, status);
      document.getElementById(spec.group).append(row);
    } else {
      const row = document.createElement("label"),
        name = document.createElement("span");
      name.textContent = spec.label;
      row.className = "map-option";
      row.append(input, MapIcons.badge(spec.icon || spec.id, spec.color), name, status);
      document.getElementById(spec.group).append(row);
      // Optional info button that opens a short explanation below the switch.
      if (spec.info) {
        const button = document.createElement("button"),
          text = document.createElement("small");
        button.type = "button";
        button.className = "info-toggle";
        button.textContent = "ⓘ";
        button.setAttribute("aria-label", "Info zu " + spec.label);
        button.setAttribute("aria-expanded", "false");
        text.className = "layer-info";
        text.textContent = spec.info;
        text.hidden = true;
        button.onclick = (event) => {
          event.preventDefault();
          text.hidden = !text.hidden;
          button.setAttribute("aria-expanded", String(!text.hidden));
        };
        name.append(" ", button);
        row.after(text);
      }
    }
    const state = { spec, input, status, group: null, key: null, controller: null };
    input.onchange = () => refresh(state);
    return spec.legendOnly ? null : state;
  }).filter(Boolean);
  async function refresh(state) {
    const { spec, status, input } = state,
      b = map.getBounds(),
      z = map.getZoom(),
      // Snap the loaded area to a grid of about four map tiles: small pans stay inside it and need no reload.
      stepX = (360 / 2 ** z) * 4,
      stepY = stepX * 0.66;
    const coords = [
      Math.floor(b.getWest() / stepX) * stepX,
      Math.floor(b.getSouth() / stepY) * stepY,
      Math.ceil(b.getEast() / stepX) * stepX,
      Math.ceil(b.getNorth() / stepY) * stepY,
    ].map((v) => Number(v.toFixed(5)));
    const areaKey = z + ":" + coords.join(",");
    const key = input.checked && map.getZoom() >= spec.zoom ? areaKey : null;

    if (!key) {
      status.textContent = input.checked ? "Beim Hineinzoomen ab Stufe " + spec.zoom : "";
    }

    if (key === state.key) return;

    state.controller?.abort();
    state.group?.remove();
    state.group = null;
    state.key = key;

    if (!key) return;

    const controller = new AbortController();
    state.controller = controller;

    const timer = setTimeout(() => controller.abort(), 26000);
    status.textContent = "Wird geladen …";

    try {
      let data = await loadDetails(spec, coords, controller.signal);
      if (spec.banFree) data = await withoutBanned(data);
      if (spec.id === "evening") data = gastroStreets(data);
      // Busy places during the day get the same soft glow as the evening ones;
      // streets and zones become a row of glows along their edge instead of a coloured area.
      if (spec.id === "crowds") data = glowAlong(data);

      if (state.controller !== controller || state.key !== key) return;

      // Areas (e.g. market places) without an outline, like all other areas.
      const style = { stroke: false, fillColor: spec.color, fillOpacity: 0.3 };
      state.group = L.geoJSON(data, {
        // Points keep the look they get in pointToLayer; the area style would make them see-through.
        style: (f) =>
          ["Point", "MultiPoint"].includes(f.geometry.type)
            ? {}
            : ["LineString", "MultiLineString"].includes(f.geometry.type)
              ? // Public transport routes: U-Bahn thicker in its line colour, the rest thinner.
                {
                  color: spec.id === "metro" ? COLORS.metro[f.properties.line] || spec.color : spec.color,
                  weight: spec.id === "metro" ? 4 : 2.5,
                  opacity: 0.85,
                }
              : spec.id === "crowds"
              ? // Pedestrian and shared-space zones: a soft sun-yellow area.
                { stroke: false, fillColor: COLORS.crowdDay, fillOpacity: 0.28 }
              : style,
        pointToLayer: (f, ll) => {
          // Overlapping soft red circles: the more cafés, the stronger the glow on the pavement.
          if (f.properties.glow)
            return L.circle(ll, {
              radius: 30,
              stroke: false,
              fillColor: spec.color,
              fillOpacity: spec.id === "crowds" ? 0.22 : 0.2,
            });
          if (spec.id === "trees")
            return L.circleMarker(ll, {
              radius: { 15: 1.7, 16: 2.3, 17: 4, 18: 6 }[map.getZoom()] ?? 8,
              stroke: false,
              fillColor: spec.color,
              fillOpacity: 1,
            });
          const key =
            spec.id === "water" && f.properties.note.startsWith("Mit Hundetränke")
              ? "trough"
              : spec.icon || spec.id;
          if (spec.id === "metro" && map.getZoom() >= 14 && f.properties.lines?.length)
            return MapIcons.metroLines(ll, f.properties.lines, f.properties.label);
          if (map.getZoom() < 14)
            return L.circleMarker(ll, {
              radius: 3.5,
              color: "#fff",
              weight: 1,
              fillColor: spec.color,
              fillOpacity: 1,
            });
          return MapIcons.marker(ll, key, spec.color, f.properties.label);
        },
        onEachFeature: (f, layer) => {
          const box = document.createElement("div"),
            title = document.createElement("strong"),
            note = document.createElement("p");
          title.textContent = f.properties.label;
          note.textContent = f.properties.note;
          box.append(title, note);
          layer.bindPopup(box);
        },
      }).addTo(map);
      // Zoomed in, little people walk around in busy places: two or three per spot, scattered.
      if (spec.icon === "walkers" && map.getZoom() >= 16)
        for (const [ll, i] of walkerSpots(data)) MapIcons.walker(ll, "#fff", i % 2).addTo(state.group);
      status.textContent = data.length ? "" : "Keine Einträge im geladenen Ausschnitt.";
    } catch {
      if (state.controller === controller && state.key === key) {
        state.key = null;
        // The city's map service is down now and then: try again by itself, no need to switch off and on.
        status.textContent = "Stadt Wien antwortet gerade nicht · neuer Versuch in 30 s";
        clearTimeout(state.retry);
        state.retry = setTimeout(() => refresh(state), 30000);
      }
    } finally {
      clearTimeout(timer);
    }
  }
  let timer;
  map.on("moveend", () => {
    clearTimeout(timer);
    timer = setTimeout(() => states.forEach(refresh), 250);
  });
  states.forEach(refresh);
}
