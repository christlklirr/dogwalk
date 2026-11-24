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
    id: "greens",
    group: "layers",
    label: "Grünflächen",
    hint: "Alle Wiesen und Grünflächen der Stadt, auch die Höfe von Gemeindebauten und Genossenschaften. Immer sichtbar ab Zoomstufe 14 (Flächen-Mehrzweckkarte der Stadt Wien).",
    zoom: 14,
    on: true,
    fixed: true,
    // Legend only: the areas themselves are an image layer in environment.js.
    legendOnly: true,
    color: COLORS.green,
  },
  {
    id: "trees",
    group: "supplyLayers",
    label: "Baumstandorte",
    zoom: 15,
    info: "Nur die Bäume, die die Stadt Wien pflegt (an Straßen, in Parks). Auf anderen Grünflächen, etwa in Höfen von Wohnanlagen, kann es noch viele weitere Bäume geben. Erst ab Zoomstufe 15 sichtbar, weil es sonst zu viele wären.",
    color: COLORS.olive,
    wfs: "BAUMKATOGD",
  },
  {
    id: "bags",
    group: "supplyLayers",
    label: "Gackerlsackerl-Spender",
    zoom: 0,
    color: COLORS.bags,
    wfs: "HUNDESACKERLOGD",
  },
  {
    id: "water",
    group: "supplyLayers",
    label: "Trinkbrunnen und Hundetränken",
    zoom: 0,
    color: COLORS.water,
    wfs: "TRINKBRUNNENOGD",
  },
  {
    id: "bathing",
    group: "supplyLayers",
    label: "Badestellen",
    zoom: 0,
    color: COLORS.bathing,
    wfs: "BADESTELLENOGD",
  },
  {
    id: "walks",
    group: "positiveLayers",
    label: "Spazier- und Wanderwege",
    zoom: 0,
    info: "Spaziergänge und Stadtwanderwege der Stadt Wien, gut für längere Runden.",
    color: COLORS.orange,
    wfs: "SPAZIERLINIEOGD,ogdwien:WANDERWEGEOGD",
    weight: 4,
    noPointInfo: true,
  },
  {
    id: "wc",
    group: "optionalLayers",
    label: "Öffentliche WCs",
    zoom: 0,
    color: COLORS.violet,
    wfs: "WCANLAGE2OGD",
  },
  {
    id: "metro",
    group: "transitLayers",
    label: "U-Bahn",
    zoom: 0,
    color: COLORS.ubahn,
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
    icon: "tram",
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
    icon: "bus",
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
    icon: "nightbus",
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
    icon: "rail",
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
    group: "peopleLayers",
    label: "Menschenmengen",
    zoom: 0,
    info: "Wo oft viele Menschen sind. Rot leuchtend: tagsüber Geschäftsstraßen, Märkte, Sehenswürdigkeiten, Fußgängerzonen, abends Lokale mit vielen Schanigärten, dazu große U-Bahn-Stationen zum Umsteigen. Was gerade leuchtet, hängt von der Zeit ganz oben ab. Die kleinen gehenden Figuren erst ab Zoomstufe 16.",
    color: COLORS.crowdDay,
    badgeColor: COLORS.red,
    icon: "walkers",
    time: "crowdsDay",
    // Sights, hop-on-hop-off stops (two operators), pedestrian zones, shared-space streets and
    // shopping streets (a band along the street, from the city's structural plan) and markets.
    wfs: "SEHENSWUERDIGOGD,ogdwien:TOURISTIKHTSBIGOGD,ogdwien:TOURISTIKHTSVSLOGD,ogdwien:FUSSGEHERZONEOGD,ogdwien:BEGEGNUNGSZONEOGD,ogdwien:STRUKGESCHSTROGD,ogdwien:MARKTFLAECHEOGD,ogdwien:MARKTGEBIETOGD",
    // Places inside a dog-ban area do not matter for a dog walk.
    banFree: true,
  },
  {
    id: "evening",
    group: "peopleLayers",
    label: "Viel los abends",
    // No own switch: shown with "Menschenmengen".
    follows: "crowds",
    zoom: 0,
    color: COLORS.crowdEvening,
    icon: "walkers",
    time: "crowdsEvening",
    // Pavement cafés (Schanigärten): where many lie close together, the pavement glows.
    wfs: "SCHANIGARTENOGD",
  },
  {
    id: "hubs",
    group: "peopleLayers",
    label: "Große U-Bahn-Stationen",
    follows: "crowds",
    zoom: 0,
    color: COLORS.crowdDay,
    icon: "walkers",
    time: "hubs",
    // Large transfer stations (list HUBS below): a larger red glow.
    wfs: "UBAHNHALTOGD",
  },
  {
    id: "schools",
    group: "peopleLayers",
    time: "schools",
    label: "Schulen und Kindergärten",
    zoom: 0,
    info: "Vor allem morgens und zu Mittag sind hier viele Kinder und Eltern unterwegs.",
    color: COLORS.red,
    wfs: "SCHULEOGD,ogdwien:KINDERGARTENOGD",
  },
  {
    id: "play",
    group: "peopleLayers",
    time: "play",
    label: "Spielplätze",
    zoom: 0,
    color: COLORS.red,
    wfs: "SPIELPLATZPUNKTOGD",
  },
  {
    id: "works",
    group: "loudLayers",
    time: "works",
    label: "Baustellen",
    zoom: 0,
    info: "Baustellen auf Straßen (Stadt Wien, laufend aktualisiert) als dicke gestrichelte Linie, dazu große Baustellen von neuen Häusern als dunkle Fläche (OpenStreetMap). Lärm, Kräne, Maschinen, enge Gehwege.",
    // Dark grey like the noise map; the switch icon grey like the other noise switches.
    color: COLORS.noise,
    badgeColor: "#7d8689",
    icon: "works",
    wfs: "BAUSTELLENLINOGD,ogdwien:BAUSTELLENPKTOGD",
    // Thick and dashed, so roadworks look different from the public transport routes.
    weight: 5,
    dash: "6 4",
  },
];
// The city renamed TYP_TXT to BASIS_TYP_TXT in 2026; accept both.
function waterType(p) {
  return p.BASIS_TYP_TXT || p.TYP_TXT || "";
}
function noteFor(id, p) {
  const notes = {
    trees: "Kartierter Baumstandort.",
    bags: "Kartierter Spender · Füllstand unbekannt.",
    play: "Spielplatz · Geräusche und Nutzung können je nach Tageszeit wechseln.",
    metro: "U-Bahn-Station · kein Messwert für die aktuelle Personenfrequenz.",
    crowds:
      "Tagsüber oft viele Menschen: Sehenswürdigkeit, Sightseeing-Haltestelle, Fußgänger- oder Begegnungszone.",
    evening: "Viele Schanigärten nah beieinander · eher abends, März bis November.",
    bathing: "Badestelle an einem Gewässer.",
    walks: "Spaziergang oder Stadtwanderweg.",
    schools: "Schule oder Kindergarten · morgens und mittags viele Kinder.",
  };
  if (id === "works") {
    // End date like "2026-11-29Z" becomes "29.11.2026".
    const end = String(p.OBJEKT_ENDE || "").match(/^(\d{4})-(\d{2})-(\d{2})/),
      until = end ? +end[3] + "." + +end[2] + "." + end[1] : "";
    // First sentence of the city note, e.g. the working hours.
    // (Not after a number like "28. März"; long sentences are shortened.)
    // The city text sometimes glues words together ("DieArbeiten"): put the space back.
    let first = String(p.PRESSETEXT || "").replace(/\s+/g, " ").replace(/([a-zäöüß])([A-ZÄÖÜ])/g, "$1 $2").split(/(?<=[^\d\s]\.)\s(?=[A-ZÄÖÜ])/)[0].replace(/\.$/, "");
    if (first.length > 160) first = first.slice(0, 157).replace(/\s\S*$/, "") + " …";
    return (p.BEHINDERUNGSART || "Baustelle") + (until ? " · bis " + until : "") + (first ? ". " + first : "");
  }
  if (id === "wc") return "Öffentliches WC" + (p.OEFFNUNGSZEIT ? " · " + p.OEFFNUNGSZEIT : "");
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
// Large U-Bahn stations where people change between U-Bahn lines or to the railway. The city data
// lists only one line per station, so the list is kept by hand (names as in UBAHNHALTOGD).
const HUBS = new Set([
  "Karlsplatz", "Stephansplatz", "Schwedenplatz", "Praterstern", "Westbahnhof", "Längenfeldgasse",
  "Spittelau", "Volkstheater", "Schottenring", "Landstraße", "Südtiroler Platz - Hauptbahnhof",
  "Bahnhof Meidling", "Floridsdorf", "Heiligenstadt", "Hütteldorf", "Handelskai", "Stadlau",
]);
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
          // Only toilets that are open.
          if (spec.id === "wc") return p.AKTIV_TXT !== "NEIN";
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
              (spec.id === "wc" && f.properties.STRASSE && "WC " + f.properties.STRASSE) ||
              f.properties.BEZ_TEXT ||
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
      if (spec.id === "metro" || spec.id === "hubs") {
        const named = new Map(),
          routes = features.filter((f) => f.geometry.type !== "Point");
        for (const f of features.filter((f) => f.geometry.type === "Point")) {
          const name = f.properties.label;
          if (!named.has(name)) named.set(name, { f, lines: new Set() });
          if (f.properties.line) named.get(name).lines.add("U" + f.properties.line);
        }
        if (spec.id === "hubs")
          return [...named.values()]
            .filter(({ f }) => HUBS.has(f.properties.label))
            .map(({ f }) => ({
              ...f,
              properties: {
                label: f.properties.label,
                note: "Große Umsteigestation: oft viele Menschen, vor allem zu Stoßzeiten.",
                glow: true,
                radius: 75,
              },
            }));
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
      return features;
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
// Public transport, only while "Jetzt": link to the live list of disruptions of the Wiener Linien.
function liveInfo() {
  const p = document.createElement("p"),
    a = document.createElement("a");
  p.className = "live-info";
  a.href = "https://www.wienerlinien.at/betriebsinfo?future=false";
  a.target = "_blank";
  a.rel = "noopener";
  a.textContent = "Störungen und Einschränkungen jetzt";
  p.append(a, document.createElement("br"), "Live-Infos der Wiener Linien, z. B. Ausfälle, Umleitungen, Polizeieinsätze.");
  return p;
}
// Building sites from construction.json (made by tools/build-construction.cjs from OpenStreetMap).
// Sites that touch or lie close together (often several builders on one big plot) are grouped and
// get one sign together, from about 3000 m² in all.
let siteFile;
const NEAR = 40; // metres between two sites that still count as one place
function siteNote(site) {
  return (
    [site.name, site.operator, site.opening ? "fertig ab " + site.opening.slice(0, 4) : ""].filter(Boolean).join(" · ") +
    (site.name || site.operator || site.opening ? ". " : "") +
    "Großbaustelle: Lärm, Kräne, Lastwagen · OpenStreetMap"
  );
}
function loadSites() {
  siteFile ??= fetch("construction.json")
    .then((r) => (r.ok ? r.json() : { sites: [] }))
    .catch(() => ({ sites: [] }))
    .then(({ sites }) => {
      const areas = sites.map((site) => {
        const xs = site.ring.map((p) => p[0]),
          ys = site.ring.map((p) => p[1]);
        return {
          type: "Feature",
          geometry: { type: "Polygon", coordinates: [site.ring] },
          properties: { label: "Baustelle" + (site.kind ? ": " + site.kind : ""), note: siteNote(site), m2: site.m2 },
          box: [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)],
          site,
        };
      });
      // Group sites whose outlines come closer than NEAR; a group stays at most MAX across, so a
      // whole new district (like the Seestadt) still gets several signs.
      const dx = NEAR / 74000,
        dy = NEAR / 111000,
        MAX = 400;
      const metres = (p, q) => Math.hypot((p[0] - q[0]) * 74000, (p[1] - q[1]) * 111000);
      const close = (a, b) => a.site.ring.some((p) => b.site.ring.some((q) => metres(p, q) < NEAR));
      const parent = areas.map((_, i) => i);
      const box = areas.map((a) => a.box);
      const root = (i) => (parent[i] === i ? i : (parent[i] = root(parent[i])));
      areas.forEach((a, i) => {
        for (let j = i + 1; j < areas.length; j++) {
          const b = areas[j];
          if (a.box[0] - dx > b.box[2] || b.box[0] - dx > a.box[2]) continue;
          if (a.box[1] - dy > b.box[3] || b.box[1] - dy > a.box[3]) continue;
          const ri = root(i),
            rj = root(j);
          if (ri === rj || !close(a, b)) continue;
          const m = [
            Math.min(box[ri][0], box[rj][0]),
            Math.min(box[ri][1], box[rj][1]),
            Math.max(box[ri][2], box[rj][2]),
            Math.max(box[ri][3], box[rj][3]),
          ];
          if (metres([m[0], m[1]], [m[2], m[3]]) > MAX) continue;
          parent[rj] = ri;
          box[ri] = m;
        }
      });
      const groups = new Map();
      areas.forEach((a, i) => {
        const k = root(i);
        if (!groups.has(k)) groups.set(k, []);
        groups.get(k).push(a);
      });
      // One sign per group, in the middle of all its sites (weighted by size).
      const signs = [];
      for (const members of groups.values()) {
        const m2 = members.reduce((sum, a) => sum + a.site.m2, 0);
        if (m2 <= 3000) continue;
        let x = 0,
          y = 0;
        for (const a of members) {
          const r = a.site.ring;
          x += (r.reduce((s, p) => s + p[0], 0) / r.length) * a.site.m2;
          y += (r.reduce((s, p) => s + p[1], 0) / r.length) * a.site.m2;
        }
        const one = members.length === 1;
        const names = [...new Set(members.flatMap((a) => [a.site.name, a.site.operator]).filter(Boolean))].slice(0, 4);
        signs.push({
          type: "Feature",
          geometry: { type: "Point", coordinates: [x / m2, y / m2] },
          properties: one
            ? { ...members[0].properties }
            : {
                label: members.length + " Baustellen nebeneinander",
                note:
                  (names.length ? names.join(" · ") + ". " : "") +
                  "Großbaustelle, etwa " + Math.round(m2 / 1000) * 1000 + " m²: Lärm, Kräne, Lastwagen · OpenStreetMap",
              },
          box: members.reduce(
            (b, a) => [Math.min(b[0], a.box[0]), Math.min(b[1], a.box[1]), Math.max(b[2], a.box[2]), Math.max(b[3], a.box[3])],
            [180, 90, -180, -90],
          ),
        });
      }
      return { areas, signs };
    });
  return siteFile;
}
// The sites and signs that touch the visible part of the map.
async function buildingSites([w, s, e, n]) {
  const { areas, signs } = await loadSites();
  const inView = (f) => f.box[0] <= e && f.box[2] >= w && f.box[1] <= n && f.box[3] >= s;
  const plain = ({ type, geometry, properties }) => ({ type, geometry, properties });
  return [...areas.filter(inView).map(plain), ...signs.filter(inView).map(plain)];
}
// A point in the middle (by length) of a line, carrying the same label and note.
function middleSign(f) {
  const g = f.geometry;
  if (!["LineString", "MultiLineString"].includes(g.type)) return [];
  const pts = g.type === "LineString" ? g.coordinates : g.coordinates.flat();
  const step = (a, b) => Math.hypot((b[0] - a[0]) * 74000, (b[1] - a[1]) * 111000);
  let total = 0;
  for (let i = 1; i < pts.length; i++) total += step(pts[i - 1], pts[i]);
  let walked = 0;
  for (let i = 1; i < pts.length; i++) {
    const d = step(pts[i - 1], pts[i]);
    if (walked + d >= total / 2) {
      const t = d ? (total / 2 - walked) / d : 0;
      const at = [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * t, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * t];
      return [{ type: "Feature", geometry: { type: "Point", coordinates: at }, properties: { ...f.properties } }];
    }
    walked += d;
  }
  return [];
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
// Every layer that changes with the zoom explains it behind its info button.
const ZOOM_INFO = {
  metro: "Weiter draußen als kleine Punkte, ab Zoomstufe 14 mit den Linien-Kästchen in den Farben der Wiener Linien.",
};
const POINT_INFO = "Ab Zoomstufe 14 als Symbol, weiter draußen als kleiner Punkt.";
for (const spec of detailLayers) {
  if (spec.fixed || spec.id === "trees" || spec.types || spec.noPointInfo || spec.follows || spec.id === "crowds")
    continue;
  const zoomText = ZOOM_INFO[spec.id] || POINT_INFO;
  spec.info = spec.info ? spec.info + " " + zoomText : zoomText;
}
function setupDetails(map) {
  TimeNow.setup();
  const states = detailLayers.map((spec) => {
    const input = document.createElement("input"),
      status = document.createElement("small");
    input.type = "checkbox";
    input.dataset.layer = spec.id;
    input.checked = Boolean(spec.on);
    if (spec.follows) {
      // No row of its own.
    } else if (spec.fixed) {
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
      row.append(input, MapIcons.badge(spec.icon || spec.id, spec.badgeColor || spec.color), name, status);
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
  // Layers without an own switch follow their leader (evening crowds and large stations follow
  // "Menschenmengen").
  for (const state of states.filter((s) => s.spec.follows)) {
    const leader = states.find((s) => s.spec.id === state.spec.follows);
    leader.input.addEventListener("change", () => {
      state.input.checked = leader.input.checked;
      refresh(state);
    });
  }
  // A new time (now or planned) redraws what depends on it and updates the notes beside the switches.
  TimeNow.onChange(() => states.forEach(refresh));
  TimeNow.tags();
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
    // Crowds depend on the chosen time: quiet now = not drawn; the level is part of the key.
    const level = spec.time ? TimeNow.level(spec.time) : 2;
    const key =
      input.checked && map.getZoom() >= spec.zoom && level > 0
        ? areaKey + (spec.time ? "|" + level + "|" + TimeNow.slotKey() : "")
        : null;

    if (!key) {
      status.textContent =
        input.checked && map.getZoom() < spec.zoom ? "Beim Hineinzoomen ab Stufe " + spec.zoom : "";
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
      // Long roadworks get a clickable sign in their middle, like the ban areas; large building
      // sites (OpenStreetMap) are added as areas, the big ones with a sign too.
      if (spec.id === "works") {
        const sites = await buildingSites(coords);
        data = [...data, ...data.flatMap(middleSign), ...sites];
      }

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
                  weight: spec.id === "metro" ? 4 : spec.weight || 2.5,
                  dashArray: spec.dash,
                  opacity: 0.85,
                }
              : spec.id === "crowds"
              ? // Pedestrian and shared-space zones: a soft red area.
                { stroke: false, fillColor: COLORS.crowdDay, fillOpacity: 0.28 }
              : style,
        pointToLayer: (f, ll) => {
          // Overlapping soft red circles: the more cafés, the stronger the glow on the pavement.
          if (f.properties.glow)
            return L.circle(ll, {
              radius: f.properties.radius || 30,
              stroke: false,
              fillColor: spec.color,
              fillOpacity: (spec.id === "evening" ? 0.2 : 0.22) * (level === 1 ? 0.5 : 1),
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
              // U-Bahn dots in the colour of their line.
              fillColor:
                (spec.id === "metro" && COLORS.metro[String(f.properties.lines?.[0] || "").slice(1)]) || spec.color,
              fillOpacity: 1,
            });
          return MapIcons.marker(ll, key, spec.color, f.properties.label);
        },
        onEachFeature: (f, layer) => {
          // Built when opened, so the live link follows the current "Jetzt" / "Zeitpunkt" choice.
          layer.bindPopup(() => {
            const box = document.createElement("div"),
              title = document.createElement("strong"),
              note = document.createElement("p");
            title.textContent = f.properties.label;
            note.textContent = f.properties.note;
            box.append(title, note);
            if (spec.group === "transitLayers" && spec.id !== "terminals" && TimeNow.isNow()) box.append(liveInfo());
            return box;
          });
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
