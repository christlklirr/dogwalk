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
byId("appVersion").textContent = "Wiener Pfotenwege · V" + self.APP_VERSION;
// Feedback goes to a Notion form (the Feedback database). The button shows once the link is set.
const FEEDBACK_URL = "https://app.notion.com/p/a794696cb0074c4597e9c3fe68a01020?pvs=106";
if (FEEDBACK_URL) {
  byId("feedback").href = FEEDBACK_URL;
  byId("feedback").hidden = false;
}
const dialog = byId("sources");
byId("info").onclick = () => dialog.showModal();
dialog.querySelector("button").onclick = () => dialog.close();
const layers = [
  {
    key: "dogs",
    label: "Hundezonen",
    hint: "Auslauf und Hundewiesen",
    ink: COLORS.orange,
    on: false,
  },
  {
    key: "bans",
    label: "Hundeverbotszonen",
    hint: "Parks, Gärten und Friedhöfe ohne Hunde (Stadt Wien, Bundesgärten). Verbotszeichen ab Zoomstufe 15, weiter draußen als rote Punkte.",
    ink: COLORS.red,
    // Always shown, like the green areas: a park must never look open when dogs are banned.
    on: true,
  },
];
function symbol(config) {
  return MapIcons.badge(config.key, config.ink);
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
  // City boundary of Vienna: a strong petrol line, and everything outside Vienna softly
  // tinted petrol, so the eye stays on the city.
  fetch(
    "https://data.wien.gv.at/daten/geo?service=WFS&version=1.0.0&request=GetFeature" +
      "&typeName=ogdwien:LANDESGRENZEOGD&srsName=EPSG:4326&outputFormat=json",
  )
    .then((response) => response.json())
    .then((data) => {
      const rings = data.features.flatMap(({ geometry: g }) =>
        g.type === "Polygon"
          ? [g.coordinates[0]]
          : g.type === "MultiPolygon"
            ? g.coordinates.map((p) => p[0])
            : g.type === "LineString"
              ? [g.coordinates]
              : g.type === "MultiLineString"
                ? g.coordinates
                : [],
      );
      const toLatLng = (ring) => ring.map(([x, y]) => [y, x]);
      const world = [
        [85, -180],
        [85, 180],
        [-85, 180],
        [-85, -180],
      ];
      L.polygon([world, ...rings.map(toLatLng)], {
        stroke: false,
        fillColor: COLORS.petrol,
        fillOpacity: 0.3,
        interactive: false,
      }).addTo(map);
      L.polyline(rings.map(toLatLng), {
        color: COLORS.petrol,
        weight: 8,
        opacity: 0.7,
        interactive: false,
      }).addTo(map);
    })
    .catch((e) => console.warn("Stadtgrenze", e));
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
        position = MapIcons.marker(ll, "gps", COLORS.gps, "Dein Standort")
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
    if (config.key === "dogs" && config.on) {
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
        // All areas are plain, without an outline.
        stroke: false,
        fillColor:
          config.key === "dogs"
            ? COLORS.orange
            : config.key === "bans"
              ? MapIcons.banLines()
              : config.ink,
        fillOpacity: config.key === "dogs" ? 0.5 : config.key === "bans" ? 1 : 0.28,
      };
      config.group = L.geoJSON(data, {
        pane,
        style,
        pointToLayer: (f, ll) =>
          MapIcons.marker(ll, config.key, config.ink, f.properties.name || config.label),
        onEachFeature: (f, s) => {
          const details = document.createElement("div");
          details.append(description(f.properties.name || config.label, config.label));
          const p = document.createElement("p");
          p.textContent = {
            bans: f.properties.note
              ? f.properties.note
              : ["Point", "MultiPoint"].includes(f.geometry.type)
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
      // One sign in the middle of every area: orange paw for dog zones, the same ban sign
      // as the single ban points for ban areas.
      if (config.key === "dogs" || config.key === "bans") {
        const paws = L.layerGroup();
        config.group.eachLayer((shape) => {
          if (["Point", "MultiPoint"].includes(shape.feature.geometry.type)) return;
          const position = pawPosition(shape);
          if (!position) return;
          const name = shape.feature.properties.name || config.label;
          (config.key === "dogs"
            ? MapIcons.paw(position, "Hundezone: " + name)
            : MapIcons.marker(position, "bans", config.ink, "Hundeverbot: " + name, "dogPaws")
          )
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
      if (config.retry) config.retry.hidden = false;
      // The city's map service is down now and then: try again by itself after 30 seconds.
      small.textContent = "Stadt Wien antwortet gerade nicht · neuer Versuch in 30 s";
      clearTimeout(config.again);
      config.again = setTimeout(() => {
        if (config.request !== token || !config.on) return;
        config.request = undefined;
        config.busy = false;
        update(config, small);
      }, 30000);
    } finally {
      if (config.request === token) {
        config.busy = false;
      }
    }
  }
  for (const config of layers) {
    const fixed = config.key === "bans";
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
      toggle.dataset.layer = config.key;
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
    // Zoomed out, ban signs and dog-zone paws turn into small dots (like the other point layers).
    box.classList.toggle("icon-dots", z <= 13);
    box.classList.toggle("icon-dots-tiny", z <= 12);
    // Ban signs have their own steps: dot up to 14 (tiny up to 12), then a sign that grows.
    box.dataset.ban = z <= 12 ? "tiny" : z <= 14 ? "dot" : z === 15 ? "s" : z <= 17 ? "m" : "l";
    box.dataset.zoom = z;
  }
  map.on("zoomend", scaleIcons);
  scaleIcons();
  map.on("moveend", () => {
    for (const c of layers.filter((c) => c.key === "dogs" && c.on))
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
      found = MapIcons.marker([lat, lon], "gps", COLORS.orange, name).addTo(map).bindPopup(name);
      map.setView([lat, lon], 17);
      notify(name + (hit.properties.PostalCode ? ", " + hit.properties.PostalCode + " Wien" : ""));
    } catch {
      notify("Die Adresssuche ist gerade nicht erreichbar.");
    }
  };
  // Phones: the panel is a sheet that opens from the bottom via the layers button.
  const panel = byId("panel"),
    layersButton = byId("layersBtn");
  // The sheet opens halfway so the map stays visible above it; drag up for the full height.
  function setSheet(open, full = false) {
    document.body.classList.toggle("sheet-open", open);
    document.body.classList.toggle("sheet-full", open && full);
    layersButton.setAttribute("aria-expanded", open);
    if (open) hideHint();
  }
  layersButton.onclick = () => setSheet(!document.body.classList.contains("sheet-open"));
  panel.querySelector(".sheet-grip").onclick = () =>
    setSheet(true, !document.body.classList.contains("sheet-full"));
  byId("sheetClose").onclick = () => setSheet(false);
  document.addEventListener("keydown", (event) => event.key === "Escape" && setSheet(false));
  // Swipe down on the sheet header closes it.
  const head = panel.querySelector(".sheet-head");
  let touchY = null;
  head.addEventListener("touchstart", (event) => (touchY = event.touches[0].clientY), {
    passive: true,
  });
  head.addEventListener("touchend", (event) => {
    if (touchY === null) return;
    const moved = event.changedTouches[0].clientY - touchY,
      full = document.body.classList.contains("sheet-full");
    if (moved < -40) setSheet(true, true);
    else if (moved > 60) setSheet(full, false);
    touchY = null;
  });
  // First visit: a small bubble points to the layers button.
  const hint = byId("layersHint");
  function hideHint() {
    if (hint.hidden) return;
    hint.hidden = true;
    remember("hintSeen", true);
  }
  if (!recall("hintSeen")) {
    hint.hidden = false;
    hint.onclick = hideHint;
    setTimeout(hideHint, 12000);
  }
  // Small number on the button: how many layers are switched on.
  function countLayers() {
    const n = [...panel.querySelectorAll('input[type="checkbox"]')].filter(
      (box) => box.checked && !box.closest("[hidden]"),
    ).length;
    byId("layersCount").textContent = n;
    byId("layersCount").hidden = !n;
  }
  panel.addEventListener("change", countLayers);
  countLayers();
  const switchFor = (key) => panel.querySelector('input[data-layer="' + key + '"]');
  const switches = () =>
    [...panel.querySelectorAll("input[data-layer]")].filter((box) => !box.closest("[hidden]"));
  // Quick buttons on the map for the most used layers; they flip the same switches.
  const quick = [
    ["dogs", "Hundezonen"],
    ["bags", "Sackerl"],
    ["water", "Trinkbrunnen"],
  ];
  for (const [key, text] of quick) {
    const box = switchFor(key);
    if (!box) continue;
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "quick-chip";
    chip.dataset.layer = key;
    const knob = document.createElement("span");
    knob.className = "chip-switch";
    knob.setAttribute("aria-hidden", "true");
    chip.append(box.parentElement.querySelector(".map-badge").cloneNode(true), text, knob);
    chip.onclick = () => {
      box.checked = !box.checked;
      box.dispatchEvent(new Event("change", { bubbles: true }));
    };
    byId("quickLayers").append(chip);
  }
  // Mini legend: icon and name of every layer that is switched on.
  const miniLegend = byId("miniLegend"),
    miniToggle = byId("miniLegendToggle");
  function showLegend() {
    const on = switches().filter((box) => box.checked);
    byId("miniLegendList").replaceChildren(
      ...on.map((box) => {
        const item = document.createElement("li"),
          row = box.parentElement;
        item.append(
          row.querySelector(".map-badge").cloneNode(true),
          row.querySelector("span:not(.map-badge)").textContent,
        );
        return item;
      }),
    );
    miniLegend.hidden = !on.length;
    for (const chip of document.querySelectorAll(".quick-chip"))
      chip.setAttribute("aria-pressed", switchFor(chip.dataset.layer).checked);
  }
  function foldLegend(open) {
    miniLegend.classList.toggle("folded", !open);
    miniToggle.setAttribute("aria-expanded", open);
  }
  miniToggle.onclick = () => {
    const open = miniLegend.classList.contains("folded");
    foldLegend(open);
    remember("legendFolded", !open);
  };
  foldLegend(!recall("legendFolded"));
  // The chosen layers are remembered on this device and switched on again next time.
  const saved = recall("layers") || [];
  panel.addEventListener("change", () => {
    hideHint();
    showLegend();
    remember(
      "layers",
      switches()
        .filter((box) => box.checked)
        .map((box) => box.dataset.layer),
    );
  });
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
          box.dispatchEvent(new Event("change", { bubbles: true }));
        }
      label();
    };
    group.addEventListener("change", label);
    label();
  }
  for (const key of saved) {
    const box = switchFor(key);
    if (box && !box.checked) {
      box.checked = true;
      box.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }
  showLegend();
}
// Small settings stored in this browser only (layers, hint seen); missing storage is fine.
function remember(name, value) {
  try {
    localStorage.setItem("pfotenwege." + name, JSON.stringify(value));
  } catch {}
}
function recall(name) {
  try {
    return JSON.parse(localStorage.getItem("pfotenwege." + name));
  } catch {
    return null;
  }
}
start().catch(() =>
  notify("Die Karte konnte nicht vollständig gestartet werden. Bitte Seite neu laden."),
);
if ("serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js").catch(() => {});
