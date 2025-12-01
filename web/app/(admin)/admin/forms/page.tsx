// web/app/(admin)/admin/forms/page.tsx
import Link from 'next/link';
import { apiGet } from '@/lib/admin-api-client';
import type { FormDto, FormFieldDto } from '@/lib/api-types';

type FormForList = FormDto & {
  fields?: FormFieldDto[];
  createdAt?: string;
};

function formatDate(value?: string) {
  if (!value) return '–';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '–';

  return date.toLocaleDateString('de-CH', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export default async function AdminFormsPage() {
  const { data, error } = await apiGet<FormDto[]>('/api/admin/forms');
  const forms: FormForList[] = Array.isArray(data) ? (data as FormForList[]) : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Formulare</h1>
        <p className="mt-1 text-sm text-slate-600">
          Übersicht aller Formulare, die in der Mobile-App für die Leaderfassung
          verwendet werden.
        </p>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {!error && forms.length === 0 && (
        <div className="rounded-md border border-slate-200 bg-white px-4 py-6 text-sm text-slate-600">
          Noch keine Formulare vorhanden.
        </div>
      )}

      {!error && forms.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Anzahl Felder</th>
                <th className="px-4 py-2">Erstellt am</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {forms.map((form) => {
                const fieldCount = Array.isArray(form.fields)
                  ? form.fields.length
                  : undefined;

                return (
                  <tr key={form.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2 align-top">
                      <Link
                        href={`/admin/forms/${form.id}`}
                        className="font-medium text-slate-900 hover:underline"
                      >
                        {form.name}
                      </Link>
                      {form.description && (
                        <p className="mt-0.5 text-xs text-slate-500 line-clamp-1">
                          {form.description}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-2 align-top text-xs">
                      <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-slate-700">
                        {form.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 align-top text-sm">
                      {typeof fieldCount === 'number' ? fieldCount : '–'}
                    </td>
                    <td className="px-4 py-2 align-top text-sm text-slate-600">
                      {formatDate(form.createdAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
