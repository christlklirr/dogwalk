const test = require("node:test");
const assert = require("node:assert/strict");
const { buildGraph, solve, places, allowed } = require("../walk.js");

// Three sides of a synthetic rectangle, disconnected at the two ends.
const corners = [[48.150, 16.318], [48.151, 16.318], [48.151, 16.320], [48.150, 16.320]];
const osm = { elements: [
  ...corners.map(([lat, lon], id) => ({ type: "node", id, lat, lon })),
  { type: "way", tags: { highway: "footway" }, nodes: [0, 1, 2, 3] }
] };
const preferences = { steps: true, quiet: true, zone: "egal", level: false, green: false };
function connector(review) {
  return {
    id: "test",
    properties: { review, access: "erlaubt", evidence: "Test", steps: "nein" },
    geometry: { type: "LineString", coordinates: [corners[3], corners[0]].map(([lat, lon]) => [lon, lat]) }
  };
}
function findLoop(paths, bans = []) {
  const graph = buildGraph(osm, corners[0], 600, preferences, bans, paths);
  return solve(graph.get(0), 520, [], [], preferences);
}
test("An open path and an unreviewed connector both yield no loop", () => {
  assert.equal(findLoop([]), null);
  assert.equal(findLoop([connector("ungeprüft")]), null);
});
test("The reviewed connector closes a 519 m loop", () => {
  const route = findLoop([connector("lokal geprüft")]);
  assert.equal(Math.round(route.total), 519);
  assert.deepEqual(route.line[0], route.line.at(-1));
});
test("A ban polygon crossing the connector blocks the loop even when its endpoints lie outside", () => {
  const coordinates = [[[16.3187, 48.1499], [16.3193, 48.1499], [16.3193, 48.1501],
    [16.3187, 48.1501], [16.3187, 48.1499]]];
  const bans = places({ features: [{ geometry: { type: "Polygon", coordinates }, properties: {} }] }, corners[0], 600);
  assert.equal(findLoop([connector("lokal geprüft")], bans), null);
});
test("Known dog restrictions and conditional access block traversal", () => {
  assert.equal(allowed({ "access:conditional": "yes @ (Mo-Fr)" }), false);
  assert.equal(allowed({ dog: "no" }), false);
});

const { routingLayers } = require("../walk.js");

test("An ordinary walk remains available as a preview when Vienna layers fail", async () => {
  const calls = [];
  const missing = async kind => { calls.push(kind); throw Error("offline"); };
  const layers = await routingLayers(missing, {zone:"egal", green:true}, corners[0], 800);
  assert.deepEqual(calls, ["bans","parks"]);
  assert.equal(layers.preview,true);
  assert.equal(layers.notes.length,2);
});

test("Partial bans retain known exclusions and an explicit dog zone remains mandatory", async () => {
  const partial = async () => ({partial:true,features:[{geometry:{type:"Point",coordinates:[16.318,48.150]},properties:{}}]});
  const layers = await routingLayers(partial, {zone:"egal",green:false}, corners[0],800);
  assert.equal(layers.bans.length,1);
  assert.equal(layers.preview,true);
  await assert.rejects(routingLayers(partial,{zone:"zaun",green:false},corners[0],800),/Ohne Vorgabe/);
});

