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
    ink: "#e6870b",
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
    ink: "#b4473f",
    pale: "#f7dfd7",
    on: false,
  },
  {
    key: "housing",
    label: "Gemeindebauten",
    hint: "Wohnanlagen und Standorte",
    icon: "⌂",
    ink: "#1a81a1",
    pale: "#e3e7ef",
    on: false,
  },
];
function symbol(config) {
  return config.key === "parks"
    ? MapIcons.swatch(config.key)
    : MapIcons.badge(config.key, config.ink);
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
  map.createPane("dogPaws").style.zIndex = 455;
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
      const style = {
        pane,
        color: config.ink,
        // Dog zones, green areas and council housing are plain areas without an outline.
        stroke: !["parks", "dogs", "housing"].includes(config.key),
        weight: 2,
        fillColor:
          config.key === "dogs"
            ? "#e6870b"
            : config.key === "parks"
              ? MapIcons.parkLines()
              : config.key === "housing"
                ? "#a9d3de"
                : config.ink,
        fillOpacity: ["parks", "housing"].includes(config.key)
          ? 1
          : config.key === "dogs" || config.key === "bans"
            ? 0.5
            : 0.28,
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
      // One white paw in the middle of every dog zone.
      if (config.key === "dogs") {
        const paws = L.layerGroup();
        config.group.eachLayer((shape) => {
          if (["Point", "MultiPoint"].includes(shape.feature.geometry.type)) return;
          const position = pawPosition(shape);
          if (!position) return;
          const name = shape.feature.properties.name || "Hundezone";
          MapIcons.paw(position, "Hundezone: " + name)
            .bindPopup(shape.getPopup().getContent().cloneNode(true))
            .addTo(paws);
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
    const fixed = config.key === "parks";
    const row = document.createElement(fixed ? "details" : "label");
    const status = document.createElement("small");
    if (fixed) {
      const heading = document.createElement("summary");
      heading.append(symbol(config), document.createTextNode(config.label));
      row.className = "legend-entry";
      const info = document.createElement("small");
      info.textContent = config.hint;
      row.append(heading, info);
    } else {
      // Optional layers look like the other switches: checkbox, icon, name, status.
      const toggle = document.createElement("input"),
        name = document.createElement("span");
      toggle.type = "checkbox";
      toggle.checked = config.on;
      toggle.onchange = () => {
        config.on = toggle.checked;
        update(config, config.status);
      };
      name.textContent = config.label;
      row.className = "map-option";
      row.append(toggle, symbol(config), name);
    }
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
    byId(
      fixed ? "layers" : ["dogs", "bans"].includes(config.key) ? "dogLayers" : "positiveLayers",
    ).append(row);
    update(config, status);
  }
  // Icon size steps follow the zoom: up to 14 small, 15–16 normal, from 17 large.
  function scaleIcons() {
    const z = map.getZoom(),
      box = map.getContainer();
    box.classList.toggle("icons-small", z <= 14);
    box.classList.toggle("icons-large", z >= 17);
    box.dataset.zoom = z;
  }
  map.on("zoomend", scaleIcons);
  scaleIcons();
  map.on("moveend", () => {
    for (const c of layers.filter((c) => ["dogs", "parks"].includes(c.key) && c.on))
      update(c, c.status);
  });
  setupEnvironment(map);
  setupDetails(map);
  // Address search: the City of Vienna's free address service, the map jumps to the first hit.
  let found = null;
  byId("search").onsubmit = async (event) => {
    event.preventDefault();
    const text = byId("searchText").value.trim();
    if (!text) return;
    try {
      const url = new URL("https://data.wien.gv.at/daten/OGDAddressService.svc/GetAddressInfo");
      url.search = new URLSearchParams({ Address: text, crs: "EPSG:4326" });
      const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
      const hit = (await response.json()).features?.[0];
      if (!hit) return notify("Nichts gefunden. Bitte Straße und Hausnummer prüfen.");
      const [lon, lat] = hit.geometry.coordinates;
      const name = hit.properties.Adresse || text;
      found?.remove();
      found = MapIcons.marker([lat, lon], "gps", "#e6870b", name).addTo(map).bindPopup(name);
      map.setView([lat, lon], 17);
      notify(name + (hit.properties.PostalCode ? ", " + hit.properties.PostalCode + " Wien" : ""));
    } catch {
      notify("Die Adresssuche ist gerade nicht erreichbar.");
    }
  };
  // One button per group switches all its layers on or off.
  for (const button of document.querySelectorAll(".all-toggle")) {
    const group = button.closest("details");
    const boxes = () =>
      [...group.querySelectorAll('input[type="checkbox"]')].filter(
        (box) => !box.closest("[hidden]") && box.style.visibility !== "hidden",
      );
    const label = () =>
      (button.textContent = boxes().every((box) => box.checked)
        ? "Alle ausblenden"
        : "Alle einblenden");
    button.onclick = () => {
      const on = !boxes().every((box) => box.checked);
      for (const box of boxes())
        if (box.checked !== on) {
          box.checked = on;
          box.dispatchEvent(new Event("change"));
        }
      label();
    };
    group.addEventListener("change", label);
    label();
  }
}
start().catch(() =>
  notify("Die Karte konnte nicht vollständig gestartet werden. Bitte Seite neu laden."),
);
if ("serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js").catch(() => {});
