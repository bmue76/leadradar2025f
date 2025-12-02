// web/app/(admin)/admin/forms/[id]/page.tsx
import Link from 'next/link';
import { fetchFormById } from '@/lib/admin-api-client';
import type { FormDto } from '@/lib/api-types';
import FormMetaEditor from './FormMetaEditor';

interface FormDetailPageProps {
  params: {
    id: string;
  };
}

export default async function FormDetailPage({
  params,
}: FormDetailPageProps) {
  const id = Number(params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return (
      <div className="p-6">
        <h1 className="mb-4 text-2xl font-semibold">Formular</h1>
        <p className="text-sm text-red-600">Ungültige Formular-ID.</p>
      </div>
    );
  }

  const result = await fetchFormById(id);

  if (!result.ok || !result.data) {
    return (
      <div className="p-6">
        <h1 className="mb-4 text-2xl font-semibold">Formular</h1>
        <p className="text-sm text-red-600">
          Fehler beim Laden des Formulars: {result.error ?? 'Unbekannter Fehler'}
        </p>
        <p className="mt-4 text-sm">
          <Link href="/admin/forms" className="text-gray-900 underline">
            Zur Formularübersicht
          </Link>
        </p>
      </div>
    );
  }

  const form = result.data as FormDto;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{form.name}</h1>
          {form.description && (
            <p className="mt-1 text-sm text-gray-600">
              {form.description}
            </p>
          )}
        </div>
        <span
          className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
            form.status === 'ACTIVE'
              ? 'bg-green-100 text-green-800'
              : form.status === 'ARCHIVED'
              ? 'bg-gray-200 text-gray-700'
              : 'bg-yellow-100 text-yellow-800'
          }`}
        >
          {form.status}
        </span>
      </div>

      <FormMetaEditor form={form} />

      <div className="space-y-2">
        <h2 className="text-sm font-semibold">Formfelder</h2>
        {form.fields.length === 0 ? (
          <div className="rounded-lg border border-dashed p-4 text-xs text-gray-500">
            Noch keine Felder definiert.  
            Die Feldverwaltung folgt in einem separaten Teilprojekt.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border bg-white">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-600">
                <tr>
                  <th className="px-4 py-2">Label</th>
                  <th className="px-4 py-2">Key</th>
                  <th className="px-4 py-2">Typ</th>
                  <th className="px-4 py-2">Pflicht</th>
                  <th className="px-4 py-2">Reihenfolge</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {form.fields.map((field) => (
                  <tr key={field.id}>
                    <td className="px-4 py-2 text-sm">{field.label}</td>
                    <td className="px-4 py-2 text-xs text-gray-600">
                      {field.key}
                    </td>
                    <td className="px-4 py-2 text-xs text-gray-700">
                      {field.type}
                    </td>
                    <td className="px-4 py-2 text-xs">
                      {field.required ? 'Ja' : 'Nein'}
                    </td>
                    <td className="px-4 py-2 text-xs">{field.order}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-sm">
        <Link href="/admin/forms" className="text-gray-900 underline">
          Zur Formularübersicht
        </Link>
      </p>
    </div>
  );
}
