# Wauz up – Wiener Pfotenwege

Eine Karte der Wiener Pfotenwege, also eine Spazierkarte für Wien mit Hundefokus. Sie läuft im Browser und als App (PWA) über GitHub Pages:
https://christlklirr.github.io/dogwalk/

## Was die Karte zeigt

- **Immer sichtbar:** Fußwege (rot gestrichelt in der Grundkarte).
- **Hundeverbotszonen:** zuschaltbar, rot. Ganze Flächen: Bundesgärten, Lainzer Tiergarten,
  Friedhöfe und Parks, die laut Stadt Wien ganz gesperrt sind. Schild: nur ein Teil eines Parks.
- **Hunde:** Hundezonen (orange mit Pfote), zuschaltbar.
- **Immer sichtbar:** Grünflächen der Stadt (hellgrün wie die Parks der Grundkarte, ab Zoomstufe 14,
  auch Höfe von Gemeindebauten und Genossenschaften; als Bild von der Stadt Wien, daher schnell).
- **Infrastruktur:** Baumstandorte
  (ab Zoomstufe 15), Gackerlsackerl-Spender, Trinkbrunnen, Badestellen,
  Spazier- und Wanderwege (orange), öffentliche WCs.
- **Öffis:** U-Bahn, Straßenbahn, Bus, Nachtbus, S-Bahn und Badner Bahn, jeweils mit Strecken und
  Haltestellen, dazu „Endstationen zum Üben“ (aus den Daten der Wiener Linien).
- **Reizquellen:** Straßen- und Schienenlärm (amtliche Lärmkarte, nur laute Bereiche ab 65 dB, anthrazit mit Kante), U-Bahn,
  „Menschenmengen“ (tagsüber gelb: Sehenswürdigkeiten, Fußgängerzonen, Geschäftsstraßen, Märkte;
  abends violett: Gastro-Meilen aus den Schanigärten; dazu große Umsteigestationen der U-Bahn), Spielplätze,
  Schulen und Kindergärten, Radwege (ab Zoomstufe 14), Baustellen auf Straßen (rot gestrichelt).
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
| `details.js` | Punkt-Ebenen (Bäume, Sackerl, U-Bahn, Menschenmengen …) |
| `environment.js` | Lärmkarte |
| `data.js` | Laden der Flächen-Daten der Stadt Wien |
| `icons.js` | Icons, Legendenbilder, Muster |
| `sw.js` | Offline-Speicher der App-Dateien |
| `walk.js`, `walk.css`, `ROUTING.md` | Früherer Rundwegplaner, derzeit nicht eingebunden |

## Starten und testen

Lokal einen einfachen Webserver im Ordner starten und `http://localhost:…` öffnen. Die Tests
laufen mit `node --test tests/`. Für eine neue Version die Zahl in `version.js` erhöhen.

## Quellen

Stadt Wien – data.wien.gv.at (CC BY 4.0), Lärmkarte von laerminfo.at (Lden 2022),
Kartengrundlage © OpenStreetMap-Mitwirkende. Details in DATA.md.

## Zeitauswahl (time.js)

Ganz oben in „Reizquellen“ steht „Wann gehst du?“ mit einem zweiteiligen Umschalter: **Jetzt**
(Standard) und **Zeitpunkt** (Tag und eines von sieben Zeitfenstern: 0–6, 6–9, 9–12, 12–15, 15–18,
18–21, 21–24 Uhr). Feiertage und Wiener Schulferien werden nach festen Regeln
berechnet, ohne Online-Dienst.

Reizquellen, die zu dieser Zeit meist nicht relevant sind, sind ausgegraut, nicht wählbar und nicht
auf der Karte. Auf der Karte steht dann der Hinweis „Reizquellen für jetzt · 15–18
Uhr“; Antippen öffnet die Reizquellen. Die drei Stufen (viel los, a bisserl
was los, ruhig) stehen in time.js (TABLE), aus der Notion-Tabelle „Reizquellen nach Zeit“. Geschätzt,
keine Live-Daten. Sie entscheiden das Ausgrauen und wie stark „Menschenmengen“ leuchten.
