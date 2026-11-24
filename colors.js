"use strict";
// All map colours in one place. Petrol = good for the dog, red = bad, violet = neutral.
const COLORS = Object.freeze({
  petrol: "#1a81a1",
  red: "#b4473f",
  violet: "#76428b",
  orange: "#e6870b",
  green: "#3c8d40",
  // Supplies: bag dispensers black (like the real ones), water and bathing each their own blue.
  bags: "#1b1b1b", // black, like the real Gackerlsackerl dispensers
  water: "#1e90d6", // sky blue: drinking water
  bathing: "#13a3a0", // turquoise: bathing spots
  crowdArea: "#d4625b",
  // Busy places (day and evening): red like everything to avoid with the dog.
  crowdDay: "#d4625b",
  crowdEvening: "#d4625b",
  // Wiener Linien colours of the metro lines.
  metro: { 1: "#e20613", 2: "#a3639f", 3: "#eb6a1f", 4: "#1ea03e", 5: "#2e9ba6", 6: "#a1622e" },
  // Public transport routes and stops; ubahn is the U-Bahn sign in the list (on the map only line chips).
  ubahn: "#1ea03e", // U4 green
  badner: "#0077c8", // Badner Bahn: its own strong blue
  tram: "#e3000f", // Wiener Linien red
  bus: "#e3000f", // same Wiener Linien red as the tram (dotted routes)
  nightbus: "#2c2e6e",
  rail: "#e2002a", // ÖBB red (S-Bahn and regional trains)
  // Noise areas (loud streets and railways).
  noise: "#2b2b2b",
  gps: "#285fb2",
  boundary: "#5f6368",
});
