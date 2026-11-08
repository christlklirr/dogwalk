# DogWalk 🐾

Eine mobile Spazierkarte für Wien mit lokalem Rundweg- und Community-Prototyp. Der erste Kartenausschnitt liegt bei Alt-Erlaa. Die Anwendung besteht aus statischem HTML, CSS und JavaScript. Sie braucht weder einen Build-Schritt noch API-Schlüssel oder eine eigene Datenbank.

## Auf dem Handy öffnen

1. Ein öffentliches GitHub-Repository anlegen und die **entpackten Dateien** in dessen oberste Ebene hochladen. Dort muss direkt die Datei `index.html` liegen.
2. Unter **Settings → Pages → Build and deployment** „Deploy from a branch“, anschließend den Branch `main` und den Ordner `/(root)` wählen und speichern.
3. Nach Abschluss der Pages-Bereitstellung die angezeigte HTTPS-Adresse auf Android in Chrome öffnen. Mit „Mein Standort“ GPS erlauben oder unter „Runde & Wege“ die Kartenmitte als Start übernehmen.
4. Im Chrome-Menü „Zum Startbildschirm hinzufügen“ bzw. „App installieren“ wählen. Verfügbare Menüpunkte hängen vom Browser ab. Eine Internetverbindung ist für Kartenhintergrund und Live-Wegeplanung erforderlich.

Am Computer zum lokalen Test im entpackten Ordner `python -m http.server 8000` starten und `http://localhost:8000` öffnen. GPS und Service Worker benötigen HTTPS oder localhost. Eine HTTP-Adresse im WLAN ist auf dem Handy kein gleichwertiger GPS-Test.

[GitHub Pages einrichten](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)

## Technischer Projektplan

| Etappe | Umsetzung | Abnahmekriterium |
| --- | --- | --- |
| 1 · Mobile Karte | Leaflet, OSM-Kacheln, Wiener Fachlayer, Standort mit Genauigkeit, manuelle Startwahl | Auf Android bei Alt-Erlaa zwei Ebenen umschalten, ein Objekt antippen, GPS einmal erlauben und einmal verweigern. Die manuelle Wahl funktioniert in beiden Fällen. |
| 2 · Rundwege | Ortsbezogene Overpass-Abfrage, lokaler Fußwegegraph, Zielstrecke oder Dauer und Präferenzen | Eine Runde vom selben Knoten beginnen und beenden. Eine bekannte Stiege im Vermeidungsmodus sowie ein gesperrter Abschnitt dürfen im Routenvorschlag nicht vorkommen. |
| 3 · Lokale Ergänzungen | Zeichnen oder GPS-Aufzeichnung, Eigenschaften, Quellenvermerk, lokale Freigabe, GeoJSON-Export | Einen Weg speichern, Browser schließen, wieder öffnen und exportieren. Ein ungeklärter Weg bleibt bei der Routensuche ausgeschlossen. |
| 4 · Praxistest mit Ninja | Dieselbe Runde mit und ohne geprüften Testpfad vergleichen | Anschlusspunkte, tatsächliche Gehstrecke, Stiegen, Tor und Zugang vor Ort protokollieren. Erfasstes Ergebnis mit dem Vorschlag vergleichen. |
| 5 · Gemeinsame Karte | Später PostGIS/Supabase, serverseitige Geometrieprüfung, Versionen, getrennte Bestätigungen und Moderation | Ein zweites Konto kann eine Meldung bestätigen oder widersprechen. Widerruf und Sperre entfernen eine Verbindung aus dem Routing. |

### Datenlücken und Entscheidungen

- **Direkt nutzbar:** Gemeldete Hundezonen, Parkflächen und Gemeindebauten anzeigen. Die Geometrie ist stets der Gegenstand des jeweiligen Datensatzes. Ein Wohnblockumriss beschreibt keinen Durchgang. „Im Kartenausschnitt“ zeigt bis zu acht der nächstgelegenen geladenen Objekte, gemessen zur Kartenmitte als Luftlinie.
- **Nur mit ausreichenden Daten:** Der Zaunfilter verlangt eine positive Angabe. OSM-Tags liefern Hinweise auf Stiegen und Steigung. Fehlende Werte erlauben keine Zusicherung eines ebenen oder stufenfreien Wegs. Straßenklassen sind ein Ersatzmaß für Verkehrsbelastung. Die Richtzeit von 4 km/h dient zur Planung.
- **Vor Ort zu klären:** Ein- und Ausgänge, zeitweise offene Tore, Zutritt mit Hund, offene Baumscheiben und Eignung zum Lösen. Neue Pfade bleiben zunächst lokale Entwürfe. Die Lage des im Briefing erwähnten Pfades ist noch offen.
- **Später:** Baumkataster mit verifizierten Baumscheibenmerkmalen verbinden, Grünstreifen als eigene Objekte erfassen, Geländedaten für gerichtete Steigung auswerten. Gemeinsame Entscheidungen über Zugang benötigen eine datierte Quelle, einen Geltungsbereich und einen nachvollziehbaren Änderungsverlauf.

### Architektur und Betrieb

`app.js` verbindet Karte, GPS und Kartenebenen. `data.js` kapselt die Datenbeschaffung. `walk.js` erzeugt den lokalen Graphen und verwaltet Wegentwürfe. GeoJSON ist das Austauschformat. Die Manifest- und Service-Worker-Dateien verwenden relative URLs und funktionieren damit auch unter einem GitHub-Projektpfad. Der Service Worker speichert die Anwendungshülle. OSM-Kacheln werden nur für den sichtbaren Ausschnitt angefordert. Die App lädt Leaflet in festgelegter Version vom CDN.

Für den Pilotbetrieb fallen keine eigenen Serverkosten an. Öffentliche WFS-, Overpass- und Kacheldienste bieten keine garantierte Verfügbarkeit. Vor einer breiten Veröffentlichung den Pilotgraph regional vorberechnen, Fachdaten mit Zeitstand und Lizenz speichern und reale Last messen. Der manuelle GeoJSON-Export ist die Sicherungsmöglichkeit für lokale Meldungen.

[Wiener OGD-Nutzungsbedingungen](https://digitales.wien.gv.at/ogd-nutzungsbedingungen/) · [OSM-Kachelnutzung](https://operations.osmfoundation.org/policies/tiles/) · [OSM-Lizenz](https://www.openstreetmap.org/copyright)

Die geprüften Fachdaten und ihre Grenzen stehen in [DATA.md](DATA.md). Die genaue Testanleitung für den ersten Pfad steht in [ROUTING.md](ROUTING.md).

Die automatisierten Routingprüfungen lassen sich im Projektordner mit `node --test tests/routing.test.cjs` ausführen.
Fehlen Wiener Verbotsflächen, erscheint eine gestrichelte Routenvorschau. Bekannte Verbote werden berücksichtigt. Lokale Zusatzwege bleiben in diesem Modus ausgeschlossen.

Die reduzierte Planungsansicht startet mit 1 km. Grün und Hundeverbote sind feste Vorgaben. Parks werden für den Kartenausschnitt bzw. das Suchgebiet geladen. Nur die gemeldete Verbotsgeometrie erscheint rot. Der Park behält seine grüne Grundfarbe.
