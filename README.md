# Wauz up – Wiener Pfotenwege

Eine Karte der Wiener Pfotenwege, also eine Spazierkarte für Wien mit Hundefokus. Sie läuft im Browser und als App (PWA) über GitHub Pages:
https://christlklirr.github.io/dogwalk/

## Was die Karte zeigt

- **Immer sichtbar:** öffentliche Grünflächen (grün schraffiert), Fußwege (rot gestrichelt in der
  Grundkarte) und Baumstandorte (olivgrün, ab Zoomstufe 15).
- **Hunde:** Hundezonen (orange mit Pfote) und Hundeverbotszonen, beide zuschaltbar.
- **Infrastruktur:** Gackerlsackerl-Spender, Trinkbrunnen, Gemeindebauten, Märkte, Polizei.
- **Reizquellen:** Straßen- und Schienenlärm (amtliche Lärmkarte in Graustufen), U-Bahn,
  Menschenmengen, Spielplätze, Kirchen und Moscheen.
- **Ortssuche** über den Adressdienst der Stadt Wien.

Beim Start ist nichts zugeschaltet. Farben: Petrol = gut für den Hund, Violett = neutral, Rot = belastend.

## Dateien

| Datei | Inhalt |
|---|---|
| `index.html` | Aufbau der Seite: Legende, Schalter, Suchfeld |
| `style.css` | Aussehen |
| `version.js` | Versionsnummer (einzige Stelle) |
| `colors.js` | Alle Kartenfarben (einzige Stelle) |
| `app.js` | Karte, Hundezonen, Grünflächen, Verbotszonen, Gemeindebauten, Suche |
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
