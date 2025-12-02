// web/lib/admin-api-client.ts

import type {
  FormDto,
  LeadSummaryDto,
  FormStatus as FormStatusBase,
} from './api-types';

// Generischer API-Result-Typ, kompatibel mit bestehendem Code:
// - ok: true/false
// - data?: T
// - error?: string
// - status?: number (HTTP-Status)
export type ApiResult<T> = {
  ok: boolean;
  data?: T;
  error?: string;
  status?: number;
};

// FormStatus aus api-types "re-exporten"
export type FormStatus = FormStatusBase;

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

function resolveApiUrl(url: string): string {
  // Im Browser: relative URLs ganz normal verwenden
  if (typeof window !== 'undefined') {
    return url;
  }

  // Auf dem Server: relative URL auf eine Basis-URL auflösen
  try {
    const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
    return new URL(url, base).toString();
  } catch {
    // Im schlimmsten Fall das Original zurückgeben
    return url;
  }
}

async function request<T>(
  method: HttpMethod,
  url: string,
  body?: unknown,
): Promise<ApiResult<T>> {
  try {
    const init: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    };

    if (method !== 'GET' && typeof body !== 'undefined') {
      init.body = JSON.stringify(body);
    }

    const finalUrl = resolveApiUrl(url);
    const res = await fetch(finalUrl, init);

    const contentType = res.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');

    const data = isJson ? await res.json() : undefined;

    if (!res.ok) {
      const dataRecord = (data ?? {}) as Record<string, unknown>;
      const errorMessage =
        (typeof dataRecord.error === 'string' && dataRecord.error) ||
        (typeof dataRecord.message === 'string' && dataRecord.message) ||
        `Request failed with status ${res.status}`;

      return {
        ok: false,
        error: errorMessage,
        status: res.status,
      };
    }

    return {
      ok: true,
      data: data as T,
      status: res.status,
    };
  } catch (error) {
    if (
      process.env.NODE_ENV === 'development' &&
      error instanceof Error &&
      error.message.includes('Invalid source map')
    ) {
      // bekannten „Invalid source map“-Lärm unterdrücken
    } else {
      console.error('API request failed', error);
    }

    return {
      ok: false,
      error: 'Network or client error while calling API',
    };
  }
}

// --- Generische Helfer ---

export function apiGet<T>(url: string): Promise<ApiResult<T>> {
  return request<T>('GET', url);
}

export function apiPost<T, B = unknown>(
  url: string,
  body: B,
): Promise<ApiResult<T>> {
  return request<T>('POST', url, body);
}

export function apiPut<T, B = unknown>(
  url: string,
  body: B,
): Promise<ApiResult<T>> {
  return request<T>('PUT', url, body);
}

export function apiDelete<T = null>(url: string): Promise<ApiResult<T>> {
  return request<T>('DELETE', url);
}

// --- Forms-spezifische Typen & Helfer ---

export interface FormCreateInput {
  name: string;
  description?: string;
  status?: FormStatus;
}

export interface FormUpdateInput {
  name?: string;
  description?: string | null;
  status?: FormStatus;
}

export interface FormsListResponse {
  forms: FormDto[];
}

/**
 * Forms-Liste für Admin (/api/admin/forms)
 */
export function fetchForms() {
  return apiGet<FormsListResponse>('/api/admin/forms');
}

/**
 * Einzelnes Formular für Admin (/api/admin/forms/:id)
 */
export function fetchFormById(id: number | string) {
  return apiGet<FormDto>(`/api/admin/forms/${id}`);
}

/**
 * Neues Formular anlegen (POST /api/admin/forms)
 */
export function createForm(input: FormCreateInput) {
  return apiPost<FormDto, FormCreateInput>('/api/admin/forms', input);
}

/**
 * Formular-Metadaten aktualisieren (PUT /api/admin/forms/:id)
 */
export function updateForm(id: number | string, input: FormUpdateInput) {
  return apiPut<FormDto, FormUpdateInput>(
    `/api/admin/forms/${id}`,
    input,
  );
}

/**
 * Formular archivieren (Soft-Delete via DELETE /api/admin/forms/:id)
 */
export function archiveForm(id: number | string) {
  // Für DELETE erwarten wir keinen Body zurück, daher T = null
  return apiDelete<null>(`/api/admin/forms/${id}`);
}

// --- Leads-spezifische Typen & Helper ---

export interface LeadsListResponse {
  leads: LeadSummaryDto[];
}

/**
 * Leads-Liste für Admin (/api/admin/leads)
 */
export function fetchLeads(params?: { formId?: number | string }) {
  const searchParams = new URLSearchParams();
  if (params?.formId) {
    searchParams.set('formId', String(params.formId));
  }
  const qs = searchParams.toString();
  const url = qs ? `/api/admin/leads?${qs}` : '/api/admin/leads';
  return apiGet<LeadsListResponse>(url);
}
