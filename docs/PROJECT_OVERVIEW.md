# LeadRadar2025f – Projektübersicht

SaaS-Lösung zur digitalen Leaderfassung auf Messen (Admin-Web-App, Backend-API, Mobile-App).

- Admin-UI für Formulare, Felder, Leads & Auswertungen.
- Backend-API (Next.js App Router + Prisma/PostgreSQL).
- Mobile-App (separates Projekt) zur Lead-Erfassung auf dem Messestand.

---

## Teilprojekt 1.1 – Projekt-Setup & Web-Basis

**Ziele:**

- Next.js App-Router-Projekt im Ordner `web`.
- TypeScript, ESLint, Prettier, Tailwind-Basis.
- Prisma-Setup mit PostgreSQL-Verbindung.
- Erste Basis-Seiten / Layout (Admin-Shell).

**Ergebnis:**

- Projekt-Root: `C:\dev\leadradar2025f`.
- Web-App: `C:\dev\leadradar2025f\web`.
- `npm run dev` startet die Next-App auf `http://localhost:3000`.
- Prisma-Konfiguration (`prisma/schema.prisma`) eingerichtet.
- Erste DB-Migration via `npx prisma migrate dev`.

---

## Teilprojekt 1.2 – Datenmodell & Prisma-Schema (Forms & Leads)

**Ziele:**

- Datenmodell für Formulare & Leads definieren.
- Prisma-Modelle:
  - `Form`
  - `FormField`
  - `Lead`
  - `LeadValue`
  - `Event`
  - `User` (für spätere Auth / Ownership).

**Ergebnis:**

- Prisma-Schema enthält alle nötigen Modelle und Relationen:
  - Ein `Form` hat mehrere `FormField`s.
  - Ein `Form` hat mehrere `Lead`s.
  - Ein `Lead` hat mehrere `LeadValue`s.
  - Optionaler Bezug zu `Event`.
- Seed-Skript (`prisma/seed.cjs`) legt Testdaten an (z. B. Demo-Formular).
- `node prisma/seed.cjs` läuft sauber durch.

---

## Teilprojekt 1.3 – API-Basis & Routing (Forms & Leads)

**Ziele:**

- REST-Endpoints auf Basis des App-Routers:
  - `/api/admin/forms` (Listen, Details, ggf. CRUD).
  - `/api/leads` (Lead-Erfassung von Mobile/Frontend).
- DTO-Strukturen in `web/lib/api-types.ts`.

**Ergebnis:**

- `POST /api/leads` nimmt einen Request-Body mit:
  - `formId`
  - `values` (Key-Value-Objekt, Keys entsprechen `FormField.key`).
- Server-seitige Validierung:
  - Existenz des Formulars.
  - Struktur der `values`.
  - Pflichtfelder werden geprüft (abhängig vom FormField-Schema).
- Lead-Persistenz:
  - `Lead` + zugehörige `LeadValue`s werden korrekt angelegt.
- Admin-API-Basis in `web/app/api/admin/*` geschaffen.

---

## Teilprojekt 1.4 – Admin-UI: Forms & Leads (List & Detail)

**Ziele:**

- Admin-Frontend zur Verwaltung von Formularen und Leads.
- Seitenstruktur unter `(admin)`:

  - `/admin/forms` – Formularübersicht.
  - `/admin/forms/[id]` – Formulardetail.
  - `/admin/leads` – Leadliste.

**Ergebnis:**

- React/Next-Admin-Layout (z. B. Sidebar + Topbar) implementiert.
- Anzeige der vorhandenen Formulare in einer Tabelle (Name, Status, Anzahl Leads, etc.).
- Anzeige der vorhandenen Leads (Formular, Datum, Event, etc.).
- Detailseiten mit Basisinformationen.

---

## Teilprojekt 2.1 – Admin-UI & API: Form-CRUD (Create/Edit/Delete & Status)

**Ziele:**

- Vollständiges Formular-Management:
  - Anlegen, Bearbeiten, Löschen von Formularen.
  - Status (z. B. ACTIVE/INACTIVE/ARCHIVED).

**Ergebnis:**

- API-Endpoints für Form-CRUD unter `/api/admin/forms`.
- Admin-UI:
  - Formular-Create-Flow.
  - Formular-Edit-Flow.
  - Löschen mit Sicherheitsabfrage.
- Status-Steuerung:
  - Nur aktive Formulare werden in der Lead-Erfassung angeboten.

---

## Teilprojekt 2.2 – Admin-UI & API: FormFields-CRUD & Reihenfolge

**Ziele:**

- Verwaltung von Formularfeldern je Formular:
  - Anlegen, Bearbeiten, Löschen.
  - Typen (Text, E-Mail, Nummer, Auswahl, etc.).
  - Pflichtfeld-Flag.
  - Sortier-Reihenfolge.

**Ergebnis:**

- API-Endpoints `/api/admin/forms/[id]/fields` für CRUD & Sortierung.
- Admin-UI-Komponenten:
  - `FormMetaSection` (Formular-Metadaten).
  - `FormFieldsManager` (Feldliste, Reihenfolge, Edit-Dialog).
- Reihenfolge der Felder wird in der DB gespeichert und in der Lead-Erfassung berücksichtigt.

---

## Teilprojekt 2.3 – Leads-Export (CSV) & Admin-Dashboard-KPIs

**Ziele:**

- CSV-Export aller Leads (optional gefiltert nach `formId`).
- Dashboard-KPIs auf der Admin-Startseite.

**Ergebnis:**

- Neuer CSV-Helper `web/lib/csv.ts`:
  - `toCsv(headers, rows)` inkl. sauberes Escaping + UTF-8-BOM für Excel.
- Endpoint `GET /api/admin/leads/export`:
  - Optionaler Query-Parameter `formId`.
  - Liefert CSV-Inhalt (Content-Type `text/csv` + Download-Header).
- Dashboard `/admin`:
  - Gesamtanzahl Leads.
  - Leads der letzten 7 Tage.
  - Leads heute.
  - Top-Formulare nach Anzahl Leads.

---

## Teilprojekt 4.1 – Sofort-Aktion: Danke-E-Mail & Innendienst-Mail nach Lead-Erfassung

**Ziel:**  
Nach jeder erfolgreichen Lead-Erfassung (egal ob Mobile-App oder Admin-UI) können automatisierte E-Mails als Sofortaktion ausgelöst werden:

- Optional eine **Danke-Mail** an den Besucher (falls eine E-Mail-Adresse im Lead erfasst wurde).
- Eine **Innendienst-Mail** an eine Sammeladresse (z. B. Verkauf / Backoffice).

> **Status:**  
> Der E-Mail-Flow ist aktuell als **MVP / technische Option** implementiert.  
> Ob der finale Flow genau so genutzt wird oder später anders realisiert wird, ist noch offen.

### Technische Umsetzung

- Neues Modul `web/lib/mail.ts`:

  - SMTP-Transport (Nodemailer) gemäss ENV-Konfiguration.
  - `sendMail()` als Low-Level-Wrapper.
  - `sendThankYouMail()` für Besucher-Dankemails.
  - `sendLeadNotifyMail()` für Innendienst-Benachrichtigungen.
  - `isMailEnabled()` als globaler Schalter (liest `MAIL_ENABLED`).

- ENV-Variablen (in `.env` / `.env.example` dokumentiert):

  - `MAIL_ENABLED` – `"true"` aktiviert den Versand, alles andere deaktiviert.
  - `MAIL_SMTP_HOST`, `MAIL_SMTP_PORT`, `MAIL_SMTP_USER`, `MAIL_SMTP_PASS` – SMTP-Zugang.
  - `MAIL_FROM` – Absenderadresse.
  - `MAIL_LEADS_NOTIFY` – Sammeladresse für Innendienst.

- Endpoint `POST /api/leads`:

  - Persistiert weiterhin den Lead inkl. `LeadValue`s (bestehende Validierung bleibt).
  - Nach erfolgreichem `prisma.lead.create(...)` wird `handleLeadMails(...)` aufgerufen.
  - E-Mail-Fehler:
    - werden geloggt,
    - brechen den HTTP-Request **nicht** ab,
    - werden im Response im Feld `mailStatus` zusammengefasst (`"disabled" | "ok" | "partial" | "error"`).

### Business-Sicht

- Besucher können unmittelbar eine Bestätigung und Wertschätzung nach dem Messekontakt erhalten.
- Der Innendienst kann sofort eine strukturierte Übersicht des neuen Leads per E-Mail erhalten (inkl. Feldwerte), und priorisieren/nachfassen.
- Der Mail-Versand ist über `MAIL_ENABLED` jederzeit pro Umgebung ein- oder ausschaltbar (z. B. lokal deaktiviert, Stage aktiv, Prod aktiv).
- Da der Flow als MVP umgesetzt ist, kann die konkrete Ausprägung (Templates, Empfängerlogik, Triggerzeitpunkt) in späteren Teilprojekten noch angepasst werden.

---

## Nächste mögliche Teilprojekte

- **4.2**: Per-Formular-E-Mail-Templates (eigene Texte & Betreffzeilen).
- **4.3**: Mehrsprachige Mail-Templates (DE/EN).
- **5.x**: Mobile-App-Integration (Form-Selection, Offline-Puffer, Sync).
- **6.x**: Auswertungen & Reporting (Charts, Form-Performance, Conversion-Rates).
