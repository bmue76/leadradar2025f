# LeadRadar2025f – Projektübersicht

LeadRadar2025f ist eine SaaS-Lösung zur digitalen Leaderfassung auf Messen:

- **Admin-Web-App** (Next.js, App Router, TypeScript, Tailwind CSS)
- **Backend-API** (Next.js API Routes, Prisma, SQLite als Dev-Datenbank)
- **Mobile-App** (später: Expo/React Native für iOS & Android) zur Erfassung der Leads vor Ort

Die Kernfunktionen drehen sich um:

- Konfiguration von **Formularen** im Admin
- **Lead-Erfassung** auf Events (Messen) über Mobile-App & Admin
- **Auswertung & Export** der erfassten Leads

---

## Stand nach Teilprojekt 1.1 – Projekt-Setup & Web-Basis (29.11.2025)

**Ziele von Teilprojekt 1.1**

- Technische Basis für die Web-Admin-App und das Backend schaffen.
- Next.js-App mit App Router & TypeScript im Unterordner `web` aufsetzen.
- Tailwind CSS (v4) integrieren.
- Erste Admin-Shell unter `/admin` erstellen.
- Prisma + SQLite (Prisma 7) vorbereiten.
- Doku-Grundstruktur und Git-Setup definieren.

**Ergebnisse**

- Projekt-Root: `C:\dev\leadradar2025f`
- Next.js (App Router, TypeScript) im Ordner `web` eingerichtet.
- Tailwind CSS v4 in der Web-App konfiguriert.
- Erste Admin-Shell unter `/admin` erstellt (Layout & Platzhalter für spätere Admin-Funktionen).
- Prisma 7 mit SQLite als Dev-Datenbank:
  - `web/prisma/schema.prisma` mit minimalem `User`-Model.
  - `prisma.config.ts` mit `provider = "sqlite"` und Nutzung von `env("DATABASE_URL")`.
  - `.env` / `.env.example` mit `DATABASE_URL="file:./prisma/dev.db"`.
  - `web/lib/prisma.ts` als Prisma-Client-Singleton (erste Basis).
  - Erste Migration `init` wurde erfolgreich ausgeführt.
- Doku-Basis unter `docs/` angelegt.

---

## Stand nach Teilprojekt 1.2 – Datenmodell & Prisma-Schema (Forms & Leads) (29.11.2025)

**Ziel von Teilprojekt 1.2**

- Erarbeitung eines sauberen, erweiterbaren Datenmodells für den Kern von LeadRadar:
  - Formulare (Admin-konfigurierbar)
  - Formularfelder
  - Leads (erfasste Kontakte)
  - Lead-Werte (Feldwerte je Lead)
  - optional: Events (Messen), an denen Leads erfasst werden
- Abbildung des Modells in Prisma (Schema und Migration).
- Seed-Script für ein Beispiel-Formular.

---

### Datenmodell (High-Level)

Eingeführte Entitäten & Beziehungen:

- `Form`
  - Repräsentiert ein Lead-Formular.
  - Hat viele `FormField`s.
  - Hat viele `Lead`s.
- `FormField`
  - Felder eines Formulars (z. B. Vorname, Firma, E-Mail, Interesse).
  - Verweist auf genau ein `Form`.
- `Lead`
  - Ein erfasster Messekontakt.
  - Gehört zu genau einem `Form`.
  - Kann optional einem `Event` zugeordnet werden.
  - Kann optional von einem `User` erfasst worden sein (`capturedByUserId`).
- `LeadValue`
  - Einzelner Feldwert eines Leads.
  - Verknüpft `Lead` + `FormField` + `value`.
- `Event` (optional, aber bereits modelliert)
  - Repräsentiert ein Event / eine Messe.
  - Hat viele `Lead`s.
- `User`
  - Bestehendes (minimales) User-Model, erweitert um eine Relation zu erfassten Leads.

**Wichtige Enums**

- `FormStatus`: `DRAFT`, `ACTIVE`, `ARCHIVED`
- `FieldType`:
  - `TEXT`, `TEXTAREA`, `SINGLE_SELECT`, `MULTI_SELECT`,
  - `NUMBER`, `EMAIL`, `PHONE`, `DATE`, `DATETIME`, `BOOLEAN`

---

### Persistenz & Technik

- `web/prisma/schema.prisma` wurde um die neuen Models und Enums erweitert:
  - Enums:
    - `FormStatus`
    - `FieldType`
  - Models:
    - `User`, `Event`, `Form`, `FormField`, `Lead`, `LeadValue`
  - Wichtige Constraints:
    - `@@unique([formId, key])` auf `FormField`
    - Indexe auf `formId`, `eventId`, `capturedByUserId`, `leadId`, `fieldId`
- Anpassung an Prisma 7:
  - Die `datasource db` im `schema.prisma` enthält nur noch den `provider`, nicht mehr die URL.
  - Die DB-URL wird in `prisma.config.ts` konfiguriert (`DATABASE_URL` aus `.env`).
  - Verwendung des SQLite-Adapters `@prisma/adapter-better-sqlite3`:
    - `web/lib/prisma.ts` wurde angepasst, um den `PrismaClient` mit `PrismaBetterSqlite3` zu initialisieren.
- Migration:
  - Neue Migration für das Kernmodell mit `npx prisma migrate dev --name add_core_forms_leads`.

---

### Seed-Daten

Zur schnelleren Entwicklung wurde ein Seed-Script erstellt:

- Datei: `web/prisma/seed.cjs` (CommonJS, Prisma 7 + SQLite + Adapter).
- Funktion:
  - Löscht bestehende Demo-Daten (Events, Forms, Fields, Leads, LeadValues) in der richtigen Reihenfolge.
  - Legt ein Beispiel-Event **„Demo Event 2025“** an.
  - Legt ein Beispiel-Formular **„Standard Messe-Lead-Formular“** an mit typischen Feldern:
    - Vorname (`TEXT`, required)
    - Nachname (`TEXT`, required)
    - Firma (`TEXT`)
    - E-Mail (`EMAIL`)
    - Interesse (`SINGLE_SELECT` mit JSON-kodierten Optionen)
    - Notizen (`TEXTAREA`)
- Ausführung des Seeds:

```bash
cd /c/dev/leadradar2025f/web
npx prisma generate
node prisma/seed.cjs
