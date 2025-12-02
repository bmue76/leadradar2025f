export interface FormFieldDto {
  id: number;
  key: string;
  label: string;
  type: string;
  required: boolean;
  options?: string[];
  order: number;
}

export interface FormDto {
  id: number;
  name: string;
  description?: string | null;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  fields: FormFieldDto[];
}

export interface CreateLeadRequest {
  formId: number;
  values: Record<string, string | null>;
  meta?: Record<string, unknown>;
}
