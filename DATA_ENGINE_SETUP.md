# Data Engine 1.0 einrichten

## Pflichtschritte
1. `SUPABASE_DATA_ENGINE_MIGRATION.sql` im Supabase SQL Editor ausführen.
2. Alle Dateien einschließlich `.github/workflows/sync-data-engine.yml` nach GitHub laden.
3. Bestehende Secrets behalten:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `FOOTBALL_DATA_API_KEY`

## Optional: Sportmonks
Für automatische voraussichtliche Aufstellungen und Ausfälle:
- `SPORTMONKS_API_TOKEN`
- `SPORTMONKS_BUNDESLIGA_SEASON_ID`

Danach unter GitHub → Actions den Workflow **H2H Data Engine synchronisieren** manuell starten.

Ohne Sportmonks-Schlüssel wird der Sportmonks-Provider als „Nicht eingerichtet“ markiert; die kostenlose football-data.org-Synchronisierung läuft trotzdem.
