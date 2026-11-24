"use strict";
// Weather for the chosen walk ("Wann geht ihr?"): one short line, tips on what the dog needs,
// and a note on the map only for real warnings (heat on asphalt, thunderstorm, storm, ice).
// Forecast for the middle of Vienna from Open-Meteo (no key, CC BY 4.0). We never send the
// user's position. If the service does not answer, the weather simply does not show.
window.Weather = (() => {
  const URL_ =
    "https://api.open-meteo.com/v1/forecast?latitude=48.21&longitude=16.37&timezone=Europe%2FVienna&forecast_days=7" +
    "&hourly=temperature_2m,precipitation_probability,precipitation,weather_code,wind_gusts_10m,shortwave_radiation" +
    "&daily=sunrise,sunset";
  let data = null;
  const el = (id) => document.getElementById(id);
  const pad = (n) => String(n).padStart(2, "0");
  const dayKey = (d) => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  const clock = (iso) => String(Number(iso.slice(11, 13))) + ":" + iso.slice(14, 16);
  const hourOf = (iso) => Number(iso.slice(11, 13)) + Number(iso.slice(14, 16)) / 60;
  // Sun going down behind the horizon (instead of the word "Sonnenuntergang").
  const SUNSET_ICON =
    '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M7 16a5 5 0 0 1 10 0M3 16h18M5 20h14M12 3v5M9.5 5.5 12 8l2.5-2.5M4.2 10.2l1.4 1.4M19.8 10.2l-1.4 1.4"/></svg>';

  // WMO weather codes: the worst one in the walk decides the symbol.
  function sky(code, night) {
    if (code >= 95) return ["⛈️", "Gewitter"];
    if (code >= 71 && code <= 77) return ["🌨️", "Schnee"];
    if (code === 85 || code === 86) return ["🌨️", "Schneeschauer"];
    if (code >= 51) return ["🌧️", "Regen"];
    if (code >= 45) return ["🌫️", "Nebel"];
    if (code === 3) return ["☁️", "bewölkt"];
    if (code >= 1) return [night ? "🌙" : "🌤️", night ? "klar" : "heiter"];
    return [night ? "🌙" : "☀️", night ? "klar" : "sonnig"];
  }

  // The hours of the walk in the forecast, or a reason why there are none.
  function hours(walk) {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    if (!walk.now && walk.date < start) return "Für vergangene Tage gibt es kein Wetter.";
    // Hours can run past midnight (22–2 = 22 to 26): those are on the next day.
    const index = new Map(data.hourly.time.map((t, i) => [t, i]));
    const list = [];
    for (let hour = walk.from; hour < walk.to; hour++) {
      const day = new Date(walk.date.getFullYear(), walk.date.getMonth(), walk.date.getDate() + Math.floor(hour / 24));
      const i = index.get(dayKey(day) + "T" + pad(hour % 24) + ":00");
      if (i !== undefined) list.push(i);
    }
    if (!list.length) return "Für diesen Tag gibt es noch keine Vorhersage (erst etwa 7 Tage vorher).";
    return list;
  }

  function summary(walk) {
    const list = hours(walk);
    if (typeof list === "string") return { note: list, tips: [] };
    const h = data.hourly,
      pick = (name) => list.map((i) => h[name][i] ?? 0);
    const temp = pick("temperature_2m"),
      prob = pick("precipitation_probability"),
      rain = pick("precipitation"),
      codes = pick("weather_code"),
      gust = Math.round(Math.max(...pick("wind_gusts_10m"))),
      sun = Math.max(...pick("shortwave_radiation"));
    const tMax = Math.max(...temp),
      tMin = Math.min(...temp),
      rainProb = Math.max(...prob),
      rainSum = rain.reduce((a, b) => a + b, 0),
      code = Math.max(...codes);
    const d = data.daily.time.indexOf(dayKey(walk.date));
    const sunset = d >= 0 ? data.daily.sunset[d] : null,
      sunrise = d >= 0 ? data.daily.sunrise[d] : null;

    // Light: "day", "dusk" (at least half of the walk after sunset / before sunrise: dark red box)
    // or "night" (all of it dark: black box). "Jetzt": the clock decides, dusk = first hour.
    let light = "day";
    if (sunset && sunrise) {
      const down = hourOf(sunset),
        up = hourOf(sunrise);
      if (walk.now) {
        const now = new Date(),
          t = now.getHours() + now.getMinutes() / 60;
        if (t >= down || t < up) light = (t >= down ? t - down : up - t) < 1 ? "dusk" : "night";
      } else {
        const span = walk.to - walk.from;
        let dark = 0;
        for (let t = walk.from; t < walk.to; t += 0.25) if (t % 24 < up || t % 24 >= down) dark += 0.25;
        light = dark >= span ? "night" : dark * 2 >= span ? "dusk" : "day";
      }
    }
    const [icon, word] = sky(code, light !== "day");
    const lo = Math.round(tMin),
      hi = Math.round(tMax);

    // Short tips; warn = also shown on the map.
    const tips = [];
    if (code >= 95) tips.push({ warn: true, text: "Gewitter möglich" });
    if (gust >= 60) tips.push({ warn: true, text: "Sturmböen bis " + gust + " km/h" });
    if (tMax >= 30 || (tMax >= 25 && sun >= 400)) tips.push({ warn: true, text: "Asphalt heiß, Pfoten schützen" });
    const ice = codes.some((c) => [56, 57, 66, 67].includes(c)) || (tMin <= 0 && rainSum > 0.1);
    if (ice) tips.push({ warn: true, text: "Glatteis möglich" });
    if (tMin < 0) tips.push({ text: "Frost, Streusalz möglich" });
    return {
      icon,
      word,
      temp: (lo === hi ? hi : lo + "–" + hi) + " °C",
      rain: rainProb >= 30 || rainSum >= 0.2 ? rainProb : null,
      sunset: sunset && clock(sunset),
      light,
      tips,
    };
  }

  function render() {
    const box = el("weatherBox");
    if (!box) return;
    if (!data) {
      box.hidden = true;
      el("weatherAlert").hidden = true;
      return;
    }
    const w = summary(TimeNow.walk()),
      tips = w.tips;
    box.hidden = false;
    // Evening colours: dark red at dusk, near-black at night (white text, high contrast).
    box.classList.toggle("is-dusk", w.light === "dusk");
    box.classList.toggle("is-night", w.light === "night");
    const line = el("weatherText");
    if (w.note) line.textContent = w.note;
    else {
      // Only symbols and numbers: weather, temperature, rain chance, sunset.
      const icon = document.createElement("span"),
        temp = document.createElement("strong");
      icon.textContent = w.icon;
      icon.setAttribute("role", "img");
      icon.setAttribute("aria-label", w.word);
      icon.title = w.word;
      temp.textContent = w.temp;
      line.replaceChildren(icon, " ", temp);
      if (w.rain !== null) {
        const rain = document.createElement("span");
        rain.title = "Regenwahrscheinlichkeit";
        rain.append(Object.assign(document.createElement("span"), { textContent: "💧", ariaHidden: "true" }));
        rain.append(Object.assign(document.createElement("span"), { className: "sr-only", textContent: "Regen " }), w.rain + " %");
        line.append(" · ", rain);
      }
      if (w.sunset) {
        const set = document.createElement("span");
        set.className = "weather-sunset";
        set.title = "Sonnenuntergang";
        set.innerHTML = SUNSET_ICON;
        set.append(Object.assign(document.createElement("span"), { className: "sr-only", textContent: "Sonnenuntergang " }), w.sunset);
        line.append(" · ", set);
      }
    }
    const ul = el("weatherTips");
    ul.replaceChildren(
      ...tips.map((tip) => {
        const li = document.createElement("li");
        li.textContent = tip.text;
        if (tip.warn) li.className = "warn";
        return li;
      }),
    );
    // On the map only the warnings.
    const warn = tips.filter((tip) => tip.warn);
    el("weatherAlert").hidden = !warn.length;
    el("weatherAlertText").textContent = warn.map((tip) => tip.text).join(" · ");
  }

  async function load() {
    try {
      const res = await fetch(URL_);
      if (!res.ok) throw new Error(res.status);
      data = await res.json();
    } catch {
      // Keep the last forecast, if there is one.
    }
    render();
  }

  function setup() {
    if (!el("weatherBox")) return;
    TimeNow.onChange(render);
    el("weatherAlert").onclick = () => el("timeHint").onclick();
    load();
    // New forecast every hour; also moves "Jetzt" on.
    setInterval(load, 3600000);
  }
  return { setup, summary };
})();
Weather.setup();
