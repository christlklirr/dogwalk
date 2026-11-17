// Builds bans-parks.json: which dog-ban points of the city cover a whole park.
// Run with:  node tools/build-bans.cjs   (needs internet; repeat now and then to refresh)
//
// Each ban point (HUNDEZONEOGD, TYP "Hundeverbot") has a park name and the size of the ban area.
// We look for the green area (OEFFGRUENFLOGD) the point lies in. If the ban is at least
// 75 % of that green area, the whole area is drawn red and the point is dropped.
// Otherwise the point stays as a sign, with a note on how much of the park it covers.
"use strict";
const fs = require("fs");
const path = require("path");

const WFS =
  "https://data.wien.gv.at/daten/geo?service=WFS&version=1.0.0&request=GetFeature&outputFormat=json&srsName=EPSG:4326&typeName=ogdwien:";
const WHOLE = 0.75; // share of the green area from which the whole park counts as banned
const NEAR = 40; // metres: a point just outside a green area still belongs to it
const GROUP = 600; // metres: parts of one park with the same name lie this close together
const KX = 74000, // metres per degree of longitude in Vienna
  KY = 111000; // metres per degree of latitude

const polys = (g) =>
  !g ? [] : g.type === "Polygon" ? [g.coordinates] : g.type === "MultiPolygon" ? g.coordinates : [];
function inside([x, y], rings) {
  let c = false;
  for (const ring of rings)
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i],
        [xj, yj] = ring[j];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
    }
  return c;
}
function distance([x, y], rings) {
  let best = Infinity;
  for (const ring of rings)
    for (let i = 1; i < ring.length; i++) {
      const ax = ring[i - 1][0] * KX,
        ay = ring[i - 1][1] * KY,
        dx = ring[i][0] * KX - ax,
        dy = ring[i][1] * KY - ay,
        px = x * KX,
        py = y * KY,
        t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy || 1)));
      best = Math.min(best, Math.hypot(px - ax - t * dx, py - ay - t * dy));
    }
  return best;
}
const corner = (f) => polys(f.geometry)[0][0][0];
const apart = (a, b) => Math.hypot((a[0] - b[0]) * KX, (a[1] - b[1]) * KY);
// Fewer decimals keep the file small (6 decimals ≈ 10 cm).
const round = (g) => JSON.parse(JSON.stringify(g, (k, v) => (typeof v === "number" ? +v.toFixed(6) : v)));
// Share of the park in whole percent (at least "unter 1 %").
function share(r) {
  const p = Math.round(r * 100);
  return p < 1 ? "unter 1 %" : "etwa " + p + " %";
}

async function main() {
  // Plain HTTP/1.1 download (the built-in fetch fails on the large green-area answer).
  const get = (type) =>
    new Promise((resolve, reject) =>
      require("https")
        .get(WFS + type, (res) => {
          let text = "";
          res.setEncoding("utf8");
          res.on("data", (chunk) => (text += chunk));
          res.on("end", () => {
            try {
              resolve(JSON.parse(text).features);
            } catch (e) {
              reject(e);
            }
          });
        })
        .on("error", reject),
    );
  const points = await get("HUNDEZONEOGD");
  const parks = await get("OEFFGRUENFLOGD");
  const bans = points.filter((f) => f.properties.TYP === "Hundeverbot" && f.geometry);
  const areas = new Map(); // green area id -> feature to draw
  const notes = {}; // ban point OBJECTID -> note for points that stay
  const covered = []; // ban point OBJECTIDs replaced by a red area
  for (const ban of bans) {
    const p = ban.properties,
      point = ban.geometry.coordinates,
      size = Number(String(p.FLAECHE || "").replace(/[^0-9]/g, ""));
    let hit = parks.find((f) => polys(f.geometry).some((r) => inside(point, r)));
    if (!hit) {
      let best = NEAR;
      for (const f of parks)
        for (const r of polys(f.geometry)) {
          const d = distance(point, r);
          if (d < best) [best, hit] = [d, f];
        }
    }
    if (!hit || !size) {
      notes[p.OBJECTID] = "Hundeverbot. Die genaue Fläche ist nicht bekannt.";
      continue;
    }
    const group = parks.filter(
      (f) => f.properties.T_LANG === hit.properties.T_LANG && apart(corner(f), corner(hit)) < GROUP,
    );
    const total = group.reduce((s, f) => s + f.properties.FLAECHE, 0);
    const parts =
      size / hit.properties.FLAECHE >= WHOLE ? [hit] : size / total >= WHOLE ? group : null;
    if (!parts) {
      notes[p.OBJECTID] = "Hundeverbot auf " + share(size / total) + " des Parks.";
      continue;
    }
    covered.push(p.OBJECTID);
    for (const f of parts)
      areas.set(f.id, {
        type: "Feature",
        geometry: round(f.geometry),
        properties: { name: p.PARK || f.properties.T_LANG, note: "Hundeverbot im ganzen Park (Stadt Wien)." },
      });
  }
  const out = {
    built: new Date().toISOString().slice(0, 10),
    covered,
    notes,
    areas: { type: "FeatureCollection", features: [...areas.values()] },
  };
  const file = path.join(__dirname, "..", "bans-parks.json");
  fs.writeFileSync(file, JSON.stringify(out));
  console.log(
    "ban points:", bans.length,
    "| whole parks:", covered.length,
    "| signs left:", Object.keys(notes).length,
    "| areas:", areas.size,
    "| file:", Math.round(fs.statSync(file).size / 1024) + " KB",
  );
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
