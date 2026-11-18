"use strict";
// When is the walk? "Jetzt unterwegs" (default) or "Planen" with a date and a time window.
// From the date we work out the kind of day (Werktag, Samstag, Sonn- oder Feiertag, Werktag in
// den Schulferien) without any outside service: holidays and Vienna school holidays follow fixed
// rules. The table below says how busy each stimulus is then (checked in Notion, Nov 2026).
window.TimeNow = (() => {
  const SLOTS = [
    [0, 6],
    [6, 9],
    [9, 12],
    [12, 15],
    [15, 18],
    [18, 21],
    [21, 24],
  ];
  // Per stimulus: one letter per time window for Werktag, Samstag, Sonn-/Feiertag, Ferien-Werktag.
  // a = aktiv, t = teilweise, r = ruhig. Source: Notion table "Reizquellen nach Zeit".
  const TABLE = {
    works: ["taaaatr", "rttrrrr", "rrrrrrr", "taaaarr"],
    roadNoise: ["raaaaar", "rtaaatr", "rrttttr", "raaaatr"],
    railNoise: ["taaaaat", "taaaaat", "taaaatt", "taaaaat"],
    crowdsDay: ["rtaaarr", "rtaaarr", "rrtaarr", "rtaaarr"],
    crowdsEvening: ["rrrrrtt", "trrrtaa", "rrrrtat", "rrrrraa"],
    // Large U-Bahn stations: busy in rush hours and whenever the city is busy (own estimate).
    hubs: ["taaaaat", "ttaaaat", "rtaaatr", "ttaaaat"],
    schools: ["ratatrr", "rrrrrrr", "rrrrrrr", "rttttrr"],
    play: ["rrtaatr", "rraaatr", "rraaatr", "rraaatr"],
    bikes: ["raataat", "rtaaatr", "rtaaatr", "rtaaatr"],
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
  function current() {
    const d = mode === "plan" ? planDate : new Date();
    const hour = new Date().getHours();
    const slot = mode !== "plan" ? SLOTS.findIndex(([a, b]) => hour >= a && hour < b) : planSlot;
    const date = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const free = holiday(date),
      school = schoolFree(date),
      wd = date.getDay();
    const kind = free || wd === 0 ? 2 : wd === 6 ? 1 : school ? 3 : 0;
    const label =
      free ? "Feiertag: " + free : school ? school : wd === 0 || wd === 6 ? "Wochenende" : "Schultag";
    return { date, slot, kind, label };
  }
  function level(key) {
    const keys = ROWS[key] || [key];
    const { kind, slot } = current();
    return Math.max(...keys.map((k) => (TABLE[k] ? LEVEL[TABLE[k][kind][slot]] : 2)));
  }
  const isEvening = () => current().slot >= 5;
  const slotKey = () => {
    const c = current();
    return c.kind + "-" + c.slot;
  };
  function changed() {
    render();
    listeners.forEach((fn) => fn());
  }

  // ---------- "Wann gehst du?" at the top of "Reizquellen" ----------
  const el = (id) => document.getElementById(id);
  function render() {
    if (!el("timeBox")) return;
    const c = current();
    const [a, b] = SLOTS[c.slot];
    for (const [id, m] of [["timeNow", "now"], ["timePlanBtn", "plan"]])
      el(id).setAttribute("aria-pressed", String(mode === m));
    el("timePlan").hidden = mode !== "plan";
    const when = WEEKDAYS[c.date.getDay()] + ", " + c.date.getDate() + "." + (c.date.getMonth() + 1) + ".";
    el("timeText").textContent = (mode === "now" ? "Jetzt · " : "") + when + " · " + a + "–" + b + " Uhr · " + c.label;
    [...el("timeSlots").children].forEach((btn, i) => btn.setAttribute("aria-pressed", String(i === c.slot)));
    tags();
    hint();
  }
  // Quiet at the chosen time: the row is greyed out and its switch cannot be used (an earlier
  // choice is kept and shows again when it is busy). The three levels only decide this.
  function tags() {
    for (const key of [...Object.keys(TABLE), ...Object.keys(ROWS)]) {
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
    const on = [...el("timeBox").closest("details").querySelectorAll("input[data-layer]")].some(
      (box) => box.checked && !box.disabled,
    );
    const c = current();
    const [a, b] = SLOTS[c.slot];
    note.hidden = !on;
    el("timeHintText").textContent =
      "Reizquellen für " +
      (mode === "now" ? "jetzt" : WEEKDAYS[c.date.getDay()].slice(0, 2) + " " + c.date.getDate() + "." + (c.date.getMonth() + 1) + ".") +
      " · " + a + "–" + b + " Uhr";
  }
  function setup() {
    if (!el("timeBox")) return;
    const pad = (n) => String(n).padStart(2, "0");
    const today = new Date();
    el("timeDate").value = today.getFullYear() + "-" + pad(today.getMonth() + 1) + "-" + pad(today.getDate());
    SLOTS.forEach(([a, b], i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = a + "–" + b;
      btn.onclick = () => {
        planSlot = i;
        changed();
      };
      el("timeSlots").append(btn);
    });
    el("timeNow").onclick = () => {
      mode = "now";
      changed();
    };
    el("timePlanBtn").onclick = () => {
      if (mode === "plan") return;
      mode = "plan";
      const [y, m, d] = el("timeDate").value.split("-").map(Number);
      planDate = day(y, m, d);
      // Start from the current time window.
      const hour = new Date().getHours();
      planSlot = SLOTS.findIndex(([a, b]) => hour >= a && hour < b);
      changed();
    };
    el("timeDate").onchange = () => {
      const [y, m, d] = el("timeDate").value.split("-").map(Number);
      if (y) planDate = day(y, m, d);
      changed();
    };
    // The note on the map opens "Reizquellen" with the time choice.
    el("timeHint").onclick = () => {
      if (window.matchMedia("(max-width: 700px)").matches && !document.body.classList.contains("sheet-open"))
        el("layersBtn").click();
      const group = el("timeBox").closest("details");
      group.open = true;
      group.scrollIntoView({ block: "start", behavior: "smooth" });
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
    slotKey,
    tags,
    onChange: (fn) => listeners.push(fn),
    // For checking only.
    holiday,
    schoolFree,
  };
})();
