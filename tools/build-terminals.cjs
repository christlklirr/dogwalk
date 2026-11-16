// Builds terminals.json: the end stations of U-Bahn, tram and city bus lines in Vienna.
// Run with:  node tools/build-terminals.cjs   (needs internet; repeat now and then to refresh)
//
// Source: Wiener Linien open data (CC BY 4.0). For every line and direction we take the longest
// stop sequence ("Fahrwegverlauf"); its first and last stop are the terminals. Vehicles often wait
// there, which makes them good places to practise getting on and off with a dog.
"use strict";
const fs = require("fs");
const path = require("path");
const https = require("https");

const BASE = "https://www.wienerlinien.at/ogd_realtime/doku/ogd/";
const TYPES = { ptMetro: "U-Bahn", ptTram: "Straßenbahn", ptBusCity: "Bus" };

const get = (file) =>
  new Promise((resolve, reject) =>
    https
      .get(BASE + file, (res) => {
        let text = "";
        res.setEncoding("utf8");
        res.on("data", (c) => (text += c));
        res.on("end", () => resolve(text));
      })
      .on("error", reject),
  );
const rows = (text) => {
  const [head, ...lines] = text.replace(/^﻿/, "").trim().split(/\r?\n/);
  const keys = head.split(";");
  return lines.map((l) => Object.fromEntries(l.split(";").map((v, i) => [keys[i], v])));
};

async function main() {
  const lines = rows(await get("wienerlinien-ogd-linien.csv"));
  const stops = new Map(rows(await get("wienerlinien-ogd-haltepunkte.csv")).map((s) => [s.StopID, s]));
  const runs = rows(await get("wienerlinien-ogd-fahrwegverlaeufe.csv"));
  const lineOf = new Map(lines.filter((l) => TYPES[l.MeansOfTransport]).map((l) => [l.LineID, l]));

  // Stop sequence per pattern.
  const patterns = new Map();
  for (const r of runs) {
    if (!lineOf.has(r.LineID)) continue;
    const key = r.LineID + "/" + r.PatternID;
    if (!patterns.has(key)) patterns.set(key, { line: r.LineID, dir: r.Direction, stops: [] });
    patterns.get(key).stops[+r.StopSeqCount] = r.StopID;
  }
  // Longest pattern per line and direction.
  const longest = new Map();
  for (const p of patterns.values()) {
    p.stops = p.stops.filter(Boolean);
    const key = p.line + "/" + p.dir;
    if (!longest.has(key) || p.stops.length > longest.get(key).stops.length) longest.set(key, p);
  }
  const terminals = new Map(); // stop name -> terminal
  for (const p of longest.values()) {
    const line = lineOf.get(p.line);
    for (const id of [p.stops[0], p.stops[p.stops.length - 1]]) {
      const s = stops.get(id);
      if (!s || s.Municipality !== "Wien") continue;
      const name = s.StopText;
      if (!terminals.has(name)) terminals.set(name, { name, xs: [], ys: [], lines: new Set(), types: new Set() });
      const t = terminals.get(name);
      t.xs.push(+s.Longitude);
      t.ys.push(+s.Latitude);
      t.lines.add(line.LineText);
      t.types.add(TYPES[line.MeansOfTransport]);
    }
  }
  const avg = (a) => +(a.reduce((x, y) => x + y, 0) / a.length).toFixed(6);
  const out = [...terminals.values()].map((t) => ({
    name: t.name,
    x: avg(t.xs),
    y: avg(t.ys),
    lines: [...t.lines].sort((a, b) => a.localeCompare(b, "de", { numeric: true })),
    types: [...t.types],
  }));
  const file = path.join(__dirname, "..", "terminals.json");
  fs.writeFileSync(file, JSON.stringify({ built: new Date().toISOString().slice(0, 10), terminals: out }));
  console.log("terminals:", out.length, "| file:", Math.round(fs.statSync(file).size / 1024) + " KB");
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
