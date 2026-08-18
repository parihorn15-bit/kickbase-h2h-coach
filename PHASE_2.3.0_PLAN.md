# Phase 2.3.0 – Dynamic Bundesliga Master & Smart Screenshot Linking

## Ziel
Die Screenshot-Pipeline soll Transfers und Aufstellungen robust erfassen, auch wenn reale Bundesliga-Kader sich ändern oder bestehende Manager-Kader noch unvollständig sind.

## Kernprinzipien
- Aktueller Bundesliga-Master mindestens täglich synchronisieren.
- Stabile Spieleridentität über `external_id`, nicht über sichtbaren Namen oder aktuellen Verein.
- Historische Transfer-/Aufstellungsdaten niemals rückwirkend durch echte Vereinswechsel verfälschen.
- Screenshot-Aufstellungen als vollständige Snapshots speichern, unabhängig vom bereits bekannten Manager-Kader.
- Offene/unsichere Spieler nach jedem Master-Update automatisch erneut auflösen.
- Importstatus: `sicher`, `prüfen`, `offen`; nur sichere Treffer automatisch übernehmen.
- Manager-Zuordnung: sichtbarer Teamname im Screenshot ist primäres Signal, Kaderabgleich nur Fallback.
- Reihenfolgeunabhängig: Aufstellung vor Transfers und Transfers vor Aufstellung müssen zum selben Endzustand führen.

## Dev-Stand
### Dev1
- sichtbarer Teamname priorisiert
- Master-Resolver für exakte/abgeschnittene/OCR-fehlerhafte Spielernamen
- eigenständige Aufstellungs-Snapshots mit Master-ID, Team, Position und Confidence

### Dev2
- Master-Freshness und automatisches Re-Resolving nach Master-Updates
- Snapshot-Spieler werden in Gegnerkader für die Anzeige ergänzt, auch ohne vorherige Transfers
- historische `teamAtImport`-Information bleibt unverändert

### Dev3
- spätere Transferimporte werden mit bestehenden Aufstellungs-Snapshots verknüpft
- Transferdaten dürfen Snapshot-Spieler anreichern, aber nie aus der Aufstellung entfernen
- Regression-Diagnose: Snapshot-Anzahl, gespeicherte Aufstellung und sichtbare Starter werden separat geprüft

### Dev4
- LIVE-Aufstellungen werden strikt auf ihren `snapshotMd` begrenzt
- ein späterer Spieltag darf historische Aufstellungen nicht überschreiben

## Regressionstest Calcio Rom
1. Noch unvollständiger Gegnerkader.
2. Bekannten Calcio-Rom-Aufstellungsscreenshot importieren.
3. Erwartung: 9 erkannte Spieler = 9 gespeicherte Snapshot-Spieler = 9 sichtbare Starter.
4. Danach Transfers von Calcio Rom importieren.
5. Erwartung: dieselben 9 Starter bleiben erhalten; passende Spieler werden nachträglich mit Transfer/Master-Daten verknüpft.
6. Wechsel auf einen anderen Spieltag und zurück: historische Aufstellung bleibt unverändert.

## Phase A – Datenbasis
1. Täglichen Bundesliga-Kader-Sync beibehalten und Freshness in der App sichtbar machen.
2. Historische Vereinszuordnung/Identitätsalias ergänzen.
3. Re-Resolver für offene/unsichere Screenshot-Spieler nach Master-Update.

## Phase B – Screenshot Engine
1. Gemeinsamen Resolver für Transfer- und Aufstellungs-Screenshots verwenden.
2. OCR-Fehler, Präfixe/abgeschnittene Namen und Akzente fehlertolerant behandeln.
3. Manager-Teamname aus dem Screenshot direkt mappen.
4. Confidence und Kandidaten dauerhaft anzeigen.

## Phase C – Aufstellungen
1. Aufstellung als Snapshot mit Slot/Position speichern, auch wenn Kaderdaten fehlen.
2. Spieler später nachträglich mit Master/Transfers verknüpfen.
3. Visuelle Feldposition aus Screenshot erhalten; Stammdatenposition nur als Plausibilitätscheck nutzen.
4. Unvollständige Aufstellungen wie 9/11 korrekt speichern und anzeigen.

## Phase D – Transfers
1. Manager-zu-Manager-Transfers aus beiden Perspektiven als ein Ereignis verknüpfen.
2. Kauf/Verkauf/Wiederkauf-Zyklen niemals als Dublette entfernen.
3. Echte Doppelimporte anhand Spieler-ID + Richtung + Betrag + Datum/enger Zeitnähe erkennen.

## Später
- Punkte-/Ergebnis-Screenshottyp nach dem ersten realen Spieltag ergänzen; bis dahin keine Annahmen über das Layout.
