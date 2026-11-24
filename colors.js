"use strict";
// All map colours in one place. Petrol = good for the dog, red = bad, violet = neutral.
const COLORS = Object.freeze({
  petrol: "#1a81a1",
  red: "#b4473f",
  violet: "#76428b",
  orange: "#e6870b",
  green: "#3c8d40",
  olive: "#6f8a3a",
  // Supplies: each its own blue, so they can be told apart.
  bags: "#2a4b8d", // dark blue: Gackerlsackerl
  water: "#1e90d6", // sky blue: drinking water
  bathing: "#13a3a0", // turquoise: bathing spots
  crowdArea: "#d4625b",
  // Busy places (day and evening): red like everything to avoid with the dog.
  crowdDay: "#d4625b",
  crowdEvening: "#d4625b",
  // Wiener Linien colours of the metro lines.
  metro: { 1: "#e20613", 2: "#a3639f", 3: "#eb6a1f", 4: "#1ea03e", 5: "#2e9ba6", 6: "#a1622e" },
  // Public transport routes and stops; ubahn is the U-Bahn sign.
  ubahn: "#1f4e9c",
  tram: "#c4161c",
  bus: "#3d6fb6",
  nightbus: "#2c2e6e",
  rail: "#5d6b78",
  // Noise areas (loud streets and railways).
  noise: "#2b2b2b",
  gps: "#285fb2",
  boundary: "#5f6368",
});
