"use strict";
// All map colours in one place. Petrol = good for the dog, red = bad, violet = neutral.
const COLORS = Object.freeze({
  petrol: "#1a81a1",
  red: "#b4473f",
  violet: "#76428b",
  orange: "#e6870b",
  green: "#3c8d40",
  olive: "#6f8a3a",
  crowdArea: "#d4625b",
  // Busy places: sun yellow during the day, dark violet in the evening.
  crowdDay: "#eaa800",
  crowdEvening: "#4b2a6b",
  // Wiener Linien colours of the metro lines.
  metro: { 1: "#e20613", 2: "#a3639f", 3: "#eb6a1f", 4: "#1ea03e", 5: "#2e9ba6", 6: "#a1622e" },
  // Public transport routes and stops.
  tram: "#c4161c",
  bus: "#3d6fb6",
  nightbus: "#2c2e6e",
  rail: "#5d6b78",
  // Noise areas (loud streets and railways).
  noise: "#2b2b2b",
  gps: "#285fb2",
  boundary: "#5f6368",
});
