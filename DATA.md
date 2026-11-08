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

## Wohnanlagen und öffentliche Durchgänge

Pilot Wohnpark Alt-Erlaa. Die Stadt führt den Träger als gemeinnützige Wohnungsaktiengesellschaft. Der blaue Umriss folgt dem OSM-Wohngebiet, ohne Eigentumsgrenze, Bodenbelag oder Zutritt festzulegen. Bei fehlendem Umriss erscheint ein einzelner Standortpunkt. OSM-Geometrie © OpenStreetMap-Mitwirkende, ODbL. Quellen: [OSM-Weg 329356052](https://www.openstreetmap.org/way/329356052), [Standort](https://mapcarta.com/fr/W329356052), [Stadt Wien](https://www.wien.gv.at/wohnen/gemeinnueziger-bautraeger-pruefbericht), [Hausordnung](https://www.alt-erlaa.at/hausordnung/).

Ein öffentlicher Durchgang kann im Bebauungsplan nach § 5 Abs. 4 lit. g BO für Wien festgelegt sein. Plan, Textbestimmung, Umsetzung, Wegzeiten und Hundezutritt sind abschnittsweise zu prüfen. Als Einstieg dienen [Wiener Fußwegekarte](https://www.wien.gv.at/verkehr/fusswegekarte), [Plandokumente](https://www.wien.gv.at/stadtplanung/flaechenwidmung-auskunftssystem) und [Bauordnung](https://ris.bka.gv.at/eli/lgbl/WI/1930/11/P5/LWI40016431). Der Pilot hat keine wienweite Liste privater Eigentümer und importiert keine rechtsverbindlichen Durchgangslinien. Blaue Weglinien entstehen aus lokalen Meldungen. Die blaue Wohnfläche bewirkt keine Routenfreigabe. Für eine lokale Zusatzverbindung sind zusätzlich erlaubter Hundezutritt und die üblichen Anschlussprüfungen erforderlich.

Ein blauer Standortpunkt kennzeichnet den Eingang des freiwilligen Durchgangs Raimundhof an der Mariahilfer Straße 45. Er ist kein Nachweis einer Widmung und keine Routingkante. [Beschreibung und Verbindung](https://bezirksmuseen-wien.at/wp-content/uploads/2023/12/stiegen_text.pdf), [freiwilliger Durchgang](https://www.stadtbekannt.at/spaziergaenge/raimundhof/), [Lagehinweis am Eingang](https://commons.wikimedia.org/wiki/File:Wien_06_Mariahilfer_Stra%C3%9Fe_045_Durchhaus_a.jpg).
