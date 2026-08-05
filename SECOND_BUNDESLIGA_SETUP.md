# 2. Bundesliga im Hintergrund

1. `SUPABASE_GERMAN_LEAGUES_MIGRATION.sql` einmal im Supabase SQL Editor ausführen.
2. Version vollständig nach GitHub laden.
3. GitHub Actions → `H2H Data Engine synchronisieren` → `Run workflow`.

Danach synchronisiert football-data.org:

- 18 Vereine der Bundesliga
- 18 Vereine der 2. Bundesliga
- Vereinswappen beider Ligen
- aktuelle Kader beider Ligen

Im Scout Center und in der sichtbaren Bundesliga-Zentrale werden weiterhin nur
Spieler der 1. Bundesliga angezeigt. Die 2. Bundesliga dient im Hintergrund für:

- korrekte Vereinslogos, z. B. Elversberg
- Wechsel zwischen erster und zweiter Liga
- aktualisierte Vereinszuordnung nach Auf- und Abstieg
- Spielerhistorie und spätere Transferauswertungen
