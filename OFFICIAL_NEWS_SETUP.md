# Offizielle Vereinsmeldungen einrichten

Die News Engine verwendet ausschließlich konfigurierte RSS-/Atom-Feeds offizieller Vereinsseiten. Sie scrapet keine normalen Webseiten.

## 1. Supabase
`SUPABASE_ASSISTANT_MIGRATION.sql` einmal im SQL Editor ausführen.

## 2. GitHub Secret
Unter Settings → Secrets and variables → Actions ein Secret anlegen:

`OFFICIAL_NEWS_SOURCES_JSON`

Format:

```json
[
  {
    "team": "SV Werder Bremen",
    "name": "Werder Bremen – offizielle News",
    "url": "HIER_DIE_OFFIZIELLE_RSS_ODER_ATOM_URL"
  }
]
```

Nur offiziell angebotene RSS-/Atom-URLs verwenden. Vereine ohne Feed können ausgelassen werden.

## 3. Workflow
GitHub → Actions → `H2H Data Engine synchronisieren` → Run workflow.

Ohne konfigurierte Feeds läuft die App normal weiter und zeigt beim News-Provider „Nicht eingerichtet“.
