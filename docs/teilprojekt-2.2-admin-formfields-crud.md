# LeadRadar2025f – Teilprojekt 2.2  
**Admin-UI & API: FormFields-CRUD & Reihenfolge**

## 1. Kontext & Zielsetzung

Ausgangspunkt:

- Die Formular-Detailseite `/admin/forms/[id]` zeigte bisher nur eine **read-only** Feldliste (`FormField`).
- Admins konnten:
  - Formulare anlegen & bearbeiten (Teilprojekt 2.1),
  - aber **FormFields** nicht verwalten.

Ziel dieses Teilprojekts:

- Aus der read-only Feldliste eine vollwertige Feldverwaltung machen:
  - Felder **anlegen**.
  - Felder **bearbeiten**.
  - Felder **löschen** (mit Hinweis auf mögliche Inkonsistenzen bei bestehenden Leads).
  - Reihenfolge der Felder (**order**) steuerbar machen (Up/Down-Buttons, keine Drag-&-Drop-Pflicht).

---

## 2. Fachliche Anforderungen (Business-Sicht)

Aus Admin-Sicht:

- Pro Formular sollen beliebige Felder definiert werden können:
  - Label (z. B. „Firma“).
  - Technischer Key (z. B. `company` – später wichtig für API/App/Export).
  - Feldtyp (Text, Select, Zahl, Datum, etc.).
  - Pflichtfeld ja/nein.
  - (Optional) Auswahl-Optionen für Select-Felder.
- Die **Reihenfolge** der Felder bestimmt die Darstellung in der späteren App.
- Felder dürfen gelöscht werden, auch wenn bereits Leads erfasst wurden.
  - Konsequenz: bestehende Datensätze können verwaiste Werte enthalten.
  - Für den Prototyp ist diese „harte“ Löschung akzeptiert.
- Fehler (z. B. doppelter Key) sollen im UI als **verständlich** angezeigt werden.

---

## 3. Technische Umsetzung – Backend / API

### 3.1 Datenmodell-Erinnerung

`FormField` (Prisma-Modell, relevante Felder):

- `id` (int, PK)
- `formId` (int, FK → Form)
- `label` (string)
- `key` (string, unique pro Formular: `@@unique([formId, key])`)
- `type` (`FieldType`-Enum)
- `required` (boolean)
- `options` (`string | null`) – JSON-String mit `string[]` für Select-Optionen
- `order` (int) – Reihenfolge innerhalb eines Formulars

`FieldType`-Enum:

- `TEXT`, `TEXTAREA`, `SINGLE_SELECT`, `MULTI_SELECT`,
  `NUMBER`, `EMAIL`, `PHONE`, `DATE`, `DATETIME`, `BOOLEAN`.

---

### 3.2 API-Endpoints für FormFields

#### 3.2.1 `POST /api/admin/forms/:id/fields`

**Zweck:** Neues Feld zu einem Formular anlegen.

**Handler:**  
`web/app/api/admin/forms/[id]/fields/route.ts` (POST)

**Request-Body (JSON):**

```json
{
  "label": "Firma",
  "key": "company",
  "type": "TEXT",
  "required": true,
  "options": ["Option A", "Option B"],
  "order": 3
}
