# Automatische Teamstärken einrichten

OpenLigaDB benötigt keinen API-Schlüssel. Der tägliche GitHub-Workflow ruft die
Bundesliga-Ergebnisse ab, berechnet neue Werte und schreibt sie über einen
serverseitigen Supabase-Schlüssel in die Tabelle `team_strengths`.

## 1. Supabase-Tabelle anlegen

1. Supabase öffnen.
2. SQL Editor → New query.
3. Inhalt von `SUPABASE_TEAMSTRENGTH_MIGRATION.sql` einfügen.
4. Run auswählen.

## 2. GitHub Secrets hinterlegen

Im GitHub-Repository:

1. Settings → Secrets and variables → Actions.
2. New repository secret.
3. Diese beiden Secrets anlegen:

### SUPABASE_URL

Wert: deine Project URL aus Supabase → Project Settings → API.

### SUPABASE_SERVICE_ROLE_KEY

Wert: der serverseitige `service_role`- beziehungsweise Secret Key aus Supabase.

WICHTIG:
- Diesen Schlüssel niemals in `config.js`, HTML oder JavaScript eintragen.
- Nur als verschlüsseltes GitHub Secret verwenden.

## 3. Neue Dateien hochladen

Alle Dateien dieser Version ins Repository übernehmen. Besonders relevant:

- `.github/workflows/update-team-strengths.yml`
- `scripts/update-team-strengths.mjs`
- `cloud.js`
- `app.js`

## 4. Ersten Lauf manuell starten

1. GitHub → Actions.
2. Workflow „Teamstärken aktualisieren“ öffnen.
3. Run workflow.
4. Auf einen grünen Lauf warten.

Danach sollten in Supabase unter Table Editor → `team_strengths` 18 Zeilen stehen.

## Automatischer Rhythmus

Der Workflow läuft täglich um 05:15 UTC. Er kann jederzeit manuell gestartet
werden. Die App lädt die Werte beim Login, beim Zurückkehren in die App und
zusammen mit der Cloud-Synchronisierung.

## Berechnung

Vor beziehungsweise ohne Saisonspiele:
- Vorsaison-Basiswerte.

Während der Saison:
- laufende Saison
- Form der letzten fünf Spiele
- Tore pro Spiel
- Gegentore pro Spiel
- Heim- und Auswärtsleistung
- abnehmender Einfluss der Vorsaison

Der Einfluss der laufenden Saison steigt schrittweise bis etwa zum 10. Spiel.

## LigaInsider

LigaInsider bleibt vorerst halbautomatisch:
1. Seite öffnen.
2. Aufstellungstext kopieren.
3. In der App einfügen.
4. Änderungen prüfen.
5. Übernehmen.

Eine vollständig automatische Abfrage wird erst eingebaut, wenn eine stabile
und zulässige Schnittstelle vorhanden ist.
