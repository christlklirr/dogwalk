# Wiener Geodaten und Machbarkeit

| Ebene | Wiener WFS-Layer | Verwendung im Pilot |
| --- | --- | --- |
| Hundezonen | HUNDEZONEFLOGD | Flächen und vorhandene Angaben zur Einfriedung. Unbekannter Zaunstatus bleibt offen. |
| Öffentliche Grünflächen | OEFFGRUENFLOGD | Flächen als Orientierung und für die Grünpräferenz der Rundwegsuche. Zugang mit Hund ist gesondert zu prüfen. |
| Gemeindebauten | GEMBAUTENFLOGD | Lage der Anlage. Ein gezeichneter Baukörper belegt keinen begehbaren Innenhof. |
| Hundeverbote | Hundeflächen, HUNDEZONEOGD | Verbote als Hinweise. Ein Punkt bestimmt keine rechtliche Grenze. Unvollständige Daten dürfen keine Route freischalten. |

Der Browser fragt den Wiener WFS mit GetFeature, GeoJSON und EPSG:4326 ab. Der Datenabruf benötigt kein Nutzerkonto. Quelle und Lizenz sind in der App angegeben. Der Aktualisierungszeitpunkt einer Kartenanfrage sagt nichts über die letzte Prüfung einer einzelnen Fläche aus. Der End-to-End-Abruf aus dieser Entwicklungsumgebung war durch die Netzwerkbeschränkung blockiert. CORS, Datenmenge und Live-Feldbelegung sind beim ersten HTTPS-Gerätetest zu prüfen.

[WFS Wien im Datenkatalog](https://www.data.gv.at/katalog/dataset/45a55c97-2122-42a6-823d-f374f1a8bd48) · [Hundeflächen](https://www.data.gv.at/katalog/dataset/28a7419c-f432-4e1a-b0a6-aa9e71968a14) · [Gemeindebauten](https://www.data.gv.at/datasets/a5987f3c-3131-4e6e-b91c-fe0756e69926) · [Nutzungsbedingungen](https://digitales.wien.gv.at/ogd-nutzungsbedingungen/)

## Lokale Orientierungspunkte

Bei Ausfall der Flächendienste enthält das Paket eine kleine gekennzeichnete Auswahl. Beispielpunkte werden vom Rundwegplaner ausgeschlossen. Der Punkt der Hundezone an der Hausfeldstraße stammt aus der von HundePilot am 1. August 2026 synchronisierten Wiener OGD-Standortangabe. Der Parkpunkt am Schrailplatz verwendet die publizierten Koordinaten des Dr.-Rudolf-Hatschek-Parks. Beide sind Ortsangaben ohne eingezeichnete Flächengrenzen.

[Hundezone Hausfeldstraße](https://hundepilot.at/orte/ostbahnbegleitstrasse-hausfeldstrasse-johann-kutschera-gasse-wien) · [Dr.-Rudolf-Hatschek-Park](https://de.wikipedia.org/wiki/Dr.-Rudolf-Hatschek-Park)

## Datenerweiterung

Baumstandorte können bei der Suche nach Baumscheiben helfen. Zugänglichkeit, Umzäunung und nutzbare Bodenfläche müssen eigens erfasst werden. Dasselbe gilt für Grünstreifen und Innenhöfe. Im nächsten Feldtest pro Beobachtung Geometrie, physische Zugänglichkeit, Hundezutritt, Eignung zum Lösen, Quelle und Prüfdatum getrennt erfassen. Für die Bewertung von bergauf und bergab braucht der Graph zusätzlich gerichtete Höhenunterschiede und eine Kennzeichnung der Datenqualität.
