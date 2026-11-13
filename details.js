"use strict";

// Each row defines one switch, its visual style and its minimum zoom.
const detailLayers = [
  {
    id: "nearpaths",
    group: "layers",
    label: "Fußwege",
    hint: "Rot gestrichelt in der Grundkarte (OpenStreetMap). Zugang mit Hund vor Ort prüfen.",
    zoom: 14,
    on: true,
    fixed: true,
    // Legend only: the extra footpath layer stays off until the OSM servers answer reliably.
    legendOnly: true,
    color: COLORS.petrol,
  },
  {
    id: "trees",
    group: "layers",
    label: "Baumstandorte",
    hint: "Baumkataster der Stadt Wien. Sichtbar ab Zoomstufe 15.",
    zoom: 15,
    on: true,
    fixed: true,
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
    group: "soundLayers",
    label: "U-Bahn-Stationen",
    zoom: 0,
    color: COLORS.red,
    wfs: "UBAHNHALTOGD",
    osm: 'nwr["railway"="station"]["station"="subway"]',
  },
  {
    id: "crowds",
    group: "soundLayers",
    label: "Menschenmengen",
    zoom: 0,
    color: COLORS.red,
    // Sights, hop-on-hop-off stops (two operators), pedestrian zones and shared-space streets (City of Vienna).
    wfs: "SEHENSWUERDIGOGD,ogdwien:TOURISTIKHTSBIGOGD,ogdwien:TOURISTIKHTSVSLOGD,ogdwien:FUSSGEHERZONEOGD,ogdwien:BEGEGNUNGSZONEOGD",
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
function noteFor(id, p) {
  const notes = {
    trees: "Kartierter Baumstandort.",
    bags: "Kartierter Spender · Füllstand unbekannt.",
    churches: "Kirche oder Moschee. Glocken, Gebetszeiten und Besucherandrang ungeprüft.",
    markets: "Markt oder Marktplatz · Öffnungszeiten vor Ort prüfen.",
    police: "Polizeistation.",
    play: "Spielplatz · Geräusche und Nutzung können je nach Tageszeit wechseln.",
    metro: "U-Bahn-Station · kein Messwert für die aktuelle Personenfrequenz.",
    crowds:
      "Oft viele Menschen: Sehenswürdigkeit, Sightseeing-Haltestelle, Fußgänger- oder Begegnungszone.",
  };
  if (id === "markets" && p.MARKTZEITEN_VERKAUF)
    return "Marktzeiten: " + p.MARKTZEITEN_VERKAUF;
  if (id === "water")
    return [2, 5, 17, 18].includes(Number(p.TYP_NUM)) || /hund|tränke/i.test(p.TYP_TXT || "")
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
async function loadDetails(spec, bounds, signal) {
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
          if (spec.id === "water")
            return (
              [2, 4, 5, 10, 14, 17, 18].includes(Number(p.TYP_NUM)) ||
              /trink|tränke/i.test(p.TYP_TXT || "")
            );
          if (spec.id === "churches")
            return ["Kirche/Kapelle", "Moschee"].includes(p.TYP);
          return true;
        })
        .map((f) => ({
          ...f,
          properties: {
            line: f.properties.LINFO,
            label:
              f.properties.HTXT ||
              f.properties.ANL_NAME ||
              f.properties.GATTUNG_ART ||
              f.properties.NAME ||
              f.properties.MARKT_TXT ||
              f.properties.STAT_NAME ||
              f.properties.BEZEICHNUNG ||
              f.properties.ADRESSE ||
              spec.label,
            note: noteFor(spec.id, f.properties) + " · Stadt Wien",
            street:
              f.properties.STRASSE ||
              f.properties.ADRESSE?.replace(/^\d+\.,\s*/, "").replace(/\s+\d.*$/, ""),
          },
        }));
      if (spec.id === "metro") {
        const named = new Map();
        for (const f of features) {
          const name = f.properties.label;
          if (!named.has(name)) named.set(name, { f, lines: new Set() });
          if (f.properties.line) named.get(name).lines.add("U" + f.properties.line);
        }
        return [...named.values()].map(({ f, lines }) => {
          f.properties.note =
            (lines.size > 1 ? "Umstieg zwischen " : "Linie ") +
            [...lines].join(", ") +
            ". Personenfrequenz unbekannt.";
          return f;
        });
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
function setupDetails(map) {
  const states = detailLayers.map((spec) => {
    const input = document.createElement("input"),
      status = document.createElement("small");
    input.type = "checkbox";
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
      row.append(input, MapIcons.badge(spec.id, spec.color), name, status);
      document.getElementById(spec.group).append(row);
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
      const data = await loadDetails(spec, coords, controller.signal);

      if (state.controller !== controller || state.key !== key) return;

      const style = {
        color: spec.color,
        weight: spec.id === "police" ? 9 : 2,
        opacity: spec.id === "police" ? 0.55 : 0.9,
        fillOpacity: 0.18,
      };
      state.group = L.geoJSON(data, {
        // Points keep the look they get in pointToLayer; the area style would make them see-through.
        style: (f) =>
          ["Point", "MultiPoint"].includes(f.geometry.type)
            ? {}
            : spec.id === "crowds"
              ? // Pedestrian and shared-space zones: a soft red area, like the glow around crowd icons.
                { stroke: false, fillColor: COLORS.crowdArea, fillOpacity: 0.35 }
              : style,
        pointToLayer: (f, ll) => {
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
              : spec.id;
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
      status.textContent = data.length ? "" : "Keine Einträge im geladenen Ausschnitt.";
    } catch {
      if (state.controller === controller && state.key === key) {
        state.key = null;
        if (spec.fixed) {
          status.textContent = "Gerade nicht verfügbar · neuer Versuch in 30 s";
          clearTimeout(state.retry);
          state.retry = setTimeout(() => refresh(state), 30000);
        } else status.textContent = "Daten fehlen · aus/ein zum Wiederholen";
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
