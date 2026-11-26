# Wauz up – Wiener Pfotenwege

Eine Karte der Wiener Pfotenwege, also eine Spazierkarte für Wien mit Hundefokus. Sie läuft im Browser und als App (PWA) über GitHub Pages:
https://christlklirr.github.io/dogwalk/

## Was die Karte zeigt

- **Immer sichtbar:** Fuß- und Pfotenwege (rot gestrichelt in der Grundkarte).
- **Hundeverbotszonen:** zuschaltbar, rot. Ganze Flächen: Bundesgärten, Lainzer Tiergarten,
  Friedhöfe und Parks, die laut Stadt Wien ganz gesperrt sind. Schild: nur ein Teil eines Parks.
- **Hunde:** Hundezonen (orange mit Pfote), von Anfang an eingeblendet.
- **Immer sichtbar:** Grünflächen der Stadt (hellgrün wie die Parks der Grundkarte, ab Zoomstufe 14,
  auch Höfe von Gemeindebauten und Genossenschaften; als Bild von der Stadt Wien, daher schnell).
- **Infrastruktur:** Gackerlsackerl-Spender (schwarz), Trinkbrunnen, Badestellen,
  Spazier- und Wanderwege (orange), öffentliche WCs, Zoofachgeschäfte und Hundesalons (OpenStreetMap,
  Datei `pets.json`, aufzufrischen mit `node tools/build-pets.cjs`).
- **Öffis:** U-Bahn, Straßenbahn, Bus, Nachtbus, S-Bahn und Regionalzüge, Badner Bahn, jeweils mit Strecken und
  Haltestellen, dazu „Endstationen zum Üben“ (aus den Daten der Wiener Linien).
- **Reizquellen:** Straßen- und Schienenlärm (amtliche Lärmkarte, nur laute Bereiche ab 65 dB, anthrazit mit Kante), U-Bahn,
  „Menschenmengen“ (alles rot; tagsüber: Sehenswürdigkeiten, Fußgängerzonen, Geschäftsstraßen, Märkte;
  abends: Gastro-Meilen aus den Schanigärten; dazu große Umsteigestationen der U-Bahn), Spielplätze,
  Schulen und Kindergärten, Baustellen auf Straßen (rot gestrichelt).
- **Ortssuche** über den Adressdienst der Stadt Wien.

Beim ersten Start ist nichts zugeschaltet; danach merkt sich der Browser die gewählten Ebenen.
Am Handy gibt es oben den Knopf „Entdecken“ (öffnet ein halbes Fenster). Die Gruppen sind am
Anfang eingeklappt und zeigen, wie viele Ebenen sie enthalten. Farben: Petrol = gut für den Hund, Violett = neutral, Rot = belastend.

## Dateien

| Datei | Inhalt |
|---|---|
| `index.html` | Aufbau der Seite: Legende, Schalter, Suchfeld |
| `style.css` | Aussehen |
| `version.js` | Versionsnummer (einzige Stelle) |
| `colors.js` | Alle Kartenfarben (einzige Stelle) |
| `app.js` | Karte, Hundezonen, Verbotszonen, Suche |
| `details.js` | Punkt-Ebenen (Sackerl, U-Bahn, Menschenmengen …) |
| `environment.js` | Lärmkarte |
| `time.js` | „Wann geht ihr?“, Reizquellen nach Uhrzeit |
| `weather.js` | Wetterzeile und Hunde-Tipps in „Wann geht ihr?“ |
| `data.js` | Laden der Flächen-Daten der Stadt Wien |
| `icons.js` | Icons, Legendenbilder, Muster |
| `sw.js` | Offline-Speicher der App-Dateien |
| `archiv/` | Früherer Rundwegplaner (`walk.js`, `walk.css`, `ROUTING.md`) mit Tests, nicht eingebunden |

## Starten und testen

Lokal mit `node tools/serve.cjs` starten und `http://localhost:8781` öffnen. Die Tests des
alten Rundwegplaners laufen mit `node --test archiv/`. Für eine neue Version die Zahl in `version.js` erhöhen.

## Quellen

Stadt Wien – data.wien.gv.at (CC BY 4.0), Lärmkarte von laerminfo.at (Lden 2022),
Wetter von Open-Meteo.com (CC BY 4.0), Kartengrundlage © OpenStreetMap-Mitwirkende. Details in DATA.md.

## Zeitauswahl (time.js)

Ganz oben in „Entdecken“ steht „Wann geht ihr?“ mit einem zweiteiligen Umschalter: **Jetzt**
(Standard) und **Zeitpunkt** (Tag und eines von sechs gleich langen Zeitfenstern: 2–6, 6–10, 10–14,
14–18, 18–22, 22–2 Uhr). Die Grenzen folgen dem, was sich in der Stadt ändert: 6 (Öffis und
Baustellen beginnen), 10 (Stoßzeit vorbei), 14 (Schule aus), 18 (Geschäfte zu), 22 (Nachtruhe);
12 Uhr liegt in der Mitte. 22–2 gehört zum Abend des gewählten Tags und zählt als „Nacht vor“ dem
nächsten Tag (Freitag 22–2 = Nacht auf Samstag, wie die Nacht-U-Bahn). Feiertage und Wiener Schulferien werden nach festen Regeln
berechnet, ohne Online-Dienst.

Reizquellen, die zu dieser Zeit meist nicht relevant sind, sind ausgegraut, nicht wählbar und nicht
auf der Karte. Auf der Karte steht dann der Hinweis „Reizquellen für jetzt · 15–18
Uhr“; Antippen öffnet die Reizquellen. Die drei Stufen (viel los, a bisserl
was los, ruhig) stehen in time.js (TABLE), aus der Notion-Tabelle „Reizquellen nach Zeit“. Geschätzt,
keine Live-Daten. Sie entscheiden das Ausgrauen und wie stark „Menschenmengen“ leuchten.

Öffis folgen ihren Fahrzeiten (SERVICE in time.js): U-Bahn etwa 5–1 Uhr, Straßenbahn und Bus
5–0:30, S-Bahn 4:30–1, Badner Bahn 5–0:30, Nachtbus 0:30–5 Uhr. In Nächten vor Samstagen, Sonn- und
Feiertagen fahren U-Bahn, S-Bahn und Badner Bahn durch. Bei „Jetzt“ entscheidet die Uhr, bei einem
Zeitfenster zählt, ob das Fahrzeug mindestens die Hälfte davon fährt. Sonst ist der Schalter ausgegraut.

## Wetter (weather.js)

Unter „Wann geht ihr?“ steht ein schmaler Wetterstreifen für das gewählte Zeitfenster (Vorhersage für
die Mitte von Wien, Open-Meteo, bis etwa 7 Tage voraus): Wettersymbol, Temperatur, Regenrisiko (ab 30 %)
und Sonnenuntergang, fast ohne Text. Abends wird der Streifen dunkelrot (mindestens die Hälfte des
Zeitfensters nach Sonnenuntergang), nachts fast schwarz, jeweils mit weißer Schrift. Darunter nur kurze
Hinweise: Gewitter, Sturmböen (ab 60 km/h), heißer Asphalt (ab 25 °C mit Sonne, immer ab 30 °C),
„Glatteis und Streusalz möglich“ (Boden oder Luft um 0 °C und Regen oder Schnee in den 12 Stunden davor, oder gefrierender Regen) und sonst „Streusalz möglich“ (Schnee oder Glätte in den letzten 3 Tagen oder den nächsten 24 Stunden, außer über 5 mm Regen bei Plusgraden haben das Salz seither weggespült). Dafür fragt die Seite auch die letzten 3 Tage ab. Die Warnungen (auch Streusalz)
erscheinen auch rot auf der Karte. Antwortet der Dienst nicht, fehlt das Wetter einfach.
