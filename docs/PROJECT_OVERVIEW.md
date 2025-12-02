# LeadRadar2025f – PROJECT OVERVIEW

LeadRadar ist eine SaaS-Lösung zur digitalen Leaderfassung auf Messen.  
Kernidee: Formulare werden im Admin-Web (Browser) erstellt und konfiguriert, in eine Mobile-App synchronisiert und dort für die schnelle Leaderfassung genutzt. Leads landen zentral im Backend und können per CSV exportiert oder in andere Systeme übernommen werden.

---

## 1. Tech-Stack & Architektur

### 1.1 Web / Backend

- **Framework:** Next.js (App Router), TypeScript
- **Datenbank:** PostgreSQL (lokal/Cloud)
- **ORM:** Prisma
- **API:** Next.js API-Routen (REST)
- **Auth (Zielbild):** API-Key / Header-basierte Auth (kein Clerk)
- **Mailing:** Nodemailer + SMTP (ENV-gesteuert, optional)

### 1.2 Mobile (geplante Struktur ab Teilprojekt 3.x)

- **Framework:** Expo / React Native
- **Sprache:** TypeScript
- **Plattformen:** iOS (später Android)
- **API-Anbindung:** REST-Client auf Basis von `fetch` und `EXPO_PUBLIC_API_BASE_URL`
- **Repository-Status:** Im Repo `leadradar2025f` existiert aktuell noch kein `/mobile`-Ordner.  
  Ab Teilprojekt 3.1 ist die Zielstruktur, Navigation und der API-Contract definiert; die tatsächliche Codebasis wird in späteren 3.x-Teilprojekten an diese Struktur angelehnt.

---

## 2. Datenmodell (Kern-Entities)

- **User**
  - Admin-Benutzer des Systems (Login für Web-UI).
- **Event**
  - Messe / Veranstaltung (optional für spätere Zuordnung von Leads).
- **Form**
  - Lead-Formular (Name, Beschreibung, Status: `DRAFT` / `ACTIVE` / `ARCHIVED`).
- **FormField**
  - Felder eines Formulars (Key, Label, Typ, Required, Options, Reihenfolge).
- **Lead**
  - Erfasster Lead (Referenz auf `Form`, Meta-Infos).
- **LeadValue**
  - Ein einzelner Feldwert innerhalb eines Leads (Verknüpfung von `Lead` + `FormField.key` + Wert).

---

## 3. Verzeichnisstruktur (Top-Level)

- `/web` – Next.js-App (Admin-UI + API)
  - `app/(admin)/admin/...` – Admin-Oberfläche (Forms, Fields, Leads, Dashboard)
  - `app/api/...` – REST-Endpoints (Forms, Leads, Health, Export, Mail-Flow)
  - `prisma/...` – Prisma-Schema, Seed-Script
  - `docs/...` – Projektdokumentation (inkl. dieser Datei)
- `/mobile` – Expo / React Native App (**geplant**)
  - Wird in späteren Teilprojekten nach dem in 3.1 definierten Zielbild aufgebaut oder angebunden.

---

## 4. Teilprojekte & aktueller Stand

### 4.1 Teilprojekt 1.1 – Projekt-Setup & Web-Basis

- Next.js 16 App im Ordner `/web` aufgesetzt.
- TypeScript, ESLint/Prettier-Basis integriert.
- Grundstruktur für App Router und API-Routen vorbereitet.
- Git-Repo `leadradar2025f` erstellt und initialer Commit gepusht.

### 4.2 Teilprojekt 1.2 – Datenmodell & Prisma-Schema (Forms & Leads)

- Prisma-Schema für Kern-Entities erstellt:
  - `User`, `Event`, `Form`, `FormField`, `Lead`, `LeadValue`.
- Migrationen ausgeführt (`npx prisma migrate dev`).
- Seed-Script (`prisma/seed.cjs`) erstellt und erfolgreich getestet.
- Basis-Daten (Demo-Forms & Felder) für Entwicklung angelegt.

### 4.3 Teilprojekt 1.3 – API-Basis & Routing (Forms & Leads)

- REST-Endpoints implementiert:
  - `GET /api/admin/forms`
  - `GET /api/admin/forms/:id`
  - `GET /api/admin/leads` (Filter nach `formId`)
  - `POST /api/leads` (öffentlicher Lead-Endpoint)
  - `GET /api/health`
- Fehlerbehandlung und grundlegende Validierung implementiert.
- Erste manuelle Tests via Browser / HTTP-Client (z. B. Postman) durchgeführt.

### 4.4 Teilprojekt 1.4 – Admin-UI: Forms & Leads (List & Detail)

- Admin-Seiten für:
  - Formularübersicht (Liste, Status, Anzahl Leads).
  - Formulardetail (Basisinfos, später Felder).
  - Leads-Liste (Filter nach Formular).
- Navigation im Admin-Bereich konsolidiert.
- Basis-KPIs im Dashboard (z. B. Anzahl Leads, aktive Formulare).

### 4.5 Teilprojekt 2.1 – Admin-UI & API: Form-CRUD

- Vollständiges Formular-CRUD (Create / Read / Update / Delete) umgesetzt.
- Status-Handling (Entwurf vs. Aktiv vs. Archiviert).
- Gesicherte API-Endpoints für Formularverwaltung.
- UX: Bestätigungs-Dialoge für kritische Aktionen (Löschen).

### 4.6 Teilprojekt 2.2 – Admin-UI & API: FormFields-CRUD & Reihenfolge

- CRUD für `FormField` im Admin:
  - Feld hinzufügen, bearbeiten, löschen.
  - Typen (Text, E-Mail, Select, Checkbox, etc.).
  - Pflichtfelder (`required`) und Optionswerte.
- Reihenfolge der Felder per Sortierung konfigurierbar.
- API liefert Formulare inklusive sortierter `FormField[]`.

### 4.7 Teilprojekt 3.1 – Mobile-Kernflows: Review & Konsolidierung (**dieses Teilprojekt**)

- Mobile-Teil wurde konzeptionell an das bestehende Backend angebunden.
- Zielstruktur für den `/mobile`-Ordner definiert (Expo/React Native, Tabs, Screens, API-Client, Typen).
- End-to-End-Flow beschrieben:
  - Admin erstellt Form → Mobile lädt Form → Lead wird erfasst → Lead erscheint im Admin → CSV-Export und E-Mail-Flow (MVP).
- Payload-Contract für `POST /api/leads` (inkl. `values`-Mapping & `meta`) dokumentiert.
- Offene UX-/Tech-Aufgaben als TODO-Liste für 3.x gesammelt.
- Detaildokument: `docs/teilprojekt-3.1-mobile-kernflows-review.md`.

### 4.8 Teilprojekt 4.1 – Sofort-Aktion: Danke-E-Mail & Innendienst-Mail nach Lead-Erfassung

- E-Mail-Logik in `POST /api/leads` integriert:
  - Optionale Danke-Mail an Besucher (falls `email` vorhanden).
  - Innendienst-/Sales-Mail an Sammeladresse.
- Konfiguration vollständig über ENV:
  - `MAIL_ENABLED`, SMTP-Settings, Absender/Empfänger.
- Wichtig: Lead-Persistenz priorisiert – E-Mail-Fehler lassen den Lead-Request nicht fehlschlagen.
- E-Mail-Flow als MVP / technische Option dokumentiert; spätere Integration mit CRM-/Mail-Diensten möglich.

---

## 5. Roadmap (Ausblick relevante Teilprojekte)

- **3.2 Mobile – UX & Feedback**
  - Verbesserte Loading-/Fehleranzeige.
  - Konsistenter Success-Flow nach Lead-Speicherung.
- **3.3 Mobile – QR-Scan**
  - QR-Scanner zum Vorbefüllen von Kontaktfeldern.
- **3.4 Mobile – Visitenkarten-OCR**
  - Visitenkarten abfotografieren und Felder automatisch ausfüllen lassen.
- **3.5 Mobile – Offline-Puffer & Sync**
  - Leads offline erfassen und später synchronisieren.
- **3.6 Mobile – Typ-Synchronisation**
  - Gemeinsame Typdefinitionen für Backend und Mobile.
- **3.7 Mobile – Events-Integration**
  - Events-Tab mit echter Backend-Anbindung und `eventId` in Lead-Meta.
- **5.x Integrationen**
  - Export-/Sync zu CRM-Systemen.
  - Webhooks für Echtzeit-Weiterverarbeitung.
