# Teilprojekt 2.3 – Leads-Export (CSV) & Admin-Dashboard-KPIs

## 1. Ziel & Scope

Dieses Teilprojekt erweitert LeadRadar um:

1. Einen **CSV-Export** aller erfassten Leads (optional gefiltert nach Formular).
2. Ein **Admin-Dashboard** mit den wichtigsten Kennzahlen:
   - Gesamtanzahl Leads
   - Leads der letzten 7 Tage
   - Leads heute
   - Top-Formulare nach Anzahl Leads

Fokus: robuste Funktionalität, sinnvolles CSV-Format für Excel/CRM-Importe, klare Kennzahlen im Dashboard. High-End-Visualisierung ist explizit nicht Teil dieses Teilprojekts.

---

## 2. Leads-Export (CSV)

### 2.1 Business-Sicht

Admin-User sollen ihre Messe-Leads in ein **universelles Format** exportieren können, um:

- Daten in CRM-Systeme zu importieren.
- individuelle Auswertungen in Excel/BI-Tools zu erstellen.
- Agenturen/Partnern Rohdaten zur Verfügung zu stellen.

Der Export soll:

- **alle relevanten Informationen** pro Lead enthalten.
- **formunabhängig** funktionieren (d. h. mehrere Formulare in einem Export).
- **ohne manuellen Nachbearbeitungsaufwand** direkt in Excel geöffnet werden können.

### 2.2 Endpoint & Verhalten

- Endpoint: `GET /api/admin/leads/export`
- Optionaler Query-Parameter: `formId` (integer)

**Verhalten:**

- Ohne `formId`:
  - Exportiert alle Leads im System.
- Mit `formId`:
  - Exportiert nur Leads dieses Formulars.

**Response-Header:**

- `Content-Type: text/csv; charset=utf-8`
- `Content-Disposition: attachment; filename="leads.csv"`
  - bei Filter z. B. `leads-form-<formId>.csv`

### 2.3 CSV-Format

**Basis-Spalten (pro Lead):**

1. `Lead ID` – interne ID aus der Datenbank.
2. `Form Name` – Name des Formulars.
3. `Event Name` – Name des zugeordneten Events (falls vorhanden).
4. `Captured By` – Name des Users, der den Lead erfasst hat (falls vorhanden).
5. `Captured By Email` – E-Mail-Adresse des erfassenden Users (falls vorhanden).
6. `Created At` – Zeitstempel der Erfassung, ISO 8601 (`toISOString()`).

**Dynamische Spalten für Form-Felder:**

- Für jedes `FormField` wird eine eigene Spalte erzeugt.
- Spaltenname:
  - `Label (key)`, z. B. `E-Mail (email)` oder `Firma (company)`.
- Grundlage:
  - Alle `FormField`-Definitionen der exportierten Formulare (inklusive solcher, die noch keinen Wert in einem Lead haben).

**Zeilenstruktur:**

- **Eine Zeile = ein Lead.**
- Für jede Field-Spalte:
  - Wird der `LeadValue` mit passendem `field.key` gesucht.
  - Wenn kein Wert vorhanden ist → leere Zelle.
- Fehlende oder `null`-Werte werden auf `""` gemappt.

### 2.4 Technische Umsetzung

- Datei: `web/app/api/admin/leads/export/route.ts`
- Prisma-Queries:
  - `form.findMany(...)` inkl. `fields` zur Ermittlung der Feldstruktur.
  - `lead.findMany(...)` inkl. `form`, `event`, `capturedBy`, `values.field`.
- CSV-Helfer:
  - Datei `web/lib/csv.ts`
  - Funktion `toCsv(headers: string[], rows: CsvPrimitive[][]): string`
  - Features:
    - korrekte Behandlung von Kommas, Anführungszeichen und Zeilenumbrüchen.
    - Anführungszeichen werden gedoppelt.
    - Felder mit Sonderzeichen werden in `"..."` eingeschlossen.
    - Voranstellen eines **UTF-8-BOM** (`\uFEFF`) für Excel-Kompatibilität.

---

## 3. Admin-UI: Leads-Seite mit CSV-Export

### 3.1 `/admin/leads` – Übersicht & Filter

Die Leads-Übersicht bietet:

- Formular-Filter:
  - Dropdown mit allen nicht-archivierten Formularen.
  - Option „Alle Formulare“.
- Tabelle mit Basisinformationen pro Lead:
  - Erfassungszeit (`createdAt`).
  - Formularname.
  - Eventname.
  - Erfasser (Name + optional E-Mail).

Der Filter wirkt sowohl auf die Tabelle als auch auf den CSV-Export.

### 3.2 CSV-Export-Button

- Button: **„Leads als CSV exportieren“**
- Implementierung:
  - Klassischer `<a href="...">`-Link auf:
    - `/api/admin/leads/export` (ohne Filter)
    - `/api/admin/leads/export?formId=...` (mit Filter)
- Gründe für diese Lösung:
  - Sehr robust, kein Client-JavaScript notwendig.
  - Browser übernimmt Download und Dateihandling.
  - Einfaches Verhalten für Admin-User (Standard-Download).

---

## 4. Admin-Dashboard-Kennzahlen

### 4.1 Ziel

Die `/admin`-Startseite soll Admins eine **schnelle Einschätzung** der aktuellen Aktivität liefern:

- Wie viele Leads insgesamt?
- Wie aktiv sind die letzten Tage?
- Was passiert heute?
- Welche Formulare sind am wichtigsten/aktivsten?

### 4.2 Kennzahlen

**Kacheln (Metric Cards):**

1. **Gesamt-Leads**
   - `prisma.lead.count()`
2. **Leads letzte 7 Tage**
   - `createdAt >= now - 7 Tage`
3. **Leads heute**
   - `createdAt >= Start des heutigen Tages` (0 Uhr)

Alle drei Kacheln sind in einer Grid-Reihe dargestellt.

**Top-Formulare:**

- Aggregation via `prisma.lead.groupBy({ by: ["formId"], _count: { _all: true } })`.
- Auflösung der `formId` zu `Form.name` durch zusätzlichen Query.
- Sortierung nach Anzahl Leads (absteigend).
- Anzeige der **Top 3** Formulare.
- Je Zeile:
  - Formularname (Link auf `/admin/leads?formId=...`).
  - Anzahl Leads.

### 4.3 Leere States

- Wenn keine Leads im System:
  - Kennzahlen zeigen `0`.
  - Bereich „Top-Formulare“ zeigt Text:  
    _„Noch keine Leads erfasst. Sobald Leads erfasst werden, erscheinen hier die aktivsten Formulare.“_

---

## 5. UX-Details & Offene Punkte

- Die Kennzahlen sind bewusst **minimalistisch** gehalten und können später um:
  - Event-Filter,
  - Zeiträume (z. B. letzte 30 Tage),
  - Conversion-Raten
  erweitert werden.
- Für das CSV-Format ist aktuell das **stabile Mapping** über `FormField.key` plus lesbares `Label` entscheidend.
  - Für künftige Integrationen (CRM, Marketing-Automation) kann auf diese Keys gemappt werden.
- Der Export ist aktuell **nicht authentifiziert/autorisiert** dokumentiert – die Sicherheits- und Rollenlogik wird in separaten Teilprojekten adressiert.
