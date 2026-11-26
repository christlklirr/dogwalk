// Builds pets.json: pet shops and dog groomers in Vienna from OpenStreetMap (ODbL).
// Run with:  node tools/build-pets.cjs   (needs internet; repeat now and then to refresh)
// Or from a saved Overpass answer:  node tools/build-pets.cjs answer.json
//
// The City of Vienna publishes no list of shops, so OpenStreetMap is the only open source.
// We keep name, position, address, opening hours and website (also useful for partner research).
"use strict";
const fs = require("fs");
const path = require("path");

const QUERY =
  '[out:json][timeout:90];area["name"="Wien"]["admin_level"="4"]->.w;' +
  '(nwr["shop"="pet"](area.w);nwr["shop"="pet_grooming"](area.w););out center tags;';

async function main() {
  // The public Overpass servers are busy now and then: try them one after the other.
  let data = process.argv[2] ? JSON.parse(fs.readFileSync(process.argv[2], "utf8")) : null;
  if (!data) for (const url of [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.private.coffee/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
  ]) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "dogwalk-map/1.0 (open data map)",
        },
        body: "data=" + encodeURIComponent(QUERY),
      });
      data = await res.json();
      // An empty answer means the server did not know the area "Wien": try the next one.
      if (data.elements?.length) break;
    } catch (error) {
      console.warn(url + ": " + error.message);
    }
  }
  if (!data?.elements?.length) throw Error("Kein OSM-Server hat geantwortet.");
  const round = (v) => Math.round(v * 1e6) / 1e6;
  const shops = data.elements
    .map((e) => {
      const t = e.tags || {},
        pt = e.center || e;
      return {
        name: t.name || t.brand || (t.shop === "pet_grooming" ? "Hundesalon" : "Zoofachgeschäft"),
        kind: t.shop === "pet_grooming" ? "Hundesalon" : "Zoofachgeschäft",
        x: round(pt.lon),
        y: round(pt.lat),
        street: [t["addr:street"], t["addr:housenumber"]].filter(Boolean).join(" ") || undefined,
        hours: t.opening_hours || undefined,
        web: t.website || t["contact:website"] || undefined,
        osm: e.type + "/" + e.id,
      };
    })
    .filter((s) => Number.isFinite(s.x) && Number.isFinite(s.y))
    .sort((a, b) => a.name.localeCompare(b.name, "de"));
  const out = { built: new Date().toISOString().slice(0, 10), source: "OpenStreetMap (ODbL)", shops };
  fs.writeFileSync(path.join(__dirname, "..", "pets.json"), JSON.stringify(out));
  console.log(shops.length + " Geschäfte gespeichert.");
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
