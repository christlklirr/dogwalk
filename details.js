"use strict";

// Each row defines one switch, its visual style and its minimum zoom.
const detailLayers = [
  {
    id: "nearpaths",
    group: "layers",
    label: "Fußwege",
    hint: "Gehwege aus OpenStreetMap, petrol gestrichelt. Zugang mit Hund vor Ort prüfen.",
    zoom: 14,
    on: true,
    fixed: true,
    color: "#1a81a1",
  },
  {
    id: "trees",
    group: "layers",
    label: "Baumstandorte",
    hint: "Baumkataster der Stadt Wien. Sichtbar ab Zoomstufe 15.",
    zoom: 15,
    on: true,
    fixed: true,
    color: "#1a81a1",
    wfs: "BAUMKATOGD",
  },
  {
    id: "bags",
    group: "supplyLayers",
    label: "Gackerlsackerl-Spender",
    zoom: 17,
    on: true,
    color: "#1a81a1",
    wfs: "HUNDESACKERLOGD",
  },
  {
    id: "water",
    group: "supplyLayers",
    label: "Trinkbrunnen und Hundetränken",
    zoom: 17,
    on: true,
    color: "#126c89",
    wfs: "TRINKBRUNNENOGD",
  },
  {
    id: "play",
    group: "soundLayers",
    label: "Spielplätze",
    zoom: 15,
    on: true,
    color: "#78499b",
    wfs: "SPIELPLATZPUNKTOGD",
  },
  {
    id: "churches",
    group: "soundLayers",
    label: "Kirchen und Moscheen",
    zoom: 14,
    color: "#76428b",
    wfs: "RELIGIONOGD",
    osm: 'nwr["amenity"="place_of_worship"]["religion"~"^(christian|muslim)$"]',
  },
  {
    id: "metro",
    group: "soundLayers",
    label: "U-Bahn-Stationen",
    zoom: 14,
    color: "#67518a",
    wfs: "UBAHNHALTOGD",
    osm: 'nwr["railway"="station"]["station"="subway"]',
  },
  {
    id: "markets",
    group: "optionalLayers",
    label: "Märkte",
    zoom: 14,
    color: "#a24c00",
    wfs: "MARKTFLAECHEOGD",
    osm: 'nwr["amenity"="marketplace"]',
  },
  {
    id: "police",
    group: "optionalLayers",
    label: "Polizei · bis 100 m je Straßenrichtung",
    zoom: 15,
    color: "#1a81a1",
    wfs: "POLIZEIOGD",
    osm: 'nwr["amenity"="police"]',
  },
];
function noteFor(id, p) {
  const notes = {
    trees: "Kartierter Baumstandort.",
    bags: "Kartierter Spender · Füllstand unbekannt.",
    churches: "Kirche oder Moschee. Glocken, Gebetszeiten und Besucherandrang ungeprüft.",
    markets: "Marktstandort · Öffnungszeiten vor Ort prüfen.",
    police: "Stationsstandort. Straßenbereich nur bei zuordenbarem Straßenverlauf.",
    play: "Spielplatz · Geräusche und Nutzung können je nach Tageszeit wechseln.",
    metro: "U-Bahn-Station · kein Messwert für die aktuelle Personenfrequenz.",
  };
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
      console.error("Fehler bei Kartenebene:", spec.id, error);

      if (state.controller === controller && state.key === key) {
        state.key = null;
        status.textContent = "Fehler bei " + spec.label + ": " + error.message;
      }
    }
  }
  const [w, s, e, n] = bounds;
  if (spec.id === "nearpaths") {
    const padY = 32 / 111195,
      padX = padY / Math.cos(((s + n) * Math.PI) / 360);
    const box = [s - padY, w - padX, n + padY, e + padX].join(",");
    return overpass(
      '[out:json][timeout:20];way["highway"~"^(footway|path|pedestrian|steps)$"]["area"!="yes"](' +
        box +
        ");out geom;",
      signal,
    );
  }
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
async function addRoads(stations, group, bounds, signal) {
  if (!stations.length) return;
  const [w, s, e, n] = bounds;
  const roadBox = [s - 0.002, w - 0.003, n + 0.002, e + 0.003];
  const roads = await overpass(
    '[out:json][timeout:10];way["highway"~"^(living_street|residential|unclassified|tertiary|secondary|primary|service)$"]["area"!="yes"]["tunnel"!="yes"](' +
      roadBox +
      ");out geom;",
    signal,
  );
  for (const f of stations.filter((f) => f.geometry.type === "Point")) {
    const [lon, lat] = f.geometry.coordinates;
    for (const line of policeCorridor(
      { lat, lon, street: f.properties.street },
      roads.filter((r) => !["no", "private"].includes(r.tags?.access)),
    )) {
      L.polyline(line, { color: "#1a81a1", weight: 9, opacity: 0.5 })
        .bindTooltip("Orientierungsbereich · bis zu 100 m je Richtung")
        .addTo(group);
    }
  }
}

function setupDetails(map) {
  const states = detailLayers.map((spec) => {
    const input = document.createElement("input"),
      status = document.createElement("small");
    input.type = "checkbox";
    input.checked = Boolean(spec.on);
    if (spec.fixed) {
      // Always shown: a legend entry without switch, like Hundezonen.
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
    return state;
  });
  async function refresh(state) {
    const { spec, status, input } = state,
      b = map.getBounds().pad(0.08);
    const coords = [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()].map((v) =>
      Number(v.toFixed(5)),
    );
    const areaKey = coords.join(",");
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

      if (state.controller !== controller || state.key !== key) return;

      if (spec.id === "nearpaths") {
        data = getFootpaths(data);
      }

      const style = {
        color: spec.color,
        weight: spec.id === "police" ? 9 : 2,
        opacity: spec.id === "police" ? 0.55 : 0.9,
        fillOpacity: 0.18,
      };
      state.group = L.geoJSON(data, {
        style: (f) =>
          spec.id === "nearpaths"
            ? {
                color: "#1a81a1",
                weight: 4,
                opacity: 1,
                dashArray: "6 4",
              }
            : style,
        pointToLayer: (f, ll) => {
          if (spec.id === "trees")
            return L.circleMarker(ll, {
              radius: { 15: 2.5, 16: 3.5, 17: 6, 18: 9 }[map.getZoom()] ?? 12,
              stroke: false,
              fillColor: spec.color,
              fillOpacity: 1,
            });
          const key =
            spec.id === "water" && f.properties.note.startsWith("Mit Hundetränke")
              ? "trough"
              : spec.id;
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
      if (spec.id === "police" && data.length) {
        const group = state.group;
        addRoads(
          data,
          group,
          coords,
          AbortSignal.any([controller.signal, AbortSignal.timeout(12000)]),
        ).catch(() => {
          if (state.group === group)
            status.textContent = "Stationen geladen · Straßenlinien nicht verfügbar.";
        });
      }
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
