// web/lib/api-types.ts

/**
 * Gemeinsame API-Typen für LeadRadar
 * (nur zur Dokumentation / Typ-Sicherheit – kein Runtime-Code)
 */

export type FormFieldDto = {
  id: number;
  formId: number;
  key: string;
  label: string;
  type: string;
  required: boolean;
  position: number;
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
  // kein fieldKey in der DB – kann man später über Join zu FormField holen
  value: string;
};

export type LeadDto = {
  id: number;
  formId: number;
  eventId?: number | null;
  capturedByUserId?: number | null;
  createdAt: string;
  updatedAt: string;
  form?: {
    id: number;
    name: string;
  } | null;
  event?: {
    id: number;
    name: string;
  } | null;
  values?: LeadValueDto[];
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
