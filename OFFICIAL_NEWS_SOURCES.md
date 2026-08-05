# Offizielle Newsquellen

Version 1.3.1 enthält einen lokalen Quellenkatalog:

`data-engine/official-news-sources.json`

Bereits hinterlegt:

- Eintracht Frankfurt Profis: `https://profis.eintracht.de/rss/feed.xml`
- VfB Stuttgart: `https://www.vfb.de/templates/generated/1/raw/de.xml`

Es werden bewusst nur eindeutig bestätigte offizielle RSS-/Atom-Adressen eingetragen.
Weitere Vereine können ergänzt werden:

```json
{
  "team": "Vereinsname wie in football-data.org",
  "name": "Anzeigename",
  "url": "https://offizielle-domain.de/feed.xml",
  "verified": true,
  "scope": "first_team"
}
```

Das optionale GitHub-Secret `OFFICIAL_NEWS_SOURCES_JSON` erweitert den lokalen Katalog.
Es ersetzt ihn nicht.

Normale Webseiten ohne offiziellen Feed werden nicht automatisch ausgelesen.
