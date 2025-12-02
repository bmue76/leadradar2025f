// web/lib/api-types.ts

// Status eines Formulars im Admin
export type FormStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';

// Einzelnes Feld eines Formulars
export interface FormFieldDto {
  id: number;
  formId: number;
  key: string;
  label: string;
  type: string;
  required: boolean;
  order: number;
}

// Formular inklusive Felder
export interface FormDto {
  id: number;
  name: string;
  description: string | null;
  status: FormStatus;
  fieldCount: number;
  fields: FormFieldDto[];
  createdAt: string;
  updatedAt: string;
}

// Einzelner Lead-Wert in der Admin-Ansicht
export interface LeadValueDto {
  fieldId: number;
  fieldKey: string;
  label: string;
  value: string | null;
}

// Zusammenfassung eines Leads für die Admin-Lead-Liste
export interface LeadSummaryDto {
  id: number;
  formId: number;
  formName: string;
  createdAt: string;
  values: LeadValueDto[];
}

// Request-Body für POST /api/leads
// values: key = FormField.key
export interface CreateLeadRequest {
  formId: number;
  values: Record<string, string | null>;
}

// Healthcheck-Response für GET /api/health
export interface HealthStatusDto {
  ok: boolean;
  timestamp: string;
  environment?: string;
}

// (Optional) Event-DTO – falls du Events schon nutzt oder später brauchst
export interface EventDto {
  id: number;
  name: string;
  description: string | null;
  startDate: string;
  endDate: string;
}
