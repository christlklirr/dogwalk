# Wauz up – Wiener Pfotenwege

Eine Karte der Wiener Pfotenwege, also eine Spazierkarte für Wien mit Hundefokus. Sie läuft im Browser und als App (PWA) über GitHub Pages:
https://christlklirr.github.io/dogwalk/

## Was die Karte zeigt

- **Immer sichtbar:** Fußwege (rot gestrichelt in der Grundkarte).
- **Hundeverbotszonen:** zuschaltbar, rot. Ganze Flächen: Bundesgärten, Lainzer Tiergarten,
  Friedhöfe und Parks, die laut Stadt Wien ganz gesperrt sind. Schild: nur ein Teil eines Parks.
- **Hunde:** Hundezonen (orange mit Pfote), zuschaltbar.
- **Infrastruktur:** Gackerlsackerl-Spender, Trinkbrunnen, Baumstandorte (ab Zoomstufe 15).
- **Öffis:** U-Bahn, Straßenbahn, Bus, Nachtbus, S-Bahn und Badner Bahn, jeweils mit Strecken und
  Haltestellen, dazu „Endstationen zum Üben“ (aus den Daten der Wiener Linien).
- **Reizquellen:** Straßen- und Schienenlärm (amtliche Lärmkarte, nur laute Bereiche ab 65 dB, anthrazit mit Kante), U-Bahn,
  „Viel los tagsüber“ (Sehenswürdigkeiten, Fußgängerzonen, Geschäftsstraßen als Band, Märkte),
  „Viel los abends“ (Gastro-Meilen aus den Schanigärten), Spielplätze, Kirchen und Moscheen.
- **Ortssuche** über den Adressdienst der Stadt Wien.

Beim ersten Start ist nichts zugeschaltet; danach merkt sich der Browser die gewählten Ebenen.
Am Handy gibt es unten den Knopf „Ebenen“ (öffnet ein halbes Fenster), Schnellknöpfe für
Hundezonen, Sackerl und Trinkbrunnen sowie eine kleine Legende der eingeschalteten Ebenen. Farben: Petrol = gut für den Hund, Violett = neutral, Rot = belastend.

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
