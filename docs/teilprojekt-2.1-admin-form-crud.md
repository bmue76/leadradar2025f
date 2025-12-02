# LeadRadar2025f – Teilprojekt 2.1  
## Admin-UI & API: Form-CRUD (Create/Edit/Delete & Status)

Zeitraum: 2025-12  
Status: **abgeschlossen**

---

## 1. Ziel aus Business-Sicht

Das Ziel von Teilprojekt 2.1 war es, die Formularverwaltung im Admin von einer reinen Read-Only-Ansicht zu einem **voll funktionsfähigen CRUD-Modul** auszubauen:

- **Neue Formulare** können direkt im Admin angelegt werden.
- **Formular-Metadaten** können bearbeitet werden:
  - Name
  - Beschreibung
  - Status (`DRAFT`, `ACTIVE`, `ARCHIVED`)
- Formulare können **archiviert** werden (Soft-Delete), sodass sie im operativen Betrieb nicht mehr für neue Leads zur Verfügung stehen.

Die Verwaltung der eigentlichen Formfelder (Feld hinzufügen/bearbeiten/sortieren) ist bewusst **ausgeklammert** und wird in einem weiteren Teilprojekt umgesetzt.

---

## 2. Neue API-Endpunkte & JSON-Formate

### 2.1 `POST /api/admin/forms` – Neues Formular anlegen

**Beschreibung:**

- Legt ein neues Formular an.
- Default-Status ist `DRAFT`, falls kein Status übergeben wird.

**Request-Body (JSON):**

```json
{
  "name": "Messe Basel 2025 – Standard-Leadformular",
  "description": "Leadformular für Messe Basel 2025",
  "status": "DRAFT"
}
