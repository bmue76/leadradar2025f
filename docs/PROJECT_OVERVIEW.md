# LeadRadar2025f – Projektübersicht

SaaS-Lösung zur **digitalen Leaderfassung auf Messen**.  
Kernidee: Formulare im Admin-Backend konfigurieren, an eine Mobile-App pushen und Leads vor Ort erfassen – inkl. späterem Export in CRM-Systeme.

---

## 1. Architektur & Tech-Stack

- **Monorepo**: `leadradar2025f`
- **Web-Admin / Backend**
  - Framework: **Next.js** (App Router, TypeScript)
  - Styling: **Tailwind CSS v4**
  - API: Route-Handler unter `/api/*`
  - ORM: **Prisma** mit PostgreSQL (Modelle: Form, FormField, Lead, LeadValue, Event, User)
- **Mobile-App**
  - (Geplant / in separaten Teilprojekten): React Native / Expo
  - Lädt Formulare & Events aus der API, erfasst Leads offline/online

Zentrales Prinzip: **Shared Types** zwischen API & Frontend in `web/lib/api-types.ts`, um eine konsistente Datenstruktur zu haben.

---

## 2. Bisherige Teilprojekte

### 2.1 Teilprojekt 1.1 – Projekt-Setup & Web-Basis

Ziele:
- Next.js-App mit App Router & TypeScript im Ordner `web`.
- Basis-Layout für die Admin-Shell.

Umgesetzt:
- Next.js + TypeScript + Tailwind v4 Grundsetup.
- Admin-Bereich unter `app/(admin)/admin` angelegt.
- Layout-Struktur mit Sidebar/Header definiert.
- Erste Navigation zum Admin-Dashboard (`/admin`).

---

### 2.2 Teilprojekt 1.2 – Datenmodell & Prisma-Schema (Forms & Leads)

Ziele:
- Abbildung des Kern-Domainmodells: Events, Formulare, Felder, Leads & Lead-Werte.
- Prisma-Schema und Migrationen lauffähig machen.

Umgesetzt:
- Prisma-Schema mit den Kernmodellen:
  - **Form, FormField**
  - **Lead, LeadValue**
  - **Event, User**
- Enums:
  - **FormStatus** (z. B. DRAFT, ACTIVE, ARCHIVED)
  - **FieldType** (z. B. TEXT, EMAIL, SELECT, CHECKBOX, …)
- Migration & Seed:
  - `node prisma/seed.cjs` läuft durch.
  - Demo-Formular + Felder + Demo-Daten werden angelegt.

Resultat:
- Datenbank-Grundlage für Formulare, Felder und Leads steht.
- Seed stellt sicher, dass direkt ein erstes Formular verfügbar ist.

---

### 2.3 Teilprojekt 1.3 – API-Basis & Routing (Forms & Leads)

Ziele:
- Erste stabile HTTP-API-Schicht aufbauen, um:
  - Im Admin-Frontend Formulare & Leads lesen zu können.
  - In der Mobile-App Formulare zu laden und Leads zu erfassen.
- Healthcheck für App & Datenbank.

Umgesetzt:
- Gemeinsame API-Typen in `web/lib/api-types.ts`:
  - `FormFieldDto`, `FormDto`
  - `LeadValueDto`, `LeadDto`, `LeadSummaryDto`
  - `LeadCreateValueInput`, `LeadCreatePayload`
  - `ErrorResponse`
- Endpoints (alle getestet unter `npm run dev`):
  - `GET /api/health`
  - `GET /api/admin/forms`
  - `GET /api/admin/forms/:id`
  - `GET /api/admin/leads?formId=...`
  - `POST /api/leads` (Lead-Erfassung aus der Mobile-App)
- Typisierte Responses auf Basis der oben genannten DTOs.

Resultat:
- API-Schicht ist funktional, die wichtigsten Lese- und Schreibpfade sind vorhanden.
- Die Endpoints können direkt von Admin-UI und Mobile-App genutzt werden.

---

### 2.4 Stand nach Teilprojekt 1.4 – Admin-UI: Forms & Leads (List & Detail)

Ziele:
- Erste nutzbare Admin-Oberfläche für:
  - Formular-Liste & Formular-Details
  - Lead-Liste mit optionalem Formular-Filter
- Fokus auf **Read-Only**, klares Layout, sauberes Error-/Empty-State-Handling.

Umgesetzt:

**Routing & Struktur**

- `web/app/(admin)/admin/layout.tsx`
  - Sidebar-Navigation mit Links:
    - Dashboard (`/admin`)
    - Formulare (`/admin/forms`)
    - Leads (`/admin/leads`)
  - Konsistentes Layout mit Sidebar (Desktop) und einfachem Header (Mobile).

- `web/app/(admin)/admin/page.tsx`
  - Einfaches Admin-Dashboard mit Kacheln zu:
    - **Formulare**
    - **Leads**

**Forms-UI**

- `web/app/(admin)/admin/forms/page.tsx`
  - Lädt Formulare via `GET /api/admin/forms`.
  - Zeigt Tabelle mit:
    - Name (mit Link auf Detailansicht)
    - Status
    - Anzahl Felder (falls im DTO enthalten oder via `fields.length`)
    - `createdAt` als Datum (de-CH Format)
  - Empty-State: „Noch keine Formulare vorhanden.“
  - Fehlerzustand: rote Fehlermeldung bei API-Problemen.

- `web/app/(admin)/admin/forms/[id]/page.tsx`
  - Lädt ein einzelnes Formular via `GET /api/admin/forms/:id`.
  - Kopfbereich mit:
    - Name, Beschreibung
    - Status
    - Erstell- und Änderungsdatum
    - Anzahl Felder
  - Darunter eine Tabelle der Felder:
    - Reihenfolge (1, 2, 3, … entsprechend der gelieferten Feldliste)
    - Label
    - Key
    - Typ (`FieldType`)
    - Pflichtfeld (Ja/Nein)
  - Empty-State, falls ein Formular (noch) keine Felder hat.
  - Fehlermeldungen bei ungültiger ID oder API-Fehlern.

**Leads-UI**

- `web/app/(admin)/admin/leads/page.tsx`
  - Lädt Leads via:
    - `GET /api/admin/leads` oder
    - `GET /api/admin/leads?formId=...` (wenn Filter aktiv).
  - Lädt zusätzlich Formulare via `GET /api/admin/forms` für den Filter.
  - Zeigt Tabelle mit:
    - **Lead-ID** (z. B. `#1`, monospace)
    - **Formularname**
    - **Eventname**
    - **Erfassungsdatum/-zeit**
  - Empty-State: „Noch keine Leads vorhanden.“
  - Fehlerzustand: rote Fehlermeldung auf Basis der API-Fehlerantwort.

- `web/app/(admin)/admin/leads/LeadFormFilter.tsx`
  - Client-Komponente mit Dropdown:
    - „Alle Formulare“ oder spezifisches Formular.
  - Aktualisiert `formId` in der URL (`/admin/leads?formId=...`) via Router.
  - Nutzt `useTransition` für sanftere Navigation.

**Shared Helper**

- `web/lib/admin-api-client.ts`
  - `apiGet<T>(path)`: Wrapper um `fetch()` mit:
    - Fallback-Basis-URL `http://localhost:3000`
    - Auswertung des Fehler-JSONs (z. B. `message` oder `error`-Feld), um lesbare Fehlermeldungen zu erzeugen.
    - Einheitliches `ApiResult<T>`-Format (`{ data, error }`).

Resultat:
- Admin-UI kann:
  - Formulare (Liste & Detail) anzeigen.
  - Leads anzeigen und optional nach Formular filtern.
- Alle Views sind **Read-Only**, klar strukturiert und robust gegen Fehler/Empty-States.

---

## 3. Nächste sinnvolle Schritte

- **Teilprojekt 1.5 – Admin-UI: Events & Leads-Detail**
  - Event-Verwaltung (Liste & Detail) im Admin.
  - Optionale Lead-Detail-Ansicht mit allen Feldwerten.

- **Teilprojekt 2.x – Auth & Zugriffskontrolle**
  - Härtung der API mit Auth-Zwischenschicht.
  - Rollen-/Rechte-System für Admin-User.

- **Teilprojekt 3.x – Formbuilder**
  - Visueller Formbuilder mit Drag & Drop.
  - Verbindung zur bestehenden Form-/Lead-Struktur und Mobile-App.
