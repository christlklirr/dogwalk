# Wiener Geodaten und Machbarkeit

| Ebene | Wiener WFS-Layer | Verwendung im Pilot |
| --- | --- | --- |
| Hundezonen | HUNDEZONEFLOGD | Flächen und vorhandene Angaben zur Einfriedung. Unbekannter Zaunstatus bleibt offen. |
| Öffentliche Grünflächen | OEFFGRUENFLOGD | Flächen als Orientierung und für die Grünpräferenz der Rundwegsuche. Zugang mit Hund ist gesondert zu prüfen. |
| Hundeverbote | Hundeflächen, HUNDEZONEOGD | Verbote als Hinweise. Ein Punkt bestimmt keine rechtliche Grenze. Unvollständige Daten dürfen keine Route freischalten. |
| Hundeverbotsflächen | OEFFGRUENFLOGD (Namensliste BAN_GARDENS in data.js: Schönbrunn, Belvedere, Burggarten, Volksgarten, Lainzer Tiergarten), REALNUT2016GOGD (NUTZUNG_LEVEL3 = Friedhof), bans-parks.json | Von Hand gepflegte Liste plus alle Friedhofsflächen (Hinweis: Hunde in der Regel nicht erlaubt). bans-parks.json entsteht mit node tools/build-bans.cjs: Ein Verbotspunkt, dessen Verbotsfläche mindestens 75 % seiner Grünfläche ausmacht, wird als ganze Grünfläche gezeichnet; die übrigen bleiben Schilder mit dem Anteil am Park in ganzen Prozent (z. B. „etwa 40 %“, sehr kleine Teile „unter 1 %“). Ab und zu neu erzeugen. |

Der Browser fragt den Wiener WFS mit GetFeature, GeoJSON und EPSG:4326 ab. Der Datenabruf benötigt kein Nutzerkonto. Quelle und Lizenz sind in der App angegeben. Der Aktualisierungszeitpunkt einer Kartenanfrage sagt nichts über die letzte Prüfung einer einzelnen Fläche aus. Der End-to-End-Abruf aus dieser Entwicklungsumgebung war durch die Netzwerkbeschränkung blockiert. CORS, Datenmenge und Live-Feldbelegung sind beim ersten HTTPS-Gerätetest zu prüfen.

[WFS Wien im Datenkatalog](https://www.data.gv.at/katalog/dataset/45a55c97-2122-42a6-823d-f374f1a8bd48) · [Hundeflächen](https://www.data.gv.at/katalog/dataset/28a7419c-f432-4e1a-b0a6-aa9e71968a14) · [Gemeindebauten](https://www.data.gv.at/datasets/a5987f3c-3131-4e6e-b91c-fe0756e69926) · [Nutzungsbedingungen](https://digitales.wien.gv.at/ogd-nutzungsbedingungen/)

## Lokale Orientierungspunkte



## Datenerweiterung

Baumstandorte können bei der Suche nach Baumscheiben helfen. Zugänglichkeit, Umzäunung und nutzbare Bodenfläche müssen eigens erfasst werden. Dasselbe gilt für Grünstreifen und Innenhöfe. Im nächsten Feldtest pro Beobachtung Geometrie, physische Zugänglichkeit, Hundezutritt, Eignung zum Lösen, Quelle und Prüfdatum getrennt erfassen. Für die Bewertung von bergauf und bergab braucht der Graph zusätzlich gerichtete Höhenunterschiede und eine Kennzeichnung der Datenqualität.

## Wohnanlagen und öffentliche Durchgänge

Eine wienweite, mindestens wöchentlich gepflegte offene Bestandsliste aller gemeinnützigen Wohnanlagen konnte nicht bestätigt werden. Die Beispielebene wurde in Version 10 entfernt. Geprüft: GBV-Mitgliederverzeichnis, Verbandsstatistik, Wiener Prüfberichte und öffentlich zugängliche Wohnbaudaten.

Ein öffentlicher Durchgang kann im Bebauungsplan nach § 5 Abs. 4 lit. g BO für Wien festgelegt sein. Plan, Textbestimmung, Umsetzung, Wegzeiten und Hundezutritt sind abschnittsweise zu prüfen. Als Einstieg dienen [Wiener Fußwegekarte](https://www.wien.gv.at/verkehr/fusswegekarte), [Plandokumente](https://www.wien.gv.at/stadtplanung/flaechenwidmung-auskunftssystem) und [Bauordnung](https://ris.bka.gv.at/eli/lgbl/WI/1930/11/P5/LWI40016431). Der Pilot hat keine wienweite Liste privater Eigentümer und importiert keine rechtsverbindlichen Durchgangslinien. Blaue Weglinien entstehen aus lokalen Meldungen. Die blaue Wohnfläche bewirkt keine Routenfreigabe. Für eine lokale Zusatzverbindung sind zusätzlich erlaubter Hundezutritt und die üblichen Anschlussprüfungen erforderlich.


## Ergänzungen in Version 8

Hundezonen im Kartenausschnitt nutzen typisierte Wiener Daten und ergänzend OSM-Objekte mit leisure=dog_park (Punkte und geschlossene Ways). Unklassifizierte Einträge eines gemischten Layers erhalten keine Verbotsfarbe. Die Darstellung priorisiert bestätigte Auslaufgeometrie bei überdeckenden Kartenflächen. Download und Abdeckung der externen Dienste können variieren.


## Baustellen und Geräusche (Version 9)

Die amtliche Ebene verwendet den Wiener Kartendienst mit BAUSTELLENLINOGD und BAUSTELLENPKTOGD. Die MA 46 koordiniert verkehrsrelevante Baustellen im höherrangigen Netz. Ein Baustellensymbol beschreibt keine aktuelle Geräuschmessung oder bestätigte Fußwegsperre. Kleine oder private Bauarbeiten können fehlen. Eigene Hinweise lassen sich als Punkt oder Linie mit Datum und kurzer Beobachtung lokal speichern und später entfernen. [Baustellenkoordinierung](https://www.wien.gv.at/verkehr/baustellen-koordinierung) · [Aktuelle Baustellen](https://www.wien.gv.at/verkehr/aktuelle-baustellen) · [Wiener Netze](https://www.wienernetze.at/baustellen)

Der INSPIRE-Darstellungsdienst verwendet 2022_STRASSE_24H_ZONEN_OE und 2022_SCHIENE_24H_ZONEN_OE. Pro Ansicht ist eine Quelle aktiv. Lden ist ein langfristiger Tag-Abend-Nacht-Index mit Gewichtung von Abend und Nacht. Betrachtet werden Straßen- bzw. Schienenverkehr einschließlich Straßenbahnen im Ballungsraum. Busverkehr ist keine eigene Ebene. Baugeräusche, einzelne Vorbeifahrten und Tagesform des Hundes sind darin nicht gemessen. Die subjektive Auswahl aktiviert eine Karte und wird nicht gespeichert. Eine lärmbasierte Routenoptimierung benötigt eine gesonderte Bewertung einzelner Wegabschnitte und der Datenabdeckung. Datenquelle: [www.laerminfo.at](https://www.laerminfo.at/) · [GIS-Metadaten und CC BY 4.0](https://www.laerminfo.at/laermkarten/methoden/inspire.html).

## Version 13

Menschenmengen: SEHENSWUERDIGOGD, TOURISTIKHTSBIGOGD und TOURISTIKHTSVSLOGD (Sightseeing-Haltestellen) sowie FUSSGEHERZONEOGD und BEGEGNUNGSZONEOGD (z. B. Mariahilfer Straße). Das ist ein Hinweis auf häufigen Andrang, keine gemessene Personenzahl.

Live abgefragt wurden POLIZEIOGD (Punkte), RELIGIONOGD (Punkte, Typ und Unterkategorie), MARKTFLAECHEOGD und MARKTGEBIETOGD (Polygone, ständige und temporäre Märkte, Floh- und Antiquitätenmarkt), SPIELPLATZPUNKTOGD, UBAHNHALTOGD und BAUMKATOGD. Kirchen und Moscheen sind Einträge vom Typ Kirche/Kapelle (alle Konfessionen) oder Moschee. Hauskapellen in Pflegeheimen, Spitälern, Schulen und Ämtern führt die Stadt unter dem Namen der Einrichtung; sie werden ausgelassen, außer der Name nennt ausdrücklich Kirche, Kapelle oder Pfarre. Die Stadt führt nur eine Moschee; der OSM-Ersatz enthält christliche und muslimische Gebetsorte. Bei Ausfall gibt es für Kirchen und U-Bahn einen gekennzeichneten OSM-Ersatz. Polizei und Märkte sind keine eigenen Ebenen mehr; die Marktflächen zählen zu „Viel los tagsüber“. Ein leerer Ausschnitt ist ein gültiges Ergebnis.

U-Bahn-Umstiege werden über gemeinsame Stationsnamen und unterschiedliche U-Bahn-Linien erkannt. Keine aktuelle kleinräumige Frequenzquelle bestätigt. Siehe https://www.wien.gv.at/statistik/ und https://positionen.wienerstadtwerke.at/wissenshub/grafiken/fahrgaeste-der-wiener-linien. Ein automatischer Attraktivitätswert bleibt ein späterer Entwicklungsschritt.

Viel los tagsüber: SEHENSWUERDIGOGD, TOURISTIKHTSBIGOGD, TOURISTIKHTSVSLOGD, FUSSGEHERZONEOGD, BEGEGNUNGSZONEOGD, STRUKGESCHSTROGD (Geschäftsstraßen 1.–3. Ordnung als Flächen entlang der Straße). Punkte in Hundeverbotsflächen werden weggelassen. Viel los abends: SCHANIGARTENOGD; gezeigt werden nur Schanigärten mit mindestens vier weiteren im Umkreis von 80 m, als weicher Schimmer.

## Neue Ebenen (V62)

| Ebene | Datensatz (ogdwien:…) | Hinweis |
| --- | --- | --- |
| Grünflächen (immer sichtbar) | FMZKGRUEN2OGD (Flächen-Mehrzweckkarte), als WMS-Bild | Nur LAYER Grünfläche, Sonstige Grünfläche, Wiese (CQL_FILTER). Die Stadt zeichnet das Bild, die App färbt jedes gezeichnete Pixel hellgrün (#cdebb0, wie die Parks der Grundkarte). Ab Zoomstufe 14. Enthält auch Höfe von Gemeindebauten und Genossenschaften. Eigene Stile (SLD_BODY) lässt der Dienst nicht zu. |
| Badestellen | BADESTELLENOGD | Punkte. |
| Spazier- und Wanderwege | SPAZIERLINIEOGD, WANDERWEGEOGD | Linien, orange. |
| Öffentliche WCs | WCANLAGE2OGD | Nur AKTIV_TXT ungleich NEIN. |
| Schulen und Kindergärten | SCHULEOGD, KINDERGARTENOGD | Punkte. |
| Großbaustellen | construction.json (OpenStreetMap, landuse=construction, erzeugt mit node tools/build-construction.cjs) | Als dunkle Fläche in „Baustellen“. Baustellen, die weniger als 40 m auseinander liegen, zählen als eine und bekommen ab zusammen etwa 3000 m² ein gemeinsames Schild. Dieselben Flächen werden aus den Grünflächen ausgespart, weil die Flächen-Mehrzweckkarte manche neue Baustelle noch als Wiese führt (z. B. In der Wiesen Ost-Süd). Ab und zu neu erzeugen. |
| Baustellen | BAUSTELLENLINOGD, BAUSTELLENPKTOGD | Aktuelle Verkehrsbaustellen, Linien dick rot gestrichelt; Popup mit Art, Enddatum und erstem Satz des Pressetexts. Die „Bausperre“ der Flächenwidmung (BAUSPERRE82OGD, BAUSPERRE86OGD) ist keine Baustelle, sondern ein vorläufiges Bauverbot während einer Planänderung. |

Geprüft, aber nicht nutzbar: Der Flächenwidmungsplan (GENFLWIDMUNGOGD) zeigt nur die Widmung, nicht wem eine Fläche gehört. Für Genossenschaften gibt es keine offenen Daten; Gemeindebauten gibt es als GEMBAUTENFLOGD.
