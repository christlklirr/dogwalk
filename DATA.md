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

Eine wienweite, mindestens wöchentlich gepflegte offene Bestandsliste aller gemeinnützigen Wohnanlagen konnte nicht bestätigt werden. Die Beispielebene wurde in Version 10 entfernt. Geprüft: GBV-Mitgliederverzeichnis, Verbandsstatistik, Wiener Prüfberichte und öffentlich zugängliche Wohnbaudaten.

Ein öffentlicher Durchgang kann im Bebauungsplan nach § 5 Abs. 4 lit. g BO für Wien festgelegt sein. Plan, Textbestimmung, Umsetzung, Wegzeiten und Hundezutritt sind abschnittsweise zu prüfen. Als Einstieg dienen [Wiener Fußwegekarte](https://www.wien.gv.at/verkehr/fusswegekarte), [Plandokumente](https://www.wien.gv.at/stadtplanung/flaechenwidmung-auskunftssystem) und [Bauordnung](https://ris.bka.gv.at/eli/lgbl/WI/1930/11/P5/LWI40016431). Der Pilot hat keine wienweite Liste privater Eigentümer und importiert keine rechtsverbindlichen Durchgangslinien. Blaue Weglinien entstehen aus lokalen Meldungen. Die blaue Wohnfläche bewirkt keine Routenfreigabe. Für eine lokale Zusatzverbindung sind zusätzlich erlaubter Hundezutritt und die üblichen Anschlussprüfungen erforderlich.

Ein blauer Standortpunkt kennzeichnet den Eingang des freiwilligen Durchgangs Raimundhof an der Mariahilfer Straße 45. Er ist kein Nachweis einer Widmung und keine Routingkante. [Beschreibung und Verbindung](https://bezirksmuseen-wien.at/wp-content/uploads/2023/12/stiegen_text.pdf), [freiwilliger Durchgang](https://www.stadtbekannt.at/spaziergaenge/raimundhof/), [Lagehinweis am Eingang](https://commons.wikimedia.org/wiki/File:Wien_06_Mariahilfer_Stra%C3%9Fe_045_Durchhaus_a.jpg).

## Ergänzungen in Version 8

Hundezonen im Kartenausschnitt nutzen typisierte Wiener Daten und ergänzend OSM-Objekte mit leisure=dog_park (Punkte und geschlossene Ways). Unklassifizierte Einträge eines gemischten Layers erhalten keine Verbotsfarbe. Die Darstellung priorisiert bestätigte Auslaufgeometrie bei überdeckenden Kartenflächen. Download und Abdeckung der externen Dienste können variieren.


## Baustellen und Geräusche (Version 9)

Die amtliche Ebene verwendet den Wiener Kartendienst mit BAUSTELLENLINOGD und BAUSTELLENPKTOGD. Die MA 46 koordiniert verkehrsrelevante Baustellen im höherrangigen Netz. Ein Baustellensymbol beschreibt keine aktuelle Geräuschmessung oder bestätigte Fußwegsperre. Kleine oder private Bauarbeiten können fehlen. Eigene Hinweise lassen sich als Punkt oder Linie mit Datum und kurzer Beobachtung lokal speichern und später entfernen. [Baustellenkoordinierung](https://www.wien.gv.at/verkehr/baustellen-koordinierung) · [Aktuelle Baustellen](https://www.wien.gv.at/verkehr/aktuelle-baustellen) · [Wiener Netze](https://www.wienernetze.at/baustellen)

Der INSPIRE-Darstellungsdienst verwendet 2022_STRASSE_24H_ZONEN_OE und 2022_SCHIENE_24H_ZONEN_OE. Pro Ansicht ist eine Quelle aktiv. Lden ist ein langfristiger Tag-Abend-Nacht-Index mit Gewichtung von Abend und Nacht. Betrachtet werden Straßen- bzw. Schienenverkehr einschließlich Straßenbahnen im Ballungsraum. Busverkehr ist keine eigene Ebene. Baugeräusche, einzelne Vorbeifahrten und Tagesform des Hundes sind darin nicht gemessen. Die subjektive Auswahl aktiviert eine Karte und wird nicht gespeichert. Eine lärmbasierte Routenoptimierung benötigt eine gesonderte Bewertung einzelner Wegabschnitte und der Datenabdeckung. Datenquelle: [www.laerminfo.at](https://www.laerminfo.at/) · [GIS-Metadaten und CC BY 4.0](https://www.laerminfo.at/laermkarten/methoden/inspire.html).

## Version 13

Live abgefragt wurden POLIZEIOGD (Punkte), RELIGIONOGD (Punkte, Typ und Unterkategorie), MARKTFLAECHEOGD (Polygone), SPIELPLATZPUNKTOGD, UBAHNHALTOGD und BAUMKATOGD. Katholische Kirchen sind ausdrücklich als Kirche/Kapelle und katholisch klassifizierte Einträge. Bei Ausfall gibt es für Kirchen, Märkte, U-Bahn und Polizei einen gekennzeichneten OSM-Ersatz. Straßen für die Polizeiumgebung laden gesondert. Ein leerer Ausschnitt ist ein gültiges Ergebnis.

Wege im Grün basieren auf OSM-Wegen in oder durch kartierte Park- und Grasbereiche. Es sind vollständige Wegobjekte, kein amtlicher Nachweis von Eigentum, Wegerecht oder einer Genossenschaft. Einschätzung gemäß expliziten Zugangsmerkmalen; unklare Abschnitte erhalten keine positive Zugangsaussage. Für das gesamte umgebende Areal wird keine Freigabe abgeleitet. U-Bahn-Umstiege werden über gemeinsame Stationsnamen und unterschiedliche U-Bahn-Linien erkannt. Keine aktuelle kleinräumige Frequenzquelle bestätigt. Siehe https://www.wien.gv.at/statistik/ und https://positionen.wienerstadtwerke.at/wissenshub/grafiken/fahrgaeste-der-wiener-linien. Ein automatischer Attraktivitätswert bleibt ein späterer Entwicklungsschritt.
