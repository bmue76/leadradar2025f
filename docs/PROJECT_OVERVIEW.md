# LeadRadar2025f – Projektübersicht

SaaS-Lösung zur digitalen Leaderfassung auf Messen.  
Architektur:

- **Admin-Web-App** (Next.js 16, App Router, TypeScript, Tailwind) unter `/web`
- **Backend-API** als Next.js App-Routes (`/app/api/...`) mit Prisma & PostgreSQL
- **(Später)** Mobile-App (separates Teilprojekt, nicht in diesem Repo)

Ziel:  
Aussteller können im Admin-Frontend **Formulare** zur Leaderfassung konfigurieren (FormFields), diese in eine App pushen und während der Messe Leads strukturiert erfassen. Nach der Messe können Leads exportiert und ins eigene CRM übernommen werden.

---

## Tech-Stack

- **Frontend / Admin-UI**
  - Next.js 16 (App Router, Turbopack)
  - React / TypeScript
  - Tailwind CSS
- **Backend / API**
  - Next.js App Routes (`/app/api/...`)
  - Prisma ORM
  - PostgreSQL (lokal / Cloud, je nach Umgebung)
- **Sonstiges**
  - Node.js / npm
  - GitHub-Repo: `leadradar2025f` (unter `C:\dev\leadradar2025f`)
  - Lokale Entwicklung: `cd web && npm run dev`

---

## Datenmodell (Stand nach Teilprojekt 1.2)

Prisma-Modelle (vereinfachte Übersicht):

- **User**
- **Event**  
  Messe / Veranstaltung, für die Leads erfasst werden.
- **Form**
  - `id`, `name`, `description?`, `status` (`DRAFT`, `ACTIVE`, `ARCHIVED`)
  - Beziehung: `Form` gehört zu einem Event (optional / später relevant)
- **FormField**
  - `id`
  - `formId`
  - `label`
  - `key` (eindeutig pro Formular, `@@unique([formId, key])`)
  - `type` (`FieldType`-Enum)
  - `required` (boolean)
  - `options` (`string | null`, JSON-Array mit möglichen Optionen für Select-Felder)
  - `order` (int, Reihenfolge im Formular)
- **Lead**
  - `id`
  - `formId`
  - `createdAt`
  - Meta-Infos zum Lead (z. B. Event, User, Device – später erweiterbar)
- **LeadValue**
  - `id`
  - `leadId`
  - `formFieldId`
  - `value` (string)

**FieldType-Enum:**

- `TEXT`
- `TEXTAREA`
- `SINGLE_SELECT`
- `MULTI_SELECT`
- `NUMBER`
- `EMAIL`
- `PHONE`
- `DATE`
- `DATETIME`
- `BOOLEAN`

---

## Teilprojekt 1.1 – Projekt-Setup & Web-Basis

**Ziel:**

- Grundgerüst für das Web-Projekt aufsetzen:
  - Next.js-App unter `web/`
  - TypeScript, Tailwind
  - Basis-Ordnerstruktur
- Prisma-Basis einrichten (Schema, Client-Generation)
- Git-Repo vorbereiten

**Ergebnis / Stand:**

- Next.js 16-Projekt unter `web/` initialisiert.
- Tailwind CSS integriert.
- Prisma eingerichtet:
  - `prisma/schema.prisma` angelegt
  - `npx prisma generate` läuft sauber.
- Erste Migrationen mit `npx prisma migrate dev` durchgeführt.
- Git-Basis:
  - Repo `leadradar2025f` angelegt
  - `.gitignore` vorhanden
- Dokumentation in `docs/teilprojekt-1.1-setup-web-basis.md` beschrieben.

---

## Teilprojekt 1.2 – Datenmodell & Prisma-Schema (Forms & Leads)

**Ziel:**

- Datenmodell für Forms & Leads definieren.
- Prisma-Schema erstellen & Migrationen ausführen.
- Seed-Skript für Testdaten.

**Ergebnis / Stand:**

- Prisma-Modelle: `User`, `Event`, `Form`, `FormField`, `Lead`, `LeadValue` definiert.
- `FieldType`-Enum angelegt (siehe oben).
- Constraints:
  - `@@unique([formId, key])` für `FormField` (eindeutige Keys pro Formular).
- Seed-Skript:
  - `prisma/seed.cjs`
  - Anlage von Beispielen für:
    - Formulare (z. B. „Standard-Messeformular“)
    - Felder (Name, Firma, E-Mail, Interessen etc.)
    - Beispiel-Leads
- `node prisma/seed.cjs` läuft sauber durch.
- Dokumentation: `docs/teilprojekt-1.2-datenmodell-prisma-schema.md`.

---

## Teilprojekt 1.3 – API-Basis & Routing (Forms & Leads)

**Ziel:**

- Erste Admin-API-Endpunkte für Forms & Leads.
- Health-Endpoint und Basiskommunikation prüfen.

**Ergebnis / Stand:**

Implementierte Endpunkte:

- `GET /api/admin/forms`
  - Liste aller Formulare (inkl. zugehöriger Felder).
- `GET /api/admin/forms/:id`
  - Detail eines Formulars (inkl. Felder).
- `GET /api/admin/leads`
  - Liste der Leads (mit Filtermöglichkeiten nach Formular).
- `POST /api/leads`
  - Anlage eines neuen Leads inkl. LeadValues (für späteren App-Use).
- `GET /api/health`
  - Healthcheck für Basisverfügbarkeit.

Weitere Punkte:

- Prisma-Client über `web/lib/prisma.ts` mit globaler Instanz und require-basierter Lösung für Next.js 16 / Turbopack (Vermeidung von „PrismaClient is already running“-Warnungen).
- Grundstruktur für `web/lib/admin-api-client.ts`:
  - `ApiResult<T>` mit `{ ok, data, error, status }`.
- Doku: `docs/teilprojekt-1.3-api-basis-routing.md`.

---

## Teilprojekt 1.4 – Admin-UI: Forms & Leads (List & Detail)

**Ziel:**

- Admin-Ansichten für:
  - Formulare (Liste & Detail, read-only)
  - Leads (Liste mit Formular-Filter)
- Navigation im Admin-Bereich.

**Ergebnis / Stand:**

- `/admin/forms`
  - Tabellenansicht aller Formulare (Name, Status, Anzahl Felder, Erstellungsdatum).
  - Link zum Formular-Detail.
- `/admin/forms/[id]`
  - Detailansicht eines Formulars (Name, Beschreibung, Status).
  - Read-Only-Auflistung der `FormFields` (inkl. `label`, `key`, `type`, `required`, `order`).
- `/admin/leads`
  - Liste aller Leads.
  - Filter nach Formular-ID.
  - Basisinformationen pro Lead (z. B. Datum, Formularname).
- UI-Basis:
  - Einfache, aber klare Admin-Optik mit Tailwind.
- Doku: `docs/teilprojekt-1.4-admin-ui-forms-leads.md`.

---

## Teilprojekt 2.1 – Admin-UI & API: Form-CRUD (Create/Edit/Delete & Status)

**Ziel:**

- Aus der reinen Read-Only-Formularsicht eine echte Formularverwaltung machen:
  - Formulare anlegen.
  - Metadaten bearbeiten.
  - Formulare archivieren (Soft-Delete).

**Ergebnis / Stand:**

**API:**

- `POST /api/admin/forms`
  - Neues Formular anlegen (Default-Status: `DRAFT`).
- `PUT /api/admin/forms/:id`
  - Formular-Metadaten & Status aktualisieren.
- `DELETE /api/admin/forms/:id`
  - Soft-Delete/Archivieren des Formulars (Status → `ARCHIVED`).

**Admin-UI:**

- `/admin/forms`
  - Button „Neues Formular“.
  - Anlage eines neuen Formulars (Name + optional Beschreibung).
- `/admin/forms/[id]`
  - Editierbare Metadaten:
    - Name
    - Beschreibung
    - Status (`DRAFT`, `ACTIVE`, `ARCHIVED`)
  - Button „Formular archivieren“:
    - ruft `DELETE /api/admin/forms/:id` auf.
    - Redirect zurück zur Formularliste.
- `web/lib/prisma.ts`
  - Prisma-Client (global) weiterhin zentral genutzt.
- `web/lib/admin-api-client.ts`
  - Helferfunktionen: `createForm`, `updateForm`, `archiveForm`, `fetchForms`, `fetchFormById`, `fetchLeads`.
- Doku: `docs/teilprojekt-2.1-admin-form-crud.md`.

---

## Teilprojekt 2.2 – Admin-UI & API: FormFields-CRUD & Reihenfolge

**Ziel:**

- Die read-only Feldliste im Formular-Detail zu einer vollwertigen Feldverwaltung ausbauen:
  - Felder anlegen, bearbeiten, löschen.
  - Reihenfolge der Felder steuern (order).

**Ergebnis / Stand:**

**API-Endpunkte für FormFields:**

- `POST /api/admin/forms/:id/fields`
  - Neues `FormField` anlegen.
  - Request-Body:
    - `label` (string, Pflicht)
    - `key` (string, Pflicht, unique pro Formular)
    - `type` (`FieldType`, Pflicht)
    - `required?` (boolean)
    - `options?` (`string[]`) – wird als JSON-String in `options` gespeichert
    - `order?` (number, optional; wenn nicht gesetzt → ans Ende)
  - Validation & Fehlercodes:
    - `VALIDATION_ERROR`
    - `INVALID_FIELD_TYPE`
    - `FORM_NOT_FOUND`
    - `FIELD_KEY_DUPLICATE` (Prisma P2002 auf `@@unique([formId, key])`)

- `PUT /api/admin/forms/:id/fields/:fieldId`
  - Teil-Update eines Feldes.
  - Alle Felder optional:
    - `label?`, `key?`, `type?`, `required?`, `options?`, `order?`
  - Validierung analog zu `POST`.

- `DELETE /api/admin/forms/:id/fields/:fieldId`
  - Hartes Löschen eines Feldes.
  - **Hinweis:** Bestehende `LeadValue`-Einträge bleiben in der DB und können dadurch „verwaist“ sein – für den Prototyp akzeptiert.

- `POST /api/admin/forms/:id/fields/reorder`
  - Setzt `order` für alle Felder eines Formulars in einem Rutsch.
  - Request-Body:
    - `fieldOrder: number[]` – IDs der Felder in neuer Reihenfolge.
  - Validierung:
    - Anzahl IDs muss mit aktueller Anzahl Felder übereinstimmen.
    - Alle Feld-IDs des Formulars müssen genau einmal enthalten sein.
    - Fehlercode: `INVALID_FIELD_ORDER`.

**Admin-UI – Formular-Detailseite `/admin/forms/[id]`:**

- Besteht jetzt aus zwei Hauptsektionen:

1. **Form-Metadaten** (`FormMetaSection` – Client-Komponente)
   - Felder:
     - Name (editierbar)
     - Beschreibung (editierbar)
     - Status (Dropdown: `DRAFT`, `ACTIVE`, `ARCHIVED`)
   - Buttons:
     - „
