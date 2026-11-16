"use strict";
window.DogData = (() => {
  const types = {
    dogs: "HUNDEZONEFLOGD",
    parks: "OEFFGRUENFLOGD",
    bans: "HUNDEZONEOGD",
  };
  const names = {
    dogs: "Hundezone",
    parks: "Grünfläche",
    bans: "Hundeverbot",
  };
  const pending = new Map();
  // Green areas where dogs are not allowed, kept by hand (names as in OEFFGRUENFLOGD).
  // Change this list to add or remove a garden.
  const BAN_GARDENS = {
    "Schlosspark Schönbrunn": "Hundeverbot laut Bundesgärten.",
    Belvederegarten: "Hundeverbot laut Bundesgärten.",
    Burggarten: "Hundeverbot laut Bundesgärten.",
    Volksgarten: "Hundeverbot laut Bundesgärten.",
    "Lainzer Tiergarten": "Hundeverbot laut Stadt Wien (Forstamt, MA 49).",
  };
  const CEMETERY_NOTE = "Friedhof: Hunde sind in der Regel nicht erlaubt.";
  // One filtered WFS request; returns its features or nothing if the service fails.
  async function wfs(type, filter) {
    try {
      const url = new URL("https://data.wien.gv.at/daten/geo");
      url.search = new URLSearchParams({
        service: "WFS",
        request: "GetFeature",
        version: "1.0.0",
        typeName: "ogdwien:" + type,
        outputFormat: "json",
        srsName: "EPSG:4326",
        CQL_FILTER: filter,
      });
      const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
      return res.ok ? (await res.json()).features || [] : [];
    } catch {
      return [];
    }
  }
  // Parks banned as a whole, worked out from the ban points by tools/build-bans.cjs.
  async function parkBans() {
    try {
      const res = await fetch("bans-parks.json");
      return res.ok ? await res.json() : null;
    } catch {
      return null;
    }
  }
  // Ban areas from the garden list and all cemeteries (land use "Friedhof").
  async function banAreas() {
    const list = Object.keys(BAN_GARDENS)
      .map((name) => "'" + name + "'")
      .join(",");
    const [gardens, cemeteries] = await Promise.all([
      wfs("OEFFGRUENFLOGD", "T_LANG IN (" + list + ")"),
      wfs("REALNUT2016GOGD", "NUTZUNG_LEVEL3='Friedhof'"),
    ]);
    return [
      ...gardens.map((f) => ({
        type: "Feature",
        geometry: f.geometry,
        properties: { name: f.properties.T_LANG, note: BAN_GARDENS[f.properties.T_LANG] },
      })),
      ...cemeteries.map((f) => ({
        type: "Feature",
        geometry: f.geometry,
        properties: { name: "Friedhof", note: CEMETERY_NOTE },
      })),
    ].filter((f) => f.geometry);
  }
  // Tidy the ban areas in place so every banned place is one closed area with one sign:
  // - holes are filled (an enclosed spot inside a cemetery cannot be reached anyway),
  // - pieces lying inside another ban area are dropped,
  // - pieces with the same name (Lainzer Tiergarten) or neighbouring cemetery blocks become one area,
  // - ban points inside a ban area are dropped (the area already says it).
  function tidyBans(features) {
    const isArea = (f) => ["Polygon", "MultiPolygon"].includes(f.geometry.type);
    const outers = (g) =>
      (g.type === "Polygon" ? [g.coordinates] : g.coordinates).map((rings) => rings[0]);
    function inside([x, y], ring) {
      let c = false;
      for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const [xi, yi] = ring[i],
          [xj, yj] = ring[j];
        if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
      }
      return c;
    }
    let areas = features.filter(isArea).map((f) => ({ ...f, rings: outers(f.geometry) }));
    const points = features.filter((f) => !isArea(f));
    const box = (a) => {
      const xs = a.rings.flat().map((p) => p[0]),
        ys = a.rings.flat().map((p) => p[1]);
      return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
    };
    // drop pieces that sit inside another area (largest first, so twins keep one copy)
    const size = (a) => (a.box[2] - a.box[0]) * (a.box[3] - a.box[1]);
    for (const a of areas) a.box = box(a);
    areas.sort((a, b) => size(b) - size(a));
    const kept = [];
    for (const a of areas)
      if (!kept.some((b) => b.rings.some((r) => a.rings.every((own) => inside(own[0], r)))))
        kept.push(a);
    areas = kept;
    // merge: same name, or cemetery blocks closer than about 40 m
    const near = (a, b, gap = 0.0005) =>
      a[0] - gap < b[2] && b[0] - gap < a[2] && a[1] - gap < b[3] && b[1] - gap < a[3];
    const groups = [];
    for (const a of areas) {
      const group = groups.find((g) =>
        a.properties.name === "Friedhof"
          ? g[0].properties.name === "Friedhof" && g.some((b) => near(a.box, b.box))
          : g[0].properties.name === a.properties.name,
      );
      if (group) group.push(a);
      else groups.push([a]);
    }
    const merged = groups.map((g) => ({
      type: "Feature",
      properties: g[0].properties,
      geometry: { type: "MultiPolygon", coordinates: g.flatMap((a) => a.rings.map((r) => [r])) },
    }));
    const signs = points.filter(
      (p) => !merged.some((a) => a.geometry.coordinates.some(([r]) => inside(p.geometry.coordinates, r))),
    );
    features.splice(0, features.length, ...signs, ...merged);
  }
  // The catalogue is large: look up the ban-area layer once and reuse the answer.
  let banType;
  function banAreaType() {
    return (banType ??= findBanAreaType());
  }
  async function findBanAreaType() {
    try {
      const response = await fetch(
        "https://data.wien.gv.at/daten/geo?service=WFS&version=1.1.0&request=GetCapabilities",
        { signal: AbortSignal.timeout(8000) },
      );
      if (!response.ok) return null;
      const catalog = new DOMParser().parseFromString(await response.text(), "application/xml");
      for (const item of catalog.getElementsByTagNameNS("*", "FeatureType")) {
        const name = item.getElementsByTagNameNS("*", "Name")[0]?.textContent || "";
        if (/hund.*verb.*fl.*ogd$/i.test(name)) return name;
      }
    } catch {
      /* The standort layer supplies display-only fallback points. */
    }
    return null;
  }
  function dogKind(p) {
    const fields = Object.entries(p).filter(
      ([key]) =>
        /^(typ|art|kategorie|bezeichnung|hundetyp|zonenart|hundezonentyp|hundezone_typ|nutzung)(_|$)/i.test(
          key,
        ) || /^typtext$/i.test(key),
    );
    function category(value) {
      const v = String(value).trim().toLowerCase();
      if (/^(hundeverbot|hundeverbots(zone|bereich|fläche)|hunde verboten)(?:$|[ (/-])/.test(v))
        return "bans";
      if (
        /^(hundezone|hundeauslauf(platz|zone|fläche)?|hundewiese|hundefreilauf(zone|fläche)?)(?:$|[ (/-])/.test(
          v,
        )
      )
        return "dogs";
      return null;
    }
    for (const [, value] of fields) {
      const k = category(value);
      if (k) return k;
    }
    for (const value of Object.values(p)) {
      const k = category(value);
      if (k) return k;
    }
    return null;
  }
  async function read(kind, bbox) {
    const [banLayer, extraAreas, parks] =
      kind === "bans"
        ? await Promise.all([banAreaType(), banAreas(), parkBans()])
        : [null, [], null];
    const covered = new Set(parks?.covered);
    const url = new URL("https://data.wien.gv.at/daten/geo");
    url.search = new URLSearchParams({
      service: "WFS",
      request: "GetFeature",
      version: "1.0.0",
      typeName: banLayer || "ogdwien:" + types[kind],
      outputFormat: "json",
      srsName: "EPSG:4326",
    });
    if (bbox) url.searchParams.set("bbox", bbox.join(",") + ",EPSG:4326");
    let fc;
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
      if (!res.ok) throw Error("WFS " + res.status);
      fc = await res.json();
    } catch (error) {
      // Ban areas from the app's own file still show when the city's service is down.
      if (kind !== "bans" || !(extraAreas.length || parks)) throw error;
      fc = { type: "FeatureCollection", features: [] };
    }
    if (fc.type !== "FeatureCollection" || !Array.isArray(fc.features))
      throw Error("Keine Daten");
    const raw = fc.features.filter((f) => f.geometry);
    const features = raw
      .filter((f) => {
        if (kind !== "dogs" && kind !== "bans") return true;
        const category = dogKind(f.properties || {});
        if (category) return category === kind;
        return Boolean(kind === "bans" && banLayer);
      })
      // A ban point that covers its whole park is drawn as that park instead.
      .filter((f) => !covered.has(f.properties?.OBJECTID))
      .map((f) => {
        const p = f.properties || {},
          fence = p.EINFRIEDUNG ?? p.EINGEZAEUNT ?? null;
        return {
          ...f,
          properties: {
            ...p,
            note: parks?.notes[p.OBJECTID],
            name: p.PARK || p.ANLAGE || p.ANL_NAME || p.BEZEICHNUNG || p.NAME || p.ADRESSE || names[kind],
            fenced:
              fence == null
                ? null
                : /^(ja|1|eingezäunt)$/i.test(String(fence))
                  ? true
                  : /^(nein|0|keine)$/i.test(String(fence))
                    ? false
                    : null,
          },
        };
      });
    features.push(...extraAreas, ...(parks?.areas.features || []));
    if (kind === "bans") tidyBans(features);
    if (!features.length && !(bbox && !fc.features.length))
      throw Error("Keine auswertbaren Objekte");
    const partial =
      Number(fc.totalFeatures ?? fc.numberMatched) > fc.features.length ||
      (kind === "bans" &&
        features.some((f) => !["Polygon", "MultiPolygon"].includes(f.geometry.type)));
    return {
      type: "FeatureCollection",
      features,
      partial,
      sourceLabel:
        kind === "bans"
          ? "Rot: ganze Fläche gesperrt · Schild: nur ein Teil"
          : partial
            ? "Teildaten · nur zur Orientierung"
            : "Stadt Wien · Live-Daten",
    };
  }
  // Quantised boxes let the map and nearby round trips share responses.
  function region(west, south, east, north) {
    return [
      Math.floor(west * 20) / 20,
      Math.floor(south * 40) / 40,
      Math.ceil(east * 20) / 20,
      Math.ceil(north * 40) / 40,
    ];
  }
  return {
    region,
    load(kind, bbox) {
      if (!Object.hasOwn(types, kind)) return Promise.reject(Error("Unbekannte Ebene"));
      const key = [kind, ...(bbox || [])].join("/");
      if (!pending.has(key)) {
        const request = read(kind, bbox).then(
          (fc) => {
            setTimeout(
              () => {
                if (pending.get(key) === request) pending.delete(key);
              },
              fc.partial ? 60000 : 600000,
            );
            return fc;
          },
          (e) => {
            pending.delete(key);
            throw e;
          },
        );
        pending.set(key, request);
      }
      return pending.get(key);
    },
  };
})();
