# Rundwege und der erste Community-Pfad

Die Kartenansicht ist der erste Meilenstein. „Runde & Wege“ ergänzt einen lokalen Versuchsplaner. Die Wegeabfrage erfolgt erst beim Suchen einer Runde oder beim Vergleich eines Entwurfs mit OSM. Overpass erhält dafür einen auf vier Dezimalstellen gerundeten Mittelpunkt und den Suchradius. Wegentwurf und GPS-Aufzeichnung bleiben auf dem Gerät. Ein Export enthält die genauen Koordinaten des Wegs.

## Eine Runde ausprobieren

1. Standort bestimmen oder die Karte so verschieben, dass der gewünschte Start in der Mitte liegt. In „Rundweg planen“ die Kartenmitte übernehmen.
2. 0,5 bis 5 km oder 8 bis 75 Minuten auswählen. Die Zeit entspricht einem einstellungsunabhängigen Richtwert von 4 km/h. Schnüffelpausen können sie verlängern.
3. Die Runde berechnen. Grünflächen und bekannte Hundeverbote sind fest eingestellt. Stiegen, Steigung und Straßenklassen haben in dieser Version keine eigene Gewichtung. Die orange Linie folgt den berücksichtigten Wegknoten. Ein kurzer gemeinsamer Hin- und Rückweg ist möglich. Die Anzeige nennt die Distanz vom gewählten Start zum ersten Knoten. Den Zugang zu diesem Knoten selbst prüfen.
4. Für den Vergleich denselben Start und dieselben Einstellungen einmal mit und einmal ohne lokal geprüfte Wege verwenden.

## Einen fehlenden Weg testen

1. Unter „Weg erfassen“ auf „Auf Karte zeichnen“ tippen und dem Wegverlauf folgen. Alternativ GPS starten und den Weg abgehen. Bei mehr als 30 m gemeldeter Ungenauigkeit pausiert die Punktübernahme. Weitere Punkte brauchen mindestens 5 m Abstand. Beim Wechsel in den Hintergrund pausiert die Aufnahme. Nach dem letzten Punkt die Aufnahme beenden.
2. „Mit OSM-Wegen vergleichen“ überlagert den Entwurf mit den berücksichtigten OSM-Wegeklassen und zeigt für beide Endpunkte den Abstand zum nächsten geeigneten Knoten. Auch den normalen OSM-Kartenhintergrund prüfen. Ein optisch freier Zwischenraum allein belegt keine Kartierungslücke.
3. Oberfläche, Stiegen, Gelände und Zugangsstatus eintragen und speichern. Ungeklärte Wege sind private Entwürfe. Über „bearbeiten“ später aktualisieren oder löschen.
4. Die lokale Prüffreigabe erfordert bestätigten Verlauf, beide begehbaren Anschlüsse, erlaubten Durchgang mit Hund und eine nachvollziehbare Quellenangabe. Das ist eine private Selbstauskunft. Eine unabhängige Moderation ist ein späterer Meilenstein.
5. Sobald ein lokal geprüfter Weg vorliegt, für die Routenberechnung zusätzlich „Lokal geprüfte Wege einbeziehen“ aktivieren. Beide Enden brauchen unterschiedliche geeignete Netzknoten in jeweils weniger als 8 m Abstand. Der Algorithmus prüft die einzelnen Abschnitte einschließlich Anschluss gegen geladene Verbotsflächen. Die Enden werden an die Knoten angepasst. Fehlt am echten Abzweig ein OSM-Knoten, kann der MVP diesen Anschluss noch nicht herstellen. Gleich hohe Ebenen und tatsächlich passierbare Übergänge müssen vor Ort geprüft werden.
6. „Wege als GeoJSON exportieren“ sichert eine FeatureCollection mit Geometrien, Eigenschaften und Prüfdatum. Löschen von Browserdaten entfernt die lokale Sammlung.

Die Lage des bekannten Pfades fehlt im Briefing. Eine Aussage über seine derzeitige OSM-Erfassung und ein realer Vergleich mit Ninja stehen aus.

## Berechnungsgrundlage

- Ein Overpass-Abruf liest verbundene Knoten und Ways der Klassen footway, pedestrian, steps, path, living_street und residential. Der zweite Test mit demselben Gebiet verwendet die Antwort zehn Minuten lang erneut. Ein neuer Abruf läuft nach 30 Sekunden ab.
- Normale Fußwege und Wohnstraßen können ohne ausdrückliche Zugangskennzeichnung vorkommen. Pfade der Klasse path sind nur mit positiver Zugangskennzeichnung zugelassen. Bekannte Barrieren, Öffnungszeiten, bedingte Rechte, gerichtete Fußbeschränkungen und beschränkter Zugang schließen die betroffenen Wege bzw. Knoten aus. Fehlende Attribute lassen unbekannte private Zugänge, Barrieren oder Verbote offen.
- Wegeabschnitte werden gegen die geladenen Hundeverbotsflächen geometrisch geprüft. Bei fehlenden oder unvollständigen Verbotsflächen erscheint eine gestrichelte Routenvorschau auf dem OSM-Wegenetz. Bekannte Verbote bleiben berücksichtigt, lokale Zusatzwege sind für diese Vorschau ausgeschlossen. Fehlende Parkdaten setzen die Grünpräferenz aus. Eine ausdrücklich gewählte Hundezonenbedingung benötigt weiterhin verlässliche Daten. Die Rechtslage auf nicht erfassten Flächen bleibt offen. Nahe der Wiener Stadtgrenze können Wege den Bereich der Wiener Fachdaten verlassen.
- Der Planer bildet einen gewichteten kürzesten Wegebaum und sucht verbindende Querkanten. Er bewertet die entstehenden Runden nach Länge, gemeinsamem Hin- und Rückweg, Grünanteil in der Umgebung und Gewicht der Wohnstraßen. Für Grün nutzt er die Nähe zur Flächenmitte oder einen Knoten innerhalb einer Grünfläche. Eine ausgewählte Hundezone muss an der Route oder nahe einem Routenknoten liegen. Die Entfernung zu einem Eingang und dessen Passierbarkeit sind unbekannt. Fehlende Angaben zur Einzäunung zählen beim Zaunfilter nicht als Treffer.
- Angaben zu Stiegen und Steigung beziehen sich auf bekannte Karteneinträge. Straßenklasse dient als Annäherung an Verkehr. Weder Steigungsprofil noch Verkehrsaufkommen sind gemessen. Überquerungen können an realen Hauptstraßen unterbrochen sein, weil der MVP deren Fahrbahnen auslässt. Der Suchradius und der Rundentoleranzbereich begrenzen die Suche; eine fehlende Runde bedeutet keine nachgewiesene Unbegehbarkeit.
- Keine laufenden Serverkosten für den Prototyp. Die öffentlichen Datendienste bieten keine projektbezogene Verfügbarkeitsgarantie. Für die nächste Stufe regionale Datenstände mit ausgewiesener Abdeckung und ein vorgerechnetes Wegenetz einführen. Moderierte Freigaben, zeitliche Zutrittsregeln, gerichtete Steigung und die Anbindung an freigegebene Wegsegmente benötigen ein erweitertes Datenmodell.

## Geprüft

Ein kontrolliertes, synthetisches Wegenetz aus drei Seiten eines Rechtecks lieferte ohne Zusatzweg keine Runde. Ein ungeprüfter Weg blieb ausgeschlossen. Nach lokaler Bestätigung schloss derselbe Weg eine Runde von 519 m. Eine künstliche Verbotsfläche quer durch die neue Verbindung verhinderte die Runde. Der JavaScript-Syntaxcheck lief erfolgreich. Der direkte Abruf von Overpass war im Entwicklungsnetz durch fehlende Namensauflösung blockiert. Ein Realtest mit Live-Dienst, GPS, Android und echten Beschilderungen bleibt erforderlich.

[Overpass-Abfragesprache](https://wiki.openstreetmap.org/wiki/Overpass_API/Language_Guide) · [OpenStreetMap-Mitwirkende und Lizenz](https://www.openstreetmap.org/copyright)
