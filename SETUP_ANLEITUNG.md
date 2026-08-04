# Kickbase H2H Coach – Cloud-Setup

Du benötigst einmalig:
- ein kostenloses GitHub-Konto
- ein kostenloses Supabase-Konto
- Zugriff auf deine E-Mail

## Teil A – Supabase einrichten

1. Öffne supabase.com und erstelle ein neues Projekt.
2. Warte, bis das Projekt bereit ist.
3. Öffne **SQL Editor** → **New query**.
4. Kopiere den kompletten Inhalt von `SUPABASE_SETUP.sql` hinein und führe ihn aus.
5. Öffne **Project Settings** → **API**.
6. Kopiere:
   - Project URL
   - Publishable Key beziehungsweise anon/public Key
7. Öffne lokal die Datei `config.js` mit Editor/Notepad.
8. Ersetze die beiden Platzhalter und speichere die Datei.

WICHTIG: Niemals einen secret- oder service_role-Key in config.js eintragen.

## Teil B – GitHub Pages einrichten

1. Öffne github.com und erstelle ein neues Repository, z. B. `kickbase-h2h-coach`.
2. Repository kann öffentlich sein. Der Publishable Key darf im Browser stehen,
   weil der Datenzugriff durch Supabase RLS auf dein Benutzerkonto begrenzt ist.
3. Lade den kompletten Inhalt dieses Ordners in das Repository hoch.
   Auch `.github`, `.nojekyll`, `config.js` und `SUPABASE_SETUP.sql`.
4. Öffne im Repository **Settings** → **Pages**.
5. Unter **Build and deployment** als Source **GitHub Actions** auswählen.
6. Unter **Actions** warten, bis „Deploy GitHub Pages“ grün ist.
7. Deine Adresse lautet ungefähr:
   `https://DEIN-NAME.github.io/kickbase-h2h-coach/`

## Teil C – Supabase Login-Weiterleitung

1. Kopiere deine fertige GitHub-Pages-Adresse.
2. In Supabase: **Authentication** → **URL Configuration**.
3. Trage die Adresse als **Site URL** ein.
4. Füge dieselbe Adresse bei **Redirect URLs** hinzu.
   Optional zusätzlich mit Stern:
   `https://DEIN-NAME.github.io/kickbase-h2h-coach/**`

## Auf dem MSI-Laptop

1. Öffne die GitHub-Pages-Adresse in Edge oder Chrome.
2. Klicke oben auf den Cloud-Status.
3. E-Mail eingeben → Login-Link senden.
4. Öffne den Link aus der E-Mail auf dem MSI.
5. Beim ersten Login wird dein bisheriger lokaler Stand automatisch hochgeladen,
   falls in der Cloud noch kein Datensatz existiert.
6. In Edge/Chrome: Menü → **Apps** / **Diese Website als App installieren**.

## Auf dem Samsung

1. Öffne dieselbe GitHub-Pages-Adresse in Chrome oder Samsung Internet.
2. Klicke auf Cloud und melde dich mit derselben E-Mail an.
3. Öffne den Login-Link aus der E-Mail auf dem Samsung.
4. Browser-Menü → **App installieren** oder **Zum Startbildschirm hinzufügen**.
5. Ab jetzt synchronisieren beide Geräte automatisch.

## Synchronisierungslogik

- Jede Änderung wird zunächst lokal gespeichert.
- Nach ungefähr 0,7 Sekunden wird sie in Supabase hochgeladen.
- Die App prüft alle 15 Sekunden sowie beim Zurückkehren in die App auf Änderungen.
- Beim ersten Login:
  - Cloud leer → lokaler Stand wird hochgeladen.
  - Cloud vorhanden → Cloud-Stand wird geladen.
- Über das Cloud-Menü kannst du jederzeit manuell synchronisieren oder bewusst
  den lokalen Stand hochladen.

## Sicherheitsprinzip

Die Tabelle verwendet Row Level Security. Ein angemeldeter Nutzer kann nur den
Datensatz lesen und ändern, dessen `user_id` seiner eigenen Supabase-ID entspricht.
