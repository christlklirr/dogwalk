# Wauz up – Spazierkarte Wien

## Erster Test mit Ninja

Die Karte startet mit Straßenlärm. Straße und Schiene können einzeln oder zusammen angezeigt werden. Ungefärbte Stellen haben keinen dargestellten Pegelbereich. Bäume erscheinen ab Zoom 15 als kleine Punkte, ab 17 größer. Sackerlspender und Trinkbrunnen werden ab Zoom 17 für den sichtbaren Ausschnitt geladen. Märkte, katholische Kirchen, Baustellen und Polizeistationen sind zuschaltbar. Polizeilinien sind persönliche Orientierung, keine rechtlichen Grenzen oder Bewegungsdaten. Der frühere Rundwegplaner ist in dieser Kartenfassung nicht eingebunden.

## Die Dateien lesen lernen

1. **index.html – Was steht auf der Seite?** Suche nach `id="roadNoise"`. Das ist die Checkbox für die Straßenlärmkarte. railNoise steuert separat die Schienenkarte.
2. **style.css – Wie sieht die Seite aus?** Suche nach `--orange`, `--blue` und `--ink`. Das sind die drei Markenfarben. Die Regel für die Überschriften der Kartengruppen verwendet beispielsweise `var(--ink)`. Eine Variable verbindet eine Farbe mit mehreren Bedienelementen.
3. **environment.js – Was passiert nach dem Antippen?** Suche nach `showNoise("road",true)`. Dieser Aufruf lädt beim Start die Straßenlärmkarte. Weiter oben ruft `onchange` dieselbe Funktion mit der ausgewählten Option auf. Dieselbe Datei speichert die selbst eingezeichneten Baustellen auf dem Gerät.
4. **app.js – Wie entsteht die Karte?** Hier erzeugt Leaflet die Karte, lädt die Basiskacheln und legt die Hundepfoten über die Auslaufflächen. Ganz unten aktiviert die App die beiden Bereiche für Lärm und zusätzliche Details.
5. **details.js – Wann erscheint welcher Punkt?** Oben steht eine Liste von Kartenthemen. Suche nach `id:"trees"`. `zoom:15` legt fest, ab wann Bäume geladen werden. Zum Ausprobieren auf einer lokalen Kopie: ändere 15 auf 14, lade die Seite neu und zoome eine Stufe heraus. Damit veränderst du nur die Bäume, nicht die Brunnen.
6. **police.js – Wie werden 100 Meter entlang einer Straße gemessen?** `policeCorridor` sucht eine nahe passende Straßenlinie. Die Funktion projiziert den Stationspunkt auf diese Linie. `trace` folgt dann in jeder Richtung den verbundenen Straßenstücken und kürzt das letzte Stück auf die verbleibende Distanz. Nicht erreichbare Enden bleiben kürzer.
7. **data.js – Woher kommen die bestehenden Kartenobjekte?** Hier werden die Wiener Fachdaten und OSM-Einträge für die bisherigen Ebenen geladen. **manifest.webmanifest** beschreibt Name und App-Symbole. **sw.js** speichert die lokalen App-Dateien für spätere Aufrufe. Live-Kartendienste benötigen eine Verbindung.

## Starten

Für GitHub Pages die entpackten Dateien ins Hauptverzeichnis des bestehenden Repositorys hochladen. Lokal im entpackten Ordner mit Python `python -m http.server 8000` starten und im Browser `http://localhost:8000` öffnen. Die neuen Geometrietests laufen mit `node --test tests/police.test.cjs`. Frühere Routing-Experimente bleiben als Quellcode archiviert.

## Quellen und Genauigkeit

Die Farben der Lärmkarte stammen vom amtlichen INSPIRE-Dienst (Lden, Kartierung 2022); Farben für Menüs und Bedienelemente sind davon unabhängig. Wiener Geodienste liefern u. a. Baumkataster, Trinkbrunnen und Sackerlspender. Die Verkehrsberuhigungsanzeige nutzt OSM-Tags für Wohnstraßen, Fußgängerbereiche, Begegnungs- und Tempo-30-Angaben. OSM liefert auch die zuschaltbaren Märkte, katholisch gekennzeichneten Gottesdienstorte, Polizeistationen und Straßenlinien. Standorte können fehlen. Bei Kirchen sind keine Läutezeiten oder Hörweiten hinterlegt. Baumstandorte geben keine Empfehlung zur Gehsteigseite. Siehe DATA.md für Datenquellen und die Entwicklung der Kartenebenen.

## Fußwege in Cyan (V14)
Unter Grünflächen, Wege & Bäume ab Zoom 16 einschalten. Der Abstand lässt sich auf alle Wege, 20 m oder 30 m stellen. nearpaths.js rastert die Geometrien für die Nachbarsuche und prüft in maximal vier Meter langen Schritten den Abstand zu anderen kartierten Wegen auf derselben OSM-Ebene. Cyan beschreibt ein Wegemuster, keine gesicherte Durchquerung oder Grünfläche. Wegstücke mit bekannten Zugangsbeschränkungen sind grau gestrichelt.
