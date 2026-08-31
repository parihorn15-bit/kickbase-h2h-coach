# Phase 2.3.0 – Dynamic Bundesliga Master & Smart Screenshot Linking

## Ziel
Die Screenshot-Pipeline soll Transfers und Aufstellungen robust erfassen, auch wenn reale Bundesliga-Kader sich ändern oder bestehende Manager-Kader noch unvollständig sind.

## Kernprinzipien
- Aktueller Bundesliga-Master mehrfach täglich synchronisieren.
- Stabile Spieleridentität über `external_id`, nicht über sichtbaren Namen oder aktuellen Verein.
- Historische Transfer-/Aufstellungsdaten niemals rückwirkend durch echte Vereinswechsel verfälschen.
- Screenshot-Aufstellungen als vollständige Snapshots speichern, unabhängig vom bereits bekannten Manager-Kader.
- Offene/unsichere Spieler nach jedem Master-Update automatisch erneut auflösen.
- Kickbase-Position ist für Aufstellung, Formation und H2H führend; Vereins-/Providerposition bleibt Zusatzinformation.
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

### Dev5
- Online-Teststand und Runtime-Diagnose stabilisiert
- Testbereitschaft im Browser ohne lokale Python-/Node-Laufzeit

### Dev6
- bekannte/unveränderte Transfers können trotzdem einen Reconcile-Lauf auslösen
- bestehende Aufstellungs-Snapshots werden nach Master-/Transferänderungen erneut geprüft

### Dev7
- Kickbase-Position und offizielle Vereinsposition getrennt
- Kickbase-Positionsregistry für aus Screenshots verifizierte/gelernte Positionen
- bestehende Snapshots können rückwirkend auf Kickbase-Position migriert werden

### Dev8
- konservativer Nachnamen-/Präfix-Resolver gegen den aktuellen Bundesliga-Master; Regression u. a. Sheraldo Becker
- interaktive Gegner-Aufstellung mit Feld, Bank und Drag & Drop zwischen Startelf und Bank
- Bundesliga-Master-Sync entfernt veraltete Spieler-IDs statt sie dauerhaft im Kader zu behalten
- Bundesliga-Master-Sync auf vier Läufe pro Tag erhöht; Datenänderungen im 2.3.0-Branch lösen zusätzlich einen Sync aus

## Regressionstest Calcio Rom
1. Noch unvollständiger Gegnerkader.
2. Bekannten Calcio-Rom-Aufstellungsscreenshot importieren.
3. Erwartung: 9 erkannte Spieler = 9 gespeicherte Snapshot-Spieler = 9 sichtbare Starter.
4. Danach Transfers von Calcio Rom importieren.
5. Erwartung: dieselben 9 Starter bleiben erhalten; passende Spieler werden nachträglich mit Transfer/Master-Daten verknüpft.
6. Becker muss nach aktuellem Master als Sheraldo Becker auflösbar sein, sobald der aktuelle Bundesliga-Master geladen ist.
7. Doan muss mit seiner Kickbase-Position Mittelfeld geführt werden.
8. Gegner-Aufstellung muss im Bearbeiten-Dialog auf dem interaktiven Feld erscheinen; Startelf/Bank per Drag & Drop änderbar.
9. Wechsel auf einen anderen Spieltag und zurück: historische Aufstellung bleibt unverändert.

## Phase A – Datenbasis
1. Bundesliga-Kader-Sync mehrfach täglich und Freshness in der App sichtbar machen.
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
3. Visuelle Feldposition aus Screenshot erhalten; Kickbase-Position für Formation nutzen; Vereinsposition nur als Zusatzinformation.
4. Unvollständige Aufstellungen wie 9/11 korrekt speichern und anzeigen.
5. Gegner-Aufstellungen auf dieselbe interaktive Feld-/Bank-Bedienlogik wie die eigene Aufstellung angleichen.

## Phase D – Transfers
1. Manager-zu-Manager-Transfers aus beiden Perspektiven als ein Ereignis verknüpfen.
2. Kauf/Verkauf/Wiederkauf-Zyklen niemals als Dublette entfernen.
3. Echte Doppelimporte anhand Spieler-ID + Richtung + Betrag + Datum/enger Zeitnähe erkennen.

## Später
- Trikots für eigene und gegnerische Aufstellungen integrieren.
- Punkte-/Ergebnis-Screenshottyp nach dem ersten realen Spieltag ergänzen; bis dahin keine Annahmen über das Layout.
