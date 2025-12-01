# LeadRadar2025f – Teilprojekt 1.4: Admin-UI – Forms & Leads (List & Detail)

**Abschlussbericht, 01.12.2025**

---

## 1. Ziel

In diesem Teilprojekt wurde eine erste, nutzbare Admin-Oberfläche aufgebaut, um:

- die vorhandenen **Formulare** aus der Datenbank anzuzeigen (Liste & Detail),
- eine **Lead-Liste** auf Basis der API aufzubauen,
- einen **Formular-Filter** für die Lead-Liste zu ermöglichen.

Fokus:

- reine **Read-Only-Ansicht** (kein CRUD),
- klare, aufgeräumte UX ohne Design-Overkill,
- robustes Error- und Empty-State-Handling,
- Nutzung der bestehenden API-Endpunkte und API-Typen.

---

## 2. Ausgangslage

Aus den vorangegangenen Teilprojekten lagen bereits vor:

- **Datenmodell & Prisma-Schema** (Teilprojekt 1.2)
  - Modelle: `Form`, `FormField`, `Lead`, `LeadValue`, `Event`, `User`
  - Enums: `FormStatus`, `FieldType`
  - Migration & Seed (Demo-Formular mit Feldern)

- **API-Basis & Routing** (Teilprojekt 1.3)
  - Gemeinsame DTOs in `web/lib/api-types.ts`:
    - `FormFieldDto`, `FormDto`
    - `LeadValueDto`, `LeadDto`, `LeadSummaryDto`
    - `LeadCreateValueInput`, `LeadCreatePayload`
    - `ErrorResponse`
  - Endpoints:
    - `GET /api/health`
    - `GET /api/admin/forms`
    - `GET /api/admin/forms/:id`
    - `GET /api/admin/leads?formId=...`
    - `POST /api/leads`

Ziel von 1.4 war, diese Endpoints erstmals in einer **Admin-UI** sichtbar nutzbar zu machen.

---

## 3. Umsetzung

### 3.1 Routing & Struktur im Admin-Bereich

**Datei:** `web/app/(admin)/admin/layout.tsx`

- Gemeinsames Admin-Layout mit:
  - **Sidebar** (Desktop) inkl. Brand „LeadRadar Admin“
  - **Navigationseinträge**:
    - Dashboard (`/admin`)
    - Formulare (`/admin/forms`)
    - Leads (`/admin/leads`)
  - Einfacher Header im Mobile-Viewport.
  - Hauptbereich `<main>` mit konsistenten Abständen.

**Datei:** `web/app/(admin)/admin/page.tsx`

- Dashboard-Einstieg mit Kacheln:
  - **Formulare** – Link auf `/admin/forms`
  - **Leads** – Link auf `/admin/leads`
- Kurze Einleitung, wofür der Admin-Bereich gedacht ist.

---

### 3.2 Daten-Fetching & Shared Helper

**Datei:** `web/lib/admin-api-client.ts`

- Neuer Helper für API-Requests aus Server Components:
  - `apiGet<T>(path: string): Promise<ApiResult<T>>`
  - `ApiResult<T> = { data: T | null; error: string | null }`
- Basis-URL:
  - Fallback: `http://localhost:3000`
  - Optional: `NEXT_PUBLIC_APP_URL` für produktive Umgebungen
- Fehlerverarbeitung:
  - Fehler-JSON wird defensiv ausgewertet:
    - bevorzugt `message`-Feld (string)
    - alternativ `error`-Feld (string)
  - Liefert klare Fehlermeldungen für UI-Komponenten, ohne hart an einen konkreten Error-Typ gebunden zu sein.

---

### 3.3 Forms-UI

#### Formular-Liste – `/admin/forms`

**Datei:** `web/app/(admin)/admin/forms/page.tsx`

- Lädt Formulare via `GET /api/admin/forms` mit `apiGet<FormDto[]>`.
- Darstellung als Tabelle mit Spalten:
  - **Name** (mit Link auf Detailansicht `/admin/forms/[id]`)
  - **Status** (als Badge)
  - **Anzahl Felder** (aus `fields.length`, falls im DTO vorhanden)
  - **Erstellt am** (`createdAt` im de-CH Format)
- UX:
  - Einleitender Text mit Kontext.
  - **Error-State**: rote Box bei API-Fehler.
  - **Empty-State**: „Noch keine Formulare vorhanden.“

#### Formular-Detail – `/admin/forms/[id]`

**Datei:** `web/app/(admin)/admin/forms/[id]/page.tsx`

- Lädt ein Formular via `GET /api/admin/forms/:id` mit `apiGet<FormDto>`.
- Kopfbereich:
  - Zurück-Link: „Zurück zur Formularübersicht“
  - Name, Beschreibung
  - Status-Badge
  - Erstell- und Änderungsdatum (falls im DTO vorhanden)
  - Anzahl Felder
- Feldliste:
  - Tabellen-Ansicht mit Spalten:
    - **Reihenfolge** (laufende Nummer aus der Feldliste: 1, 2, 3, …)
    - **Label**
    - **Key**
    - **Typ** (`FieldType`)
    - **Pflichtfeld** (Ja/Nein)
- UX:
  - Fehler bei ungültiger ID → Hinweis.
  - API-Fehler → rote Fehlermeldung.
  - Keine Felder → „Dieses Formular hat noch keine Felder.“

---

### 3.4 Leads-UI

#### Formular-Filter (Client-Komponente)

**Datei:** `web/app/(admin)/admin/leads/LeadFormFilter.tsx`

- `use client`-Komponente (React + `next/navigation`).
- Props:
  - `forms: FormDto[]`
  - `currentFormId?: number`
- Funktion:
  - Dropdown „Formular“ mit:
    - „Alle Formulare“
    - Auswahl der einzelnen Formulare aus `forms`.
  - Aktualisiert die URL:
    - `/admin/leads`
    - `/admin/leads?formId=...` (bei Auswahl eines Formulars)
  - Nutzt `useTransition` für sanfte Navigation.

#### Lead-Liste – `/admin/leads`

**Datei:** `web/app/(admin)/admin/leads/page.tsx`

- Server Component mit `searchParams`:
  - Liest optionales `formId` aus `searchParams`.
- Daten-Fetching:
  - Leads:
    - ohne Filter: `GET /api/admin/leads`
    - mit Filter: `GET /api/admin/leads?formId=...`
  - Formulare:
    - `GET /api/admin/forms` (für Filter-Dropdown)
  - Responses werden mit `Array.isArray(...)` abgesichert, um Fehlstrukturen der API nicht ins UI durchschlagen zu lassen.
- Darstellung:
  - Tabelle mit:
    - **Lead-ID** (z. B. `#1`, monospace)
    - **Formularname**
    - **Eventname**
    - **Erfasst am** (Datum/Zeit im de-CH Format)
- UX:
  - Kopfbereich mit Titel und Einleitungstext.
  - Rechts oben: `LeadFormFilter` (Dropdown).
  - **Error-State**: rote Box bei API-Fehler (Leads).
  - **Empty-State**: „Noch keine Leads vorhanden.“

---

## 4. Verwendete Endpoints & Datenflüsse

### 4.1 Formulare

- **Liste**
  - UI: `/admin/forms`
  - API: `GET /api/admin/forms`
  - DTO: `FormDto[]` (inkl. optional `fields` und `createdAt`)

- **Detail**
  - UI: `/admin/forms/[id]`
  - API: `GET /api/admin/forms/:id`
  - DTO: `FormDto` mit `fields: FormFieldDto[]`

### 4.2 Leads

- **Lead-Liste**
  - UI: `/admin/leads`
  - API (ohne Filter): `GET /api/admin/leads`
  - API (mit Filter): `GET /api/admin/leads?formId=...`
  - DTO: `LeadSummaryDto[]` mit u. a.:
    - `id`
    - `formId`, `formName`
    - `eventId`, `eventName`
    - `createdAt`

- **Lead-Erfassung**
  - (Bereits in Teilprojekt 1.3 umgesetzt, hier nur konsumiert)
  - API: `POST /api/leads`
  - DTO:
    - Request: `LeadCreatePayload`
    - Response: `LeadDto` / `LeadSummaryDto` (je nach Implementation)

---

## 5. Tests & Akzeptanzkriterien

Manuelle Tests unter `npm run dev` im Ordner `web`:

1. **Admin-Dashboard**
   - Aufruf: `/admin`
   - Erwartung:
     - Dashboard-Seite lädt ohne Fehler.
     - Kacheln zu „Formulare“ und „Leads“ vorhanden.

2. **Formular-Liste**
   - Aufruf: `/admin/forms`
   - Erwartung:
     - Tabelle zeigt das Seed-Formular.
     - Spalten: Name, Status, Anzahl Felder, erstellt am.
     - Klick auf Formularname führt zu Detailseite.

3. **Formular-Detail**
   - Aufruf: `/admin/forms/1` (oder ID des Seed-Formulars)
   - Erwartung:
     - Name, Status, Beschreibung des Formulars sichtbar.
     - Tabelle mit allen Feldern (Reihenfolge, Label, Key, Typ, Pflichtfeld).
     - Zurück-Link funktioniert.

4. **Lead-Liste (ohne Filter)**
   - Aufruf: `/admin/leads`
   - Erwartung:
     - Bei vorhandenen Leads: Tabelle mit Lead-ID, Formularname, Eventname, Datum.
     - Bei keinen Leads: Empty-State „Noch keine Leads vorhanden.“

5. **Lead-Liste (mit Formular-Filter)**
   - Aufruf: `/admin/leads`
   - Nutzung des Dropdowns:
     - Auswahl eines Formulars setzt `?formId=...` in die URL.
     - Tabelle wird entsprechend gefiltert.
   - Auswahl „Alle Formulare“ entfernt `formId` wieder.

6. **Fehler-/Edge-Cases**
   - Ungültige Formular-ID (`/admin/forms/abc`) → Fehlermeldung „Ungültige Formular-ID“.
   - API-Fehler (simuliert, z. B. temporär DB aus) → rote Fehlermeldung im jeweiligen View.
   - Nicht-Array-Responses der API führen nicht zum Crash, sondern zu leeren Listen.

Alle Akzeptanzkriterien aus der Aufgabenstellung sind erfüllt:

- `npm run dev` läuft fehlerfrei.
- Admin-UI bietet:
  - `/admin` Einstiegsseite.
  - `/admin/forms` Formularliste mit Daten aus der DB.
  - `/admin/forms/[id]` Detailansicht mit Feldern.
  - `/admin/leads` Lead-Liste mit optionalem Formular-Filter.
- Leere States und Fehlermeldungen brechen das Layout nicht.

Die verbleibenden Source-Map-Meldungen im Dev-Server stammen aus Next.js/Turbopack-Chunks (`.next/dev/server/chunks/...`) und betreffen nicht die Funktionalität der Anwendung.

---

## 6. Nächste Schritte / Empfehlungen

- **Events-UI**:
  - Events-Liste & Event-Detail (inkl. verknüpfte Formulare/Leads).

- **Paginierung & Suche**:
  - Paginierung für Leads bei wachsendem Datenbestand.
  - Textsuche/Filter (z. B. nach Event, Datum, Stichworten).

- **Bearbeitung (CRUD)**:
  - Formulare bearbeiten, Felder hinzufügen/ändern.
  - Events verwalten.

- **Auth & Rollen**:
  - Absicherung der Admin-Endpoints.
  - Rollen-/Rechte-System (z. B. Admin vs. Event-spezifische User).
