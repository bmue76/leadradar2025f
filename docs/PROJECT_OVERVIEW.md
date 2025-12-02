# LeadRadar2025f – Projekt-Overview

## 1. Projektkontext

LeadRadar ist eine SaaS-Lösung zur digitalen Leaderfassung auf Messen.  
Kernbausteine:

- **Admin-Web-App** für Formulare, Events, Leads und Auswertungen.
- **Backend-API** (Next.js Route Handlers) auf Basis von Prisma & PostgreSQL.
- **Mobile-App** (später), die Formulare nutzt, um Leads vor Ort zu erfassen.

Dieses Dokument hält den Stand der wichtigsten Teilprojekte fest.

---

## 2. Technologie-Stack

- **Framework:** Next.js 16 (App Router) mit TypeScript
- **UI / Styling:** React Server Components, Tailwind CSS
- **ORM / DB:** Prisma ORM, PostgreSQL
- **Build / Dev:** Turbopack / `npm run dev` im Ordner `web`
- **Architektur:**
  - Admin-UI unter `/admin/*`
  - Admin-API unter `/api/admin/*`
  - Gemeinsame DTOs in `web/lib/api-types.ts`
  - Prisma-Client in `web/lib/prisma.ts` (global, Turbo-kompatibel)

---

## 3. Teilprojekte & aktueller Stand

### Stand nach Teilprojekt 1.1 – Projekt-Setup & Web-Basis

- Next.js-16-App im Ordner `web` aufgesetzt.
- Tailwind, ESLint/TS-Konfiguration eingerichtet.
- Basis-Adminlayout unter `/admin` mit einfachen Kacheln.
- Git-Repo & Grundstruktur für Doku (`docs/`) angelegt.

---

### Stand nach Teilprojekt 1.2 – Datenmodell & Prisma-Schema (Forms & Leads)

- Prisma-Schema mit Kern-Entities definiert:
  - `Form`, `FormField`
  - `Lead`, `LeadValue`
  - `Event`
  - `User`
- Relationen:
  - `Form` 1:n `FormField`
  - `Form` 1:n `Lead`
  - `Lead` 1:n `LeadValue`
  - `Lead` – `Event`
  - `Lead` – `User` (als `capturedBy`)
- Seed-Script (`prisma/seed.cjs`) aufgesetzt, Testdaten einspielbar.
- `npx prisma generate` und lokale Entwicklung verifiziert.

---

### Stand nach Teilprojekt 1.3 – API-Basis & Routing (Forms & Leads)

- Admin-API-Endpunkte implementiert:

  - `GET /api/admin/forms`
  - `GET /api/admin/forms/:id`
  - `GET /api/admin/leads?formId=...`

- Admin-API-Client in `web/lib/admin-api-client.ts`:
  - Gemeinsames `ApiResult<T>`-Pattern.
  - Hilfsfunktionen wie `fetchForms`, `fetchFormById`, `fetchLeads`.
- Healthcheck-Route:
  - `GET /api/health` (Basis-Monitoring).

---

### Stand nach Teilprojekt 1.4 – Admin-UI: Forms & Leads (List & Detail)

- Admin-UI-Seiten:

  - `/admin/forms` – Formularliste mit Basisinfos.
  - `/admin/forms/[id]` – Detailansicht (vorerst read-only).
  - `/admin/leads` – Lead-Liste mit Formularfilter (erste Version).

- Konsistentes Admin-Layout mit einfachen Navigationskacheln.
- Integration des Admin-API-Clients in die UI.

---

### Stand nach Teilprojekt 2.1 – Admin-UI & API: Form-CRUD (Create/Edit/Delete & Status)

- Vollständiges Formular-CRUD:

  - `POST /api/admin/forms` – neues Formular anlegen.
  - `PUT /api/admin/forms/:id` – Formular aktualisieren.
  - `DELETE /api/admin/forms/:id` – Soft-Delete via Status `ARCHIVED`.

- UI-Updates:

  - Formular-Erstellung und -Bearbeitung in der Admin-UI.
  - Status-Steuerung (z. B. ACTIVE/ARCHIVED) über das UI.

---

### Stand nach Teilprojekt 2.2 – Admin-UI & API: FormFields-CRUD & Reihenfolge

- Neue Endpunkte:

  - `POST /api/admin/forms/:id/fields`
  - `PUT /api/admin/forms/:id/fields/:fieldId`
  - `DELETE /api/admin/forms/:id/fields/:fieldId`
  - `POST /api/admin/forms/:id/fields/reorder`

- Logik:

  - Anlage, Bearbeitung, Löschung von `FormField`.
  - Feldreihenfolge (`order`) steuerbar über Reorder-Endpoint.

- Admin-UI:

  - `/admin/forms/[id]` erweitert zur kompletten Feldverwaltung.
  - UI-Komponenten zur Anlage, Bearbeitung und Sortierung der Felder.

---

### Stand nach Teilprojekt 2.3 – Leads-Export (CSV) & Dashboard-KPIs

**Leads-Export (CSV):**

- Neuer Endpoint: `GET /api/admin/leads/export`
  - Optionaler Query-Parameter: `formId`.
  - Response: `text/csv; charset=utf-8` mit `Content-Disposition: attachment`.
- CSV-Format:
  - Basis-Spalten:
    - `Lead ID`
    - `Form Name`
    - `Event Name`
    - `Captured By`
    - `Captured By Email`
    - `Created At` (ISO 8601)
  - Für jedes `FormField`:
    - eigene Spalte: `Label (key)`, z. B. `E-Mail (email)`.
  - Pro Zeile ein Lead, fehlende Werte = leere Zelle.
  - UTF-8 mit BOM (`\uFEFF`) für Excel-Kompatibilität.
- CSV-Hilfsfunktion:
  - `web/lib/csv.ts` mit `toCsv(headers, rows)`.

**Admin-UI – Leads-Seite:**

- `/admin/leads`:
  - Formular-Filter (`formId`) per Dropdown.
  - Tabelle mit Basisinformationen pro Lead.
  - Button **„Leads als CSV exportieren“**:
    - Export berücksichtigt den aktuellen Formular-Filter.
    - Simpler `<a href="...">`-Download auf `/api/admin/leads/export[?formId=...]`.

**Admin-Dashboard-KPIs**

- `/admin` zeigt jetzt:

  - **Gesamt-Leads** (`prisma.lead.count()`).
  - **Leads letzte 7 Tage** (`createdAt >= now - 7 Tage`).
  - **Leads heute** (`createdAt >= Start des heutigen Tages`).
  - **Top-Formulare** nach Anzahl Leads (Top 3):
    - Aggregation via `prisma.lead.groupBy({ by: ["formId"], _count: { _all: true } })`.
    - Auflösung der `formId` zu Formularnamen.
    - Liste mit Link auf `/admin/leads?formId=...`.

- Leere States:

  - Bei keinen Leads werden 0-Kennzahlen angezeigt.
  - Bereich „Top-Formulare“ zeigt eine Hinweismeldung statt Tabelle.

---

## 4. Nächste sinnvolle Schritte

- Anbindung von Events (Event-Auswahl in der Admin-UI, Filter).
- Erste einfache Auswertungen nach Event / Zeitraum.
- Vorbereitung der Mobile-App (Formular-Sync, Auth, Offline-Fähigkeit).
