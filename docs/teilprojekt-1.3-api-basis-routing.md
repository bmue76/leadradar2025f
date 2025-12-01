# LeadRadar2025f – Teilprojekt 1.3: API-Basis & Routing (Forms & Leads)

**Abschlussbericht, 01.12.2025**

---

## 1. Ziel des Teilprojekts

- Aufbau einer ersten stabilen **HTTP-API-Schicht** auf Basis der Next.js Route Handler (App Router).
- Bereitstellung von Endpoints für:
  - **Admin-Frontend**:
    - Formulare lesen (Liste & Detail)
    - Leads lesen (Liste)
  - **Mobile-App**:
    - Formulare lesen (über die Admin-Endpoints)
    - Leads erfassen (Public-Endpoint)
- Implementierung eines Healthchecks für App & Datenbank.
- Authentifizierung/Autorisierung wird in späteren Teilprojekten ergänzt.

---

## 2. API-Struktur (Überblick)

| Pfad                             | Methode | Zweck                                    |
| -------------------------------- | ------- | ---------------------------------------- |
| `/api/health`                    | GET     | Healthcheck App + DB                     |
| `/api/admin/forms`              | GET     | Liste aller Formulare inkl. Felder       |
| `/api/admin/forms/:id`          | GET     | Einzelnes Formular inkl. Felder          |
| `/api/admin/leads`              | GET     | Liste der Leads (Lead-Summaries)         |
| `/api/leads`                    | POST    | Neuen Lead inkl. LeadValues erfassen     |

---

## 3. Gemeinsame Typen (Konzept)

Zur Dokumentation liegen in `web/lib/api-types.ts` folgende Typen:

```ts
export type FormFieldDto = {
  id: number;
  formId: number;
  key: string;
  label: string;
  type: string;
  required: boolean;
  placeholder?: string | null;
  options?: string[] | null;
};

export type FormDto = {
  id: number;
  name: string;
  description?: string | null;
  status: string;
  eventId?: number | null;
  createdAt: string;
  updatedAt: string;
  fields: FormFieldDto[];
};

export type LeadValueDto = {
  id: number;
  leadId: number;
  fieldId: number;
  value: string;
};

export type LeadSummaryDto = {
  id: number;
  formId: number;
  eventId?: number | null;
  capturedByUserId?: number | null;
  createdAt: string;
  formName?: string | null;
  eventName?: string | null;
};

export type LeadCreateValueInput = {
  fieldKey: string;
  value: string;
};

export type LeadCreatePayload = {
  formId: number;
  eventId?: number;
  capturedByUserId?: number;
  values: LeadCreateValueInput[];
};

export type ErrorResponse = {
  error: {
    code: string;
    message: string;
    details?: any;
  };
};
