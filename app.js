"use strict";
const byId = (id) => document.getElementById(id);
let statusTimer;

function notify(message) {
  const box = byId("status");
  box.textContent = message;
  box.hidden = false;
  clearTimeout(statusTimer);
  statusTimer = setTimeout(() => (box.hidden = true), 9000);
}
const dialog = byId("sources");
byId("info").onclick = () => dialog.showModal();
dialog.querySelector("button").onclick = () => dialog.close();
const layers = [
  {
    key: "dogs",
    label: "Hundezonen",
    hint: "Auslauf und Hundewiesen",
    icon: "🐾",
    ink: "#1a81a1",
    pale: "#ddf6de",
    on: true,
  },
  {
    key: "parks",
    label: "Öffentliche Grünflächen",
    hint: "Parks und Grünanlagen",
    icon: "♧",
    ink: "#3c8d40",
    pale: "#dfebd4",
    on: true,
  },
  {
    key: "bans",
    label: "Hundeverbotszonen",
    hint: "Gemeldete Einschränkungen",
    icon: "⊘",
    ink: "#a44940",
    pale: "#f7dfd7",
    on: true,
  },
  {
    key: "housing",
    label: "Gemeindebauten",
    hint: "Wohnanlagen und Standorte",
    icon: "⌂",
    ink: "#596683",
    pale: "#e3e7ef",
    on: false,
  },
];
function symbol(config) {
  return config.key === "parks" ? MapIcons.swatch("parks") : MapIcons.badge(config.key, config.ink);
}
function description(label, hint) {
  const el = document.createElement("span");
  const strong = document.createElement("strong");
  strong.textContent = label;
  const sub = document.createElement("small");
  sub.textContent = hint;
  el.append(strong, sub);
  return el;
}
// Place the paw on an interior span, also for concave zones or polygons with holes.
function pawPosition(shape) {
  const g = shape.feature.geometry;
  if (g.type === "Point") return L.latLng(g.coordinates[1], g.coordinates[0]);
  if (g.type === "MultiPoint") return L.latLng(g.coordinates[0][1], g.coordinates[0][0]);
  let best = null,
    width = 0;
  for (const rings of g.type === "Polygon"
    ? [g.coordinates]
    : g.type === "MultiPolygon"
      ? g.coordinates
      : []) {
    let bottom = Infinity,
      top = -Infinity;
    for (const [, y] of rings[0]) {
      bottom = Math.min(bottom, y);
      top = Math.max(top, y);
    }
    for (const fraction of [0.5, 0.25, 0.75]) {
      const y = bottom + (top - bottom) * fraction,
        hits = [];
      for (const ring of rings)
        for (let i = 1; i < ring.length; i++) {
          const [a, b] = [ring[i - 1], ring[i]];
          if (a[1] > y !== b[1] > y) hits.push(a[0] + ((y - a[1]) * (b[0] - a[0])) / (b[1] - a[1]));
        }
      hits.sort((a, b) => a - b);
      for (let i = 1; i < hits.length; i += 2)
        if (hits[i] - hits[i - 1] > width) {
          width = hits[i] - hits[i - 1];
          best = L.latLng(y, (hits[i] + hits[i - 1]) / 2);
        }
    }
  }
  return best;
}
async function start() {
  if (!window.L) {
    byId("gps").disabled = true;
    byId("map").textContent =
      "Die Kartenbibliothek konnte nicht geladen werden. Bitte Internetverbindung prüfen und die Seite neu laden.";
    return;
  }
  const map = L.map("map", { zoomControl: false, preferCanvas: true }).setView(
    [48.1511, 16.3163],
    15,
  );
  map.createPane("dogZones").style.zIndex = 450;
  L.control.zoom({ position: "bottomright" }).addTo(map);
  L.control.scale({ imperial: false, position: "bottomleft" }).addTo(map);
  map.attributionControl.setPrefix(false);
  map.attributionControl.addAttribution(
    'Datenquelle: <a href="https://data.wien.gv.at/">Stadt Wien – data.wien.gv.at</a>',
  );
  const tiles = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);
  let tileWarned = false;
  tiles.on("tileerror", () => {
    if (!tileWarned) {
      tileWarned = true;
      notify("Hintergrundkarte teilweise nicht verfügbar. Bitte Verbindung prüfen.");
    }
  });

  let position;
  byId("gps").onclick = () => {
    if (!navigator.geolocation)
      return notify("GPS ist hier nicht verfügbar. Verschiebe die Karte mit dem Finger.");
    const btn = byId("gps");
    btn.disabled = true;
    btn.textContent = "Standort wird gesucht …";
    function reset() {
      btn.disabled = false;
      btn.textContent = "◎   Mein Standort";
    }
    navigator.geolocation.getCurrentPosition(
      (p) => {
        reset();
        const ll = L.latLng(p.coords.latitude, p.coords.longitude);
        if (position) position.remove();
        position = MapIcons.marker(ll, "gps", "#285fb2", "Dein Standort")
          .addTo(map)
          .bindTooltip("Dein Standort");
        map.setView(ll, 16);
        notify("Standort gefunden · GPS-Genauigkeit ca. " + Math.round(p.coords.accuracy) + " m");
      },
      () => {
        reset();
        notify("Kein GPS-Standort verfügbar. Du kannst die Karte mit dem Finger verschieben.");
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 },
    );
  };
  function orderOverlays() {
    for (const key of ["dogs", "bans"]) {
      const layer = layers.find((item) => item.key === key);
      if (layer.on) layer.group?.bringToFront();
    }
  }
  async function update(config, small) {
    let bbox;
    if (["dogs", "parks"].includes(config.key) && config.on) {
      const b = map.getBounds();
      bbox = DogData.region(b.getWest(), b.getSouth(), b.getEast(), b.getNorth());
      const area = bbox.join(",");
      if (area !== config.area) {
        config.area = area;
        config.request = undefined;
        config.busy = false;
        config.group?.remove();
        config.group = null;
      }
    }
    if (config.group) {
      if (config.on) config.group.addTo(map);
      else config.group.remove();
      orderOverlays();
      return;
    }
    if (!config.on || config.busy) return;
    const token = Symbol();
    config.request = token;
    config.busy = true;
    small.textContent = "Daten werden geladen …";
    try {
      const data = await DogData.load(config.key, bbox);
      if (config.request !== token) return;
      const pane = config.key === "dogs" ? "dogZones" : "overlayPane";
      // Green areas are drawn as SVG so they can use the hatch pattern.
      if (config.key === "parks") {
        MapIcons.ensurePatterns();
        config.renderer ??= L.svg({ pane });
      }
      const style = {
        pane,
        dashArray: config.key === "dogs" ? "7 4" : undefined,
        color: config.ink,
        stroke: config.key !== "parks",
        weight: config.key === "dogs" ? 4 : 2,
        fillColor:
          config.key === "dogs" ? "#d0eff2" : config.key === "parks" ? "url(#parkHatch)" : config.ink,
        fillOpacity:
          config.key === "dogs" || config.key === "parks" ? 1 : config.key === "bans" ? 0.5 : 0.28,
      };
      config.group = L.geoJSON(data, {
        pane,
        renderer: config.renderer,
        style,
        pointToLayer: (f, ll) =>
          MapIcons.marker(ll, config.key, config.ink, f.properties.name || config.label),
        onEachFeature: (f, s) => {
          const details = document.createElement("div");
          details.append(description(f.properties.name || config.label, config.label));
          const p = document.createElement("p");
          p.textContent = {
            parks: "Hundezugang und Lösemöglichkeit separat prüfen.",
            housing: "Durchgang und Zugangsrechte ungeprüft.",
            bans: ["Point", "MultiPoint"].includes(f.geometry.type)
              ? "Gemeldeter Verbotsstandort. Die genaue Ausdehnung ist unbekannt."
              : "Der rote Umriss zeigt die erfasste Verbotsfläche.",
            dogs:
              "Einfriedung: " +
              (f.properties.fenced === true
                ? "ja"
                : f.properties.fenced === false
                  ? "nein"
                  : "unbekannt"),
          }[config.key];
          details.append(p);
          s.bindPopup(details);
        },
      });
      if (config.key === "dogs") {
        const paws = L.layerGroup();
        const placed = [];
        config.group.eachLayer((shape) => {
          if (["Point", "MultiPoint"].includes(shape.feature.geometry.type)) return;
          const position = pawPosition(shape);
          if (!position) return;
          if (shape.feature.properties.osm && placed.some((p) => p.distanceTo(position) < 30))
            return;
          placed.push(position);
          const name = shape.feature.properties.name || "Hundezone";
          const marker = MapIcons.marker(position, "dogs", config.ink, "Hundezone: " + name);
          marker.bindPopup(shape.getPopup().getContent().cloneNode(true)).addTo(paws);
          marker.on("add", () =>
            marker.getElement()?.setAttribute("aria-label", "Hundezone: " + name),
          );
        });
        config.group.on("add", () => paws.addTo(map));
        config.group.on("remove", () => paws.remove());
      }
      small.textContent = data.sourceLabel || config.hint;
      if (config.on) config.group.addTo(map);
      orderOverlays();
    } catch {
      if (config.request !== token) return;
      if (config.retry) {
        config.retry.hidden = false;
        small.textContent = config.label + " nicht verfügbar";
        return;
      }
      small.textContent = "Laden fehlgeschlagen · aus/ein für neuen Versuch";
    } finally {
      if (config.request === token) {
        config.busy = false;
      }
    }
  }
  for (const config of layers) {
    const fixed = ["dogs", "parks", "bans"].includes(config.key);
    const row = document.createElement(fixed ? "details" : "label");
    const heading = document.createElement(fixed ? "summary" : "span");
    heading.append(symbol(config), document.createTextNode(config.label));
    row.className = fixed ? "legend-entry" : "layer";
    if (!fixed) {
      const toggle = document.createElement("input");
      toggle.type = "checkbox";
      toggle.checked = config.on;
      toggle.onchange = () => {
        config.on = toggle.checked;
        update(config, config.status);
      };
      row.append(toggle);
    }
    const info = document.createElement("small");
    info.textContent = config.hint;
    row.append(heading, info);
    const status = document.createElement("small");
    row.append(status);
    config.status = status;
    if (fixed) {
      const retry = document.createElement("button");
      retry.textContent = "Erneut laden";
      retry.hidden = true;

      retry.onclick = () => {
        retry.hidden = true;
        config.busy = false;
        config.request = undefined;
        update(config, status);
      };

      row.append(retry);
      config.retry = retry;
    }
    byId(fixed ? "layers" : "optionalLayers").append(row);
    update(config, status);
  }
  // Icon size steps follow the zoom: up to 14 small, 15–16 normal, from 17 large.
  function scaleIcons() {
    const z = map.getZoom(),
      box = map.getContainer();
    box.classList.toggle("icons-small", z <= 14);
    box.classList.toggle("icons-large", z >= 17);
  }
  map.on("zoomend", scaleIcons);
  scaleIcons();
  map.on("moveend", () => {
    for (const c of layers.filter((c) => ["dogs", "parks"].includes(c.key) && c.on))
      update(c, c.status);
  });
  setupEnvironment(map);
  setupDetails(map);
}
start().catch(() =>
  notify("Die Karte konnte nicht vollständig gestartet werden. Bitte Seite neu laden."),
);
if ("serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js").catch(() => {});
