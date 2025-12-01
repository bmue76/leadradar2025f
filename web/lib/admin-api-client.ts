// web/lib/admin-api-client.ts

export type ApiResult<T> = {
  data: T | null;
  error: string | null;
};

const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL && process.env.NEXT_PUBLIC_APP_URL.length > 0
    ? process.env.NEXT_PUBLIC_APP_URL
    : 'http://localhost:3000';

/**
 * Kleiner Wrapper um fetch(), der JSON lädt und eine einheitliche
 * Fehlerdarstellung zurückgibt (ApiResult<T>).
 */
export async function apiGet<T>(
  path: string,
  init?: RequestInit,
): Promise<ApiResult<T>> {
  const url = path.startsWith('http') ? path : `${BASE_URL}${path}`;

  try {
    const res = await fetch(url, {
      ...init,
      cache: 'no-store',
    });

    if (!res.ok) {
      let message = `Request fehlgeschlagen (Status ${res.status})`;

      try {
        // Fehler-Body generisch/paranoid auswerten,
        // ohne einen speziellen Error-Typ zu erzwingen.
        const data = (await res.json()) as unknown;

        if (
          data &&
          typeof data === 'object' &&
          'message' in data &&
          typeof (data as any).message === 'string'
        ) {
          message = (data as any).message;
        } else if (
          data &&
          typeof data === 'object' &&
          'error' in data &&
          typeof (data as any).error === 'string'
        ) {
          message = (data as any).error;
        }
      } catch {
        // JSON-Parse-Fehler ignorieren, generische Message behalten
      }

      return {
        data: null,
        error: message,
      };
    }

    const json = (await res.json()) as T;

    return {
      data: json,
      error: null,
    };
  } catch (err) {
    console.error('apiGet error', err);
    return {
      data: null,
      error: 'Netzwerkfehler – bitte später erneut versuchen.',
    };
  }
}

// Optional: Default-Export, falls mal jemand default import nutzt
const adminApiClient = { apiGet };
export default adminApiClient;
