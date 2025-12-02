# LeadRadar2025f – Teilprojekt 4.1  
Sofort-Aktion: Danke-E-Mail & Innendienst-Mail nach Lead-Erfassung

> **Status:**  
> Der E-Mail-Flow ist als **MVP** implementiert.  
> Ob diese Lösung 1:1 produktiv übernommen wird oder später ein anderer Flow (z. B. über externen Mail-Dienst oder CRM-Integration) zum Einsatz kommt, ist noch offen.

---

## 1. Zielsetzung

Nach jeder erfolgreichen Lead-Erfassung (unabhängig davon, ob der Lead über die Mobile-App oder die Admin-UI erfasst wurde) sollen automatisierte E-Mails ausgelöst werden:

1. **Danke-Mail** an den Besucher (falls eine E-Mail-Adresse erfasst wurde).
2. **Innendienst-Mail** an eine Sammeladresse (z. B. `sales@firma.ch`), damit der Innendienst sofort über neue Leads informiert ist.

Wichtig:  
Der Lead darf **immer** gespeichert werden – E-Mail-Probleme dürfen den Request **nicht** zum Fehlschlag bringen.

---

## 2. Business-Sicht – Was passiert nach einer Lead-Erfassung?

1. Ein Mitarbeiter erfasst auf der Messe (oder im Innendienst via Admin-UI) einen neuen Lead.
2. Der Lead wird in der LeadRadar-Datenbank gespeichert (inkl. aller Feldwerte).
3. Direkt danach:
   - Wird geprüft, ob im Lead ein Feld mit Key `"email"` (oder vergleichbar) vorhanden ist.
   - Falls ja, erhält der Besucher eine **Danke-Mail**:
     - Betreff z. B.: „Vielen Dank für Ihren Besuch bei [Event/Firmenname]“.
     - Inhalt: kurze Bestätigung, Dank für den Besuch, Hinweis auf weiteres Vorgehen.
   - Zusätzlich (sofern `MAIL_LEADS_NOTIFY` gesetzt ist) erhält der Innendienst eine
     **Lead-Benachrichtigung**:
     - Betreff: „Neuer Lead von LeadRadar – [Formularname]“.
     - Inhalt: Basisinfos (Lead-ID, Formular, Event, Datum) + tabellarische Übersicht aller Feldwerte.

4. Falls E-Mail-Versand nicht möglich ist (z. B. SMTP down oder falsche Credentials):
   - Der Lead bleibt **trotzdem** gespeichert.
   - Der Fehler wird im Server-Log dokumentiert.
   - Der API-Response enthält eine `mailStatus`-Information, die anzeigt, ob Mails gesendet werden konnten.

---

## 3. Technische Umsetzung

### 3.1. ENV-Variablen

In `.env.example` und `.env` sind folgende Variablen definiert:

- `MAIL_ENABLED`  
  - `"true"`: Mails werden versendet.  
  - jeder andere Wert / nicht gesetzt: Mails werden **deaktiviert**.

- `MAIL_SMTP_HOST`  
  - Hostname des SMTP-Servers (z. B. `mail.metanet.ch`).

- `MAIL_SMTP_PORT`  
  - Port des SMTP-Servers (typisch `587` für STARTTLS oder `465` für SSL/TLS).

- `MAIL_SMTP_USER`, `MAIL_SMTP_PASS`  
  - Zugangsdaten für den SMTP-Account.

- `MAIL_FROM`  
  - Absenderadresse, z. B. `"LeadRadar Demo <noreply@firma.ch>"`.

- `MAIL_LEADS_NOTIFY`  
  - Sammeladresse für Innendienst-Benachrichtigungen (z. B. `sales@firma.ch`).

> Hinweis: In lokalen Dev-Umgebungen kann `MAIL_ENABLED=false` gesetzt werden, um echten Mailversand zu verhindern.

---

### 3.2. Mail-Infrastruktur (`web/lib/mail.ts`)

- Verwendung von **Nodemailer** mit klassischem SMTP-Transport.
- Zentrale Funktionen:
  - `sendMail(options)` – Low-Level Wrapper um `transporter.sendMail`.
  - `sendThankYouMail(params)` – generiert Betreff & Text/HTML für die Besucher-Danke-Mail.
  - `sendLeadNotifyMail(params)` – generiert Betreff & Text/HTML für die Innendienst-Benachrichtigung.
  - `isMailEnabled()` – prüft `MAIL_ENABLED` und steuert, ob Mails überhaupt versucht werden.

- Verhalten:
  - Wenn `MAIL_ENABLED` nicht `"true"` ist, wird kein Mailversuch unternommen.
  - Fehlende oder ungültige SMTP-Konfiguration (Host/Port/User/Pass) werden im Log angemerkt, Mailversand unterbleibt.

---

### 3.3. Endpoint `POST /api/leads`

Der Endpoint existierte bereits und übernimmt:

- Validierung von `formId`, `values` und Pflichtfeldern.
- Anlegen eines `Lead` inkl. `LeadValue`s:
  - `prisma.lead.create({ data: ..., include: { /* optional form/event */ } })`.
  - `values` werden über `lead.values.createMany` als `LeadValue`-Datensätze angelegt.

**NEU in Teilprojekt 4.1:**

- Nach erfolgreichem `create` wird eine Funktion `handleLeadMails({ lead, form, values })` aufgerufen:
  - `lead`: das von Prisma zurückgegebene Lead-Objekt.
  - `form`: das zugehörige Formular inkl. `fields`.
  - `values`: der Request-Body (`values`-Objekt, Keys = `FormField.key`).

- `handleLeadMails`:
  - Prüft via `isMailEnabled()`, ob E-Mail-Versand aktiviert ist.
  - Extrahiert aus `values`:
    - Besucher-E-Mail (Key `"email"`/`"e-mail"`/`"mail"`).
    - Optional Name (Heuristik über Keys wie `name`, `firstname`/`lastname`, `vorname`/`nachname`, `kontaktperson`).
    - Optional Firma (`firma`, `company`, `unternehmen`, …).
    - Alle Feldwerte werden mit Label und Wert zu einer Liste `{ label, value }` aufbereitet.
  - Ruft asynchron auf:
    - `sendThankYouMail(...)`, wenn Besucher-E-Mail gefunden.
    - `sendLeadNotifyMail(...)`, wenn `MAIL_LEADS_NOTIFY` gesetzt.
  - Fehler werden:
    - intern geloggt,
    - in einen `mailStatus` übersetzt.

- Der API-Response:
  - enthält weiterhin `id`, `formId`, `createdAt`,
  - ergänzt um ein Feld `mailStatus`:
    - `{ status: "disabled" }` – Mailversand grundsätzlich deaktiviert oder kein Empfänger.
    - `{ status: "ok" }` – alle geplanten Mails wurden erfolgreich gesendet.
    - `{ status: "partial", error: "partial-failure" }` – mindestens eine Mail fehlgeschlagen.
    - `{ status: "error", error: "..." }` – alle Mails fehlgeschlagen oder unerwarteter Fehler.

---

## 4. Verhalten bei Fehlern

- **Persistenz-Fehler** (z. B. Datenbankprobleme) verhalten sich wie bisher:  
  → Der Request schlägt fehl (`4xx/5xx`), Lead wird nicht gespeichert.

- **Mail-Fehler**:
  - Der Lead ist bereits erfolgreich gespeichert.
  - Es wird **kein** Fehler an den Client geworfen.
  - Stattdessen:
    - Logging auf Server-Seite (`console.error` / `console.warn`).
    - `mailStatus.status` ≠ `"ok"` im Response.

Damit ist sichergestellt:

- Datenintegrität geht vor – der Lead ist nie „weg“, nur weil das SMTP-System Probleme hat.
- Der Client kann bei Bedarf auf `mailStatus` reagieren (z. B. Warnhinweis im Frontend).

---

## 5. Test & Beispiel-Requests

### 5.1. Lokaler Test (Mails deaktiviert)

In `.env`:

```env
MAIL_ENABLED=false
