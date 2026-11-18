// Builds construction.json: building sites in Vienna (OpenStreetMap, landuse=construction).
// Run with:  node tools/build-construction.cjs   (needs internet; repeat now and then to refresh)
//
// Why: the city's green-area map (Flächen-Mehrzweckkarte) still shows some new building sites as
// meadows. The app uses this file to leave those sites out of the green areas and to show large
// building sites in the "Baustellen" layer. Source: © OpenStreetMap contributors (ODbL).
"use strict";
const fs = require("fs");
const path = require("path");
const https = require("https");

const BOX = [48.11, 16.18, 48.33, 16.58]; // south, west, north, east (Vienna)
const QUERY =
  "[out:json][timeout:90];(way[landuse=construction](" +
  BOX.join(",") +
  ");relation[landuse=construction](" +
  BOX.join(",") +
  "););out geom tags;";

function post(body) {
  return new Promise((resolve, reject) => {
    const req = https.request(
      "https://overpass-api.de/api/interpreter",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
          "User-Agent": "dogwalk-map/1.0 (open data map)",
        },
      },
      (res) => {
        let text = "";
        res.setEncoding("utf8");
        res.on("data", (c) => (text += c));
        res.on("end", () => (res.statusCode === 200 ? resolve(text) : reject(Error(res.statusCode + " " + text.slice(0, 200)))));
      },
    );
    req.on("error", reject);
    req.end("data=" + encodeURIComponent(body));
  });
}
const round = (v) => +v.toFixed(6);
const ring = (geometry) => geometry.map((p) => [round(p.lon), round(p.lat)]);
// Area in square metres (rough, good enough for Vienna).
function area(r) {
  let a = 0;
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) a += (r[j][0] + r[i][0]) * (r[j][1] - r[i][1]);
  return Math.abs(a / 2) * 74000 * 111000;
}
const KIND = {
  apartments: "Wohnbau",
  residential: "Wohnbau",
  house: "Haus",
  commercial: "Geschäftsbau",
  office: "Bürobau",
  industrial: "Industriebau",
  school: "Schule",
  park: "neuer Park",
};

async function main() {
  const data = JSON.parse(await post(QUERY));
  const sites = [];
  for (const el of data.elements) {
    const t = el.tags || {};
    const rings =
      el.type === "way"
        ? [ring(el.geometry || [])]
        : (el.members || []).filter((m) => m.role === "outer" && m.geometry).map((m) => ring(m.geometry));
    for (const r of rings) {
      if (r.length < 4) continue;
      const m2 = Math.round(area(r));
      if (m2 < 150) continue; // tiny pieces are not worth a sign
      sites.push({
        kind: KIND[t.construction] || KIND[t["construction:leisure"]] || "",
        name: t.name || "",
        operator: t.operator || "",
        opening: t.opening_date || "",
        m2,
        ring: r,
      });
    }
  }
  const file = path.join(__dirname, "..", "construction.json");
  fs.writeFileSync(file, JSON.stringify({ built: new Date().toISOString().slice(0, 10), sites }));
  console.log("sites:", sites.length, "| file:", Math.round(fs.statSync(file).size / 1024) + " KB");
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
