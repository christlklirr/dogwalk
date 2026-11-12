"use strict";

function getFootpaths(rows) {
  return rows
    .filter((row) => {
      const tags = row.tags || {};

      return (
        ["footway", "path", "pedestrian", "steps"].includes(tags.highway) &&
        tags.area !== "yes" &&
        row.geometry?.length >= 2
      );
    })
    .map((row) => {
      const tags = row.tags || {};

      const restricted = [tags.access, tags.foot, tags.dog].some((value) =>
        ["no", "private", "customers", "residents"].includes(value),
      );

      return {
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: row.geometry.map((point) => [point.lon, point.lat]),
        },
        properties: {
          label: tags.name || "Kartierter Fußweg",
          restricted,
          note: restricted
            ? "Zugang laut OSM eingeschränkt."
            : "Kartierter Fußweg. Zugang mit Hund vor Ort prüfen.",
        },
      };
    });
}

if (typeof module !== "undefined") {
  module.exports = { getFootpaths };
}
