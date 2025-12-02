# LeadRadar2025f – Projektübersicht

LeadRadar2025f ist ein SaaS-Projekt zur digitalen Leaderfassung auf Messen.  
Kernbausteine:

- **Admin-Web-App (Next.js / TypeScript / Tailwind)** zur Verwaltung von Events, Formularen und Leads.
- **Backend-API (Next.js App Router + Prisma + PostgreSQL/SQLite)**.
- **Mobile-App (separates Projekt)** zur Leaderfassung vor Ort (QR-/Visitenkartenscan etc.).

Dieses Dokument fasst den Stand der bisherigen Teilprojekte zusammen.

---

## Stand nach Teilprojekt 1.1 – Projekt-Setup & Web-Basis

**Ziel:**

- Grundgerüst für die Web-Applikation schaffen.

**Umsetzung:**

- Next.js (App Router, TypeScript, Tailwind v4) unter `web/`.
- Basis-Layout mit Admin-Shell:
  - Admin-Bereich unter `/admin`.
  - Sidebar-Navigation (Dashboard, Formulare, Leads).
- Technische Basis:
  - ESLint / TypeScript-Konfiguration.
  - Tailwind v4 Setup.
  - Erste simple Seiten / Routen.

---

## Stand nach Teilprojekt 1.2 – Datenmodell & Prisma-Schema (Forms & Leads)

**Ziel:**

- Datenmodell für Formulare und Leads definieren.

**Kern-Entitäten (Prisma-Schema):**

- `Form`
  - `id`, `name`, `description`, `status` (`DRAFT`, `ACTIVE`, `ARCHIVED`)
  - Beziehungen: `fields`, `leads`
- `FormField`
  - `id`, `formId`, `key`, `label`, `type`, `required`, `order`
- `Lead`
  - `id`, `formId`, `createdAt`
  - Beziehung: `values`
- `LeadValue`
  - `id`, `leadId`, `fieldId`, `value`
- `Event`, `User` (Basis für spätere Erweiterungen).

**Prisma-Basis:**

- `prisma/schema.prisma` mit obigen Modellen.
- `prisma/seed.cjs` legt ein Beispiel-Formular mit Feldern an.
- `npx prisma generate` und `node prisma/seed.cjs` laufen durch.

---

## Stand nach Teilprojekt 1.3 – API-Basis & Routing

**Ziel:**

- Erste API-Endpunkte für Admin und Public.

**Admin-API:**

- `GET /api/admin/forms`
- `GET /api/admin/forms/:id`
- `GET /api/admin/leads?formId=…`

**Public-API:**

- `POST /api/leads`  
  → legt einen Lead zu einem Formular an.

**Sonstiges:**

- `GET /api/health` als Healthcheck.
- Gemeinsame DTOs unter `web/lib/api-types.ts`.
- API-Client `web/lib/admin-api-client.ts` mit `apiGet` etc. für den Admin-Bereich.

---

## Stand nach Teilprojekt 1.4 – Admin-UI: Forms & Leads (List & Detail)

**Ziel:**

- Erste nutzbare Admin-Oberfläche:

  - Formular-Liste & Formular-Details (Read-Only).
  - Lead-Liste mit Formular-Filter (Read-Only).

**Umsetzung:**

- `/admin`:
  - Dashboard mit Kacheln zu „Formulare“ und „Leads“.
- `/admin/forms`:
  - Liste aller Formulare (Name, Status, Anzahl Felder, Erstelldatum).
  - Link zu den Detailansichten.
- `/admin/forms/[id]`:
  - Detailansicht eines Formulars.
  - Anzeige der zugehörigen Felder (Read-Only).
- `/admin/leads`:
  - Lead-Liste mit optionalem Formular-Filter (Chips/Tabs).
  - Anzeige von Datum, Formularname und einem Auszug der wichtigsten Lead-Werte.

**Technik:**

- Server Components mit `fetchForms` / `fetchFormById` / `fetchLeads` (Admin-API).
- Basic Error-/Empty-States in den Admin-Seiten.

---

## Stand nach Teilprojekt 2.1 – Admin-UI & API: Form-CRUD (Create/Edit/Delete & Status)

**Ziel:**

- Formularverwaltung im Admin voll funktionsfähig machen:
  - Formulare anlegen,
  - Metadaten bearbeiten (Name, Beschreibung, Status),
  - Formulare archivieren (Soft-Delete).

**API-Erweiterungen:**

- `POST /api/admin/forms`
  - Body: `{ name, description?, status? }`
  - Legt ein neues Formular an.
  - Default-Status: `DRAFT`, falls kein Status angegeben ist.
- `PUT /api/admin/forms/:id`
  - Body: `{ name?, description?, status? }`
  - Partielle Updates von Name, Beschreibung und Status.
- `DELETE /api/admin/forms/:id`
  - Soft-Delete: setzt Status auf `ARCHIVED`.
  - Antwort: `204 No Content` bei Erfolg.

**Admin-UI-Erweiterungen:**

- `/admin/forms`:
  - Button **„Neues Formular“**:
    - Öffnet ein Inline-Panel zum Anlegen eines neuen Formulars.
    - Felder: Name (Pflicht), Beschreibung, Status (DRAFT/ACTIVE/ARCHIVED).
    - Nach Erfolg: automatische Aktualisierung der Formularliste.
  - Formularliste mit Aktionen:
    - Name verlinkt auf `/admin/forms/[id]`.
    - Spalte „Aktionen“ mit:
      - **„Bearbeiten“** (Link auf Detailseite).
      - **„Archivieren“** (Button, der `DELETE /api/admin/forms/:id` aufruft).
- `/admin/forms/[id]`:
  - Edit-Bereich für Metadaten:
    - Name, Beschreibung, Status (Select).
    - Button **„Änderungen speichern“** (PUT-Call).
    - Button **„Formular archivieren“** (DELETE-Call, Bestätigung + Redirect zurück zur Liste).
  - Darunter weiterhin die **Feldliste** (Read-Only), um die Struktur des Formulars zu sehen.

**Technik / Pattern:**

- **API:**
  - Implementierung der CRUD-Endpunkte in:
    - `web/app/api/admin/forms/route.ts` (GET, POST),
    - `web/app/api/admin/forms/[id]/route.ts` (GET, PUT, DELETE).
  - Nutzung von `prisma` aus `web/lib/prisma.ts` (PrismaClient via `require`, globale Instanz für Dev-Hot-Reload).
  - DTO-Mapping → `FormDto` / `FormFieldDto` in `web/lib/api-types.ts`.

- **Admin-UI:**
  - Server Components für die Seiten (`/admin/forms`, `/admin/forms/[id]`).
  - Kleine **Client-Komponenten** für interaktiven CRUD:
    - `FormCreateButton.tsx` (Create-Flow).
    - `ArchiveFormButton.tsx` (Archivieren aus der Liste).
    - `FormMetaEditor.tsx` (Edit & Archivieren aus der Detailansicht).
  - Verwendung des gemeinsamen Admin-API-Clients:
    - `createForm`, `updateForm`, `archiveForm`, `fetchForms`, `fetchFormById`.
  - Nach erfolgreichen Änderungen:
    - `router.refresh()` (Liste bzw. Detail neu laden),
    - bei Archivierung im Detail: `router.push('/admin/forms')`.

**Business-Sicht:**

- Admin kann jetzt:

  - Neue Formulare anlegen (inkl. Status).
  - Bestehende Formulare umbenennen, beschreiben und deren Status ändern.
  - Formulare **archivieren**, sodass sie nicht mehr für neue Leads verwendet werden.

- Formfelder bleiben in diesem Stand **Read-Only** – die eigentliche Feldverwaltung folgt als eigenes Teilprojekt.

---
