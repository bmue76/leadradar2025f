// web/app/(admin)/admin/forms/[id]/page.tsx
import Link from 'next/link';
import { apiGet } from '@/lib/admin-api-client';
import type { FormDto, FormFieldDto } from '@/lib/api-types';

type FormForDetail = FormDto & {
  fields?: FormFieldDto[];
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

type FormDetailPageProps = {
  params: {
    id: string;
  };
};

function formatDateTime(value?: string) {
  if (!value) return '–';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '–';

  return date.toLocaleString('de-CH', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default async function FormDetailPage({ params }: FormDetailPageProps) {
  const id = Number(params.id);

  if (Number.isNaN(id)) {
    return (
      <div className="space-y-4">
        <Link
          href="/admin/forms"
          className="text-sm text-slate-600 hover:text-slate-900 hover:underline"
        >
          ← Zurück zur Formularübersicht
        </Link>
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          Ungültige Formular-ID.
        </div>
      </div>
    );
  }

  const { data, error } = await apiGet<FormDto>(`/api/admin/forms/${id}`);
  const form = (data as FormForDetail | null) ?? null;

  if (error) {
    return (
      <div className="space-y-4">
        <Link
          href="/admin/forms"
          className="text-sm text-slate-600 hover:text-slate-900 hover:underline"
        >
          ← Zurück zur Formularübersicht
        </Link>
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="space-y-4">
        <Link
          href="/admin/forms"
          className="text-sm text-slate-600 hover:text-slate-900 hover:underline"
        >
          ← Zurück zur Formularübersicht
        </Link>
        <div className="rounded-md border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
          Formular nicht gefunden.
        </div>
      </div>
    );
  }

  const fields = (form.fields ?? []) as FormFieldDto[];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <Link
            href="/admin/forms"
            className="text-sm text-slate-600 hover:text-slate-900 hover:underline"
          >
            ← Zurück zur Formularübersicht
          </Link>

          <div>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">
              {form.name}
            </h1>
            {form.description && (
              <p className="mt-1 text-sm text-slate-600">{form.description}</p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-slate-700">
              Status: {form.status}
            </span>
            <span>Erstellt: {formatDateTime(form.createdAt)}</span>
            <span>Zuletzt geändert: {formatDateTime(form.updatedAt)}</span>
            <span>Felder: {Array.isArray(form.fields) ? form.fields.length : '–'}</span>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Felder
        </div>

        {fields.length === 0 ? (
          <div className="px-4 py-4 text-sm text-slate-600">
            Dieses Formular hat noch keine Felder.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2">Reihenfolge</th>
                  <th className="px-4 py-2">Label</th>
                  <th className="px-4 py-2">Key</th>
                  <th className="px-4 py-2">Typ</th>
                  <th className="px-4 py-2">Pflichtfeld</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {fields.map((field, index) => (
                  <tr key={field.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2 text-sm text-slate-600">
                      {index + 1}
                    </td>
                    <td className="px-4 py-2 text-sm text-slate-900">
                      {field.label}
                    </td>
                    <td className="px-4 py-2 text-xs font-mono text-slate-700">
                      {field.key}
                    </td>
                    <td className="px-4 py-2 text-xs">
                      <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-slate-700">
                        {field.type}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-sm">
                      {field.required ? 'Ja' : 'Nein'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
