// web/app/(admin)/admin/forms/page.tsx
import Link from 'next/link';
import { fetchForms } from '@/lib/admin-api-client';
import type { FormDto } from '@/lib/api-types';
import FormCreateButton from './FormCreateButton';
import ArchiveFormButton from './ArchiveFormButton';

export default async function AdminFormsPage() {
  const result = await fetchForms();

  if (!result.ok || !result.data) {
    return (
      <div className="p-6">
        <h1 className="mb-4 text-2xl font-semibold">Formulare</h1>
        <p className="text-sm text-red-600">
          Fehler beim Laden der Formulare: {result.error ?? 'Unbekannter Fehler'}
        </p>
      </div>
    );
  }

  const forms = (result.data.forms ?? []) as FormDto[];

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Formulare</h1>
        <FormCreateButton />
      </div>

      {forms.length === 0 ? (
        <div className="rounded-lg border border-dashed p-6 text-sm text-gray-500">
          Noch keine Formulare vorhanden. Lege das erste Formular über
          &nbsp;
          <span className="font-medium">„Neues Formular“</span> an.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-600">
              <tr>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Felder</th>
                <th className="px-4 py-2">Erstellt</th>
                <th className="px-4 py-2 text-right">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {forms.map((form) => (
                <tr key={form.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 align-top">
                    <Link
                      href={`/admin/forms/${form.id}`}
                      className="text-sm font-medium text-gray-900 hover:underline"
                    >
                      {form.name}
                    </Link>
                    {form.description && (
                      <div className="mt-0.5 text-xs text-gray-500">
                        {form.description}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2 align-top">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        form.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-800'
                          : form.status === 'ARCHIVED'
                          ? 'bg-gray-200 text-gray-700'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {form.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 align-top text-sm text-gray-700">
                    {form.fieldCount}
                  </td>
                  <td className="px-4 py-2 align-top text-xs text-gray-600">
                    {new Date(form.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-2 align-top">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/admin/forms/${form.id}`}
                        className="rounded-md border px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
                      >
                        Bearbeiten
                      </Link>
                      <ArchiveFormButton
                        formId={form.id}
                        disabled={form.status === 'ARCHIVED'}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
