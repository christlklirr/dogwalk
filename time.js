"use strict";
// When is the walk? "Jetzt unterwegs" (default) or "Planen" with a date and a time window.
// From the date we work out the kind of day (Werktag, Samstag, Sonn- oder Feiertag, Werktag in
// den Schulferien) without any outside service: holidays and Vienna school holidays follow fixed
// rules. The table below says how busy each stimulus is then (checked in Notion, Nov 2026).
window.TimeNow = (() => {
  // Six windows of four hours. Their edges follow what changes the city: 6 (public transport and
  // building sites start), 10 (rush hour over), 14 (school out), 18 (shops and sites close),
  // 22 (night rest), 2. 12 o'clock is in the middle of 10–14. The last window runs past midnight
  // (22–2 = the evening of the chosen day until 2 in the morning).
  const SLOTS = [
    [2, 6],
    [6, 10],
    [10, 14],
    [14, 18],
    [18, 22],
    [22, 26],
  ];
  const LATE = 5; // index of 22–2
  // Per stimulus: one letter per time window for Werktag, Samstag, Sonn-/Feiertag, Ferien-Werktag.
  // a = aktiv, r = ruhig. Source: Notion table "Reizquellen nach Zeit". "t" (teilweise) is used
  // only where it changes the map: crowds glow and road and rail noise are drawn at half strength.
  // The night windows (2–6 and 22–2) count as "the night before" a day of that kind: 22–2 on a
  // Friday is read in the Samstag column, like the Nacht-U-Bahn.
  const TABLE = {
    works: ["raaarr", "raarrr", "rrrrrr", "raaarr"],
    roadNoise: ["raaaar", "rtaatr", "rrtttr", "raaatr"],
    railNoise: ["taaaat", "taaaat", "taaaat", "taaaat"],
    crowdsDay: ["rtaatr", "rtaatr", "rrtarr", "rtaatr"],
    crowdsEvening: ["rrrrtt", "trrtaa", "trrtaa", "rrrraa"],
    // Large U-Bahn stations: busy in rush hours and whenever the city is busy (own estimate).
    hubs: ["raaaat", "rtaaat", "rtaatr", "rtaaat"],
  };
  // Public transport: when it runs (hours of the day, approximate). "allNight": in nights before
  // Saturdays, Sundays and holidays it runs through (Nacht-U-Bahn, Nacht-S-Bahn, Badner Bahn).
  // Sources: Wiener Linien, ÖBB/VOR, Wiener Lokalbahnen (checked Nov 2026).
  const SERVICE = {
    metro: { hours: [[0, 1], [5, 24]], allNight: true },
    tram: { hours: [[0, 0.5], [5, 24]] },
    bus: { hours: [[0, 0.5], [5, 24]] },
    nightbus: { hours: [[0.5, 5]] },
    rail: { hours: [[0, 1], [4.5, 24]], allNight: true },
    badner: { hours: [[0, 0.5], [5, 24]], allNight: true },
  };
  // The switch "Menschenmengen" covers day and evening crowds.
  const ROWS = { crowds: ["crowdsDay", "crowdsEvening", "hubs"] };
  const LEVEL = { a: 2, t: 1, r: 0 };
  const WEEKDAYS = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];

  const day = (y, m, d) => new Date(y, m - 1, d);
  const add = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  const same = (a, b) => a.toDateString() === b.toDateString();
  const within = (d, a, b) => d >= a && d <= b;
  function easter(y) {
    const a = y % 19,
      b = Math.floor(y / 100),
      c = y % 100,
      d = Math.floor(b / 4),
      e = b % 4,
      f = Math.floor((b + 8) / 25),
      g = Math.floor((b - f + 1) / 3),
      h = (19 * a + b - d - g + 15) % 30,
      i = Math.floor(c / 4),
      k = c % 4,
      l = (32 + 2 * e + 2 * i - h - k) % 7,
      m = Math.floor((a + 11 * h + 22 * l) / 451),
      month = Math.floor((h + l - 7 * m + 114) / 31),
      date = ((h + l - 7 * m + 114) % 31) + 1;
    return day(y, month, date);
  }
  // Austrian public holidays.
  function holiday(d) {
    const y = d.getFullYear(),
      e = easter(y);
    const list = [
      [day(y, 1, 1), "Neujahr"],
      [day(y, 1, 6), "Heilige Drei Könige"],
      [add(e, 1), "Ostermontag"],
      [day(y, 5, 1), "Staatsfeiertag"],
      [add(e, 39), "Christi Himmelfahrt"],
      [add(e, 50), "Pfingstmontag"],
      [add(e, 60), "Fronleichnam"],
      [day(y, 8, 15), "Mariä Himmelfahrt"],
      [day(y, 10, 26), "Nationalfeiertag"],
      [day(y, 11, 1), "Allerheiligen"],
      [day(y, 12, 8), "Mariä Empfängnis"],
      [day(y, 12, 25), "Christtag"],
      [day(y, 12, 26), "Stefanitag"],
    ];
    return list.find(([x]) => same(x, d))?.[1] || null;
  }
  // Vienna school holidays (rules of the Schulzeitgesetz) plus Leopoldi (15 November, no school).
  function schoolFree(d) {
    const y = d.getFullYear(),
      e = easter(y);
    if ((d.getMonth() === 11 && d.getDate() >= 24) || (d.getMonth() === 0 && d.getDate() <= 6))
      return "Weihnachtsferien";
    let feb = day(y, 2, 1);
    while (feb.getDay() !== 1) feb = add(feb, 1);
    if (within(d, feb, add(feb, 6))) return "Semesterferien";
    if (within(d, add(e, -8), add(e, 1))) return "Osterferien";
    if (within(d, add(e, 48), add(e, 50))) return "Pfingstferien";
    let summer = day(y, 6, 28);
    while (summer.getDay() !== 6) summer = add(summer, 1);
    let sept = day(y, 9, 1);
    while (sept.getDay() !== 1) sept = add(sept, 1);
    if (within(d, summer, add(sept, -1))) return "Sommerferien";
    if (within(d, day(y, 10, 27), day(y, 10, 31))) return "Herbstferien";
    if (d.getMonth() === 10 && d.getDate() === 15) return "schulfrei (Leopoldi)";
    return null;
  }

  let mode = "now",
    planDate = null,
    planSlot = 2;
  const listeners = [];
  // 0–2 o'clock belongs to the window 22–2 (hours counted on as 24–26).
  const slotOf = (hour) => {
    const h = hour < 2 ? hour + 24 : hour;
    return SLOTS.findIndex(([a, b]) => h >= a && h < b);
  };
  // Werktag 0, Samstag 1, Sonn-/Feiertag 2, Werktag in den Ferien 3.
  function kindOf(date) {
    const wd = date.getDay();
    return holiday(date) || wd === 0 ? 2 : wd === 6 ? 1 : schoolFree(date) ? 3 : 0;
  }
  function current() {
    const now = new Date(),
      hour = now.getHours();
    let d = mode === "plan" ? planDate : now;
    // "Jetzt" between 0 and 2 o'clock: still the late window of yesterday.
    if (mode !== "plan" && hour < 2) d = add(d, -1);
    const slot = mode !== "plan" ? slotOf(hour) : planSlot;
    const date = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    // 22–2 is the night before the next day: its kind decides (Friday night = Samstag column).
    const next = add(date, 1);
    const kind = kindOf(slot === LATE ? next : date);
    const free = holiday(date),
      school = schoolFree(date),
      wd = date.getDay();
    let label = wd === 0 || wd === 6 ? "Wochenende" : "Schultag";
    if (school) label = school;
    if (free) label = "Feiertag: " + free;
    if (slot === LATE) label = "Nacht auf " + WEEKDAYS[next.getDay()] + (holiday(next) ? " (Feiertag)" : "");
    return { date, slot, kind, label };
  }
  // Runs at hour t (0–24) of a day of this kind? Nights before Sat/Sun/holiday = the early hours
  // of a Saturday, Sunday or holiday (kind 1 or 2).
  function runs(key, t, kind) {
    const s = SERVICE[key];
    if (s.allNight && t < 5 && (kind === 1 || kind === 2)) return true;
    return s.hours.some(([a, b]) => t >= a && t < b);
  }
  // "Jetzt": the clock decides. A chosen time window: shown if it runs at least half of it.
  // Hours past midnight count with the kind of the next day.
  function running(key) {
    const c = current();
    if (mode !== "plan") {
      const now = new Date();
      return runs(key, now.getHours() + now.getMinutes() / 60, kindOf(now));
    }
    const [a, b] = SLOTS[c.slot];
    const today = kindOf(c.date),
      tomorrow = kindOf(add(c.date, 1));
    let on = 0;
    for (let t = a; t < b; t += 0.25) if (t >= 24 ? runs(key, t - 24, tomorrow) : runs(key, t, today)) on += 0.25;
    return on * 2 >= b - a;
  }
  function level(key) {
    if (SERVICE[key]) return running(key) ? 2 : 0;
    const keys = ROWS[key] || [key];
    const { kind, slot } = current();
    return Math.max(...keys.map((k) => (TABLE[k] ? LEVEL[TABLE[k][kind][slot]] : 2)));
  }
  const isEvening = () => current().slot >= 4;
  const slotKey = () => {
    const c = current();
    // Also which public transport runs, so "Jetzt" updates at 0:30, 1 and 5 o'clock.
    return c.kind + "-" + c.slot + "-" + Object.keys(SERVICE).map((k) => level(k)).join("");
  };
  function changed() {
    render();
    listeners.forEach((fn) => fn());
  }

  // ---------- "Wann geht ihr?" at the top of "Entdecken" ----------
  const el = (id) => document.getElementById(id);
  const span = ([a, b]) => a + "–" + (b % 24);
  function render() {
    if (!el("timeBox")) return;
    const c = current();
    for (const [id, m] of [["timeNow", "now"], ["timePlanBtn", "plan"]])
      el(id).setAttribute("aria-pressed", String(mode === m));
    el("timePlan").hidden = mode !== "plan";
    const when = WEEKDAYS[c.date.getDay()] + ", " + c.date.getDate() + "." + (c.date.getMonth() + 1) + ".";
    el("timeText").textContent = (mode === "now" ? "Jetzt · " : "") + when + " · " + span(SLOTS[c.slot]) + " Uhr · " + c.label;
    [...el("timeSlots").children].forEach((btn, i) => btn.setAttribute("aria-pressed", String(i === c.slot)));
    tags();
    hint();
  }
  // Quiet at the chosen time: the row is greyed out and its switch cannot be used (an earlier
  // choice is kept and shows again when it is busy). The three levels only decide this.
  function tags() {
    for (const key of [...Object.keys(TABLE), ...Object.keys(ROWS), ...Object.keys(SERVICE)]) {
      const row = document.querySelector('#panel input[data-layer="' + key + '"]')?.closest("label");
      if (!row) continue;
      const quiet = level(key) === 0;
      row.classList.toggle("is-quiet", quiet);
      row.querySelector("input").disabled = quiet;
    }
  }
  // Note on the map while stimuli are shown for a time: "Reizquellen für jetzt · 15–18 Uhr".
  function hint() {
    const note = el("timeHint");
    if (!note) return;
    const on = [...el("loudLayers").closest("details").querySelectorAll("input[data-layer]")].some(
      (box) => box.checked && !box.disabled,
    );
    const c = current();
    note.hidden = !on;
    el("timeHintText").textContent =
      "Reizquellen für " +
      (mode === "now" ? "jetzt" : WEEKDAYS[c.date.getDay()].slice(0, 2) + " " + c.date.getDate() + "." + (c.date.getMonth() + 1) + ".") +
      " · " + span(SLOTS[c.slot]) + " Uhr";
  }
  function setup() {
    if (!el("timeBox")) return;
    const pad = (n) => String(n).padStart(2, "0");
    const today = new Date();
    el("timeDate").value = today.getFullYear() + "-" + pad(today.getMonth() + 1) + "-" + pad(today.getDate());
    SLOTS.forEach((s, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = span(s);
      btn.onclick = () => {
        planSlot = i;
        changed();
      };
      el("timeSlots").append(btn);
    });
    // Info button beside "Jetzt · Zeitpunkt": shows or hides the short explanation.
    el("timeInfo").onclick = () => {
      el("timeNote").hidden = !el("timeNote").hidden;
      el("timeInfo").setAttribute("aria-expanded", String(!el("timeNote").hidden));
    };
    el("timeNow").onclick = () => {
      mode = "now";
      changed();
    };
    el("timePlanBtn").onclick = () => {
      if (mode === "plan") return;
      mode = "plan";
      const [y, m, d] = el("timeDate").value.split("-").map(Number);
      planDate = day(y, m, d);
      // Start from the current time window (after midnight: the late window of yesterday).
      const hour = new Date().getHours();
      planSlot = slotOf(hour);
      if (hour < 2) {
        planDate = add(planDate, -1);
        el("timeDate").value = [planDate.getFullYear(), planDate.getMonth() + 1, planDate.getDate()]
          .map((n) => String(n).padStart(2, "0"))
          .join("-");
      }
      changed();
    };
    el("timeDate").onchange = () => {
      const [y, m, d] = el("timeDate").value.split("-").map(Number);
      if (y) planDate = day(y, m, d);
      changed();
    };
    // The note on the map opens "Entdecken" at the time choice.
    el("timeHint").onclick = () => {
      if (window.matchMedia("(max-width: 700px)").matches && !document.body.classList.contains("sheet-open"))
        el("layersBtn").click();
      el("timeBox").scrollIntoView({ block: "start", behavior: "smooth" });
    };
    document.getElementById("panel").addEventListener("change", hint);
    // "Jetzt": move on by itself when the next time window starts.
    let last = slotKey();
    setInterval(() => {
      if (mode === "now" && slotKey() !== last) {
        last = slotKey();
        changed();
      }
    }, 60000);
    render();
  }
  return {
    setup,
    level,
    isEvening,
    isNow: () => mode === "now",
    // The chosen walk: day and hours (for the weather line).
    walk: () => {
      const c = current();
      const [a, b] = SLOTS[c.slot];
      // Hours 2–26: after midnight the hour counts on from 24.
      const hour = new Date().getHours();
      return { date: c.date, from: mode === "now" ? Math.max(a, hour < 2 ? hour + 24 : hour) : a, to: b, now: mode === "now" };
    },
    slotKey,
    tags,
    onChange: (fn) => listeners.push(fn),
    // For checking only.
    holiday,
    schoolFree,
  };
})();
