// web/app/(admin)/admin/leads/page.tsx
import Link from 'next/link';
import { fetchLeads, fetchForms } from '@/lib/admin-api-client';
import type { LeadSummaryDto, FormDto } from '@/lib/api-types';

type LeadsSearchParams = Promise<{
  formId?: string;
}>;

interface LeadsPageProps {
  searchParams: LeadsSearchParams;
}

export default async function LeadsPage({ searchParams }: LeadsPageProps) {
  const resolved = await searchParams;
  const formIdParam = resolved?.formId;
  const formId = formIdParam ? Number(formIdParam) : undefined;

  const [leadsResult, formsResult] = await Promise.all([
    fetchLeads(formId ? { formId } : undefined),
    fetchForms(),
  ]);

  if (
    !leadsResult.ok ||
    !formsResult.ok ||
    !leadsResult.data ||
    !formsResult.data
  ) {
    const errorMessage =
      leadsResult.error ||
      formsResult.error ||
      'Fehler beim Laden der Leads oder Formulare';

    return (
      <div className="p-6">
        <h1 className="mb-4 text-2xl font-semibold">Leads</h1>
        <p className="text-sm text-red-600">{errorMessage}</p>
      </div>
    );
  }

  const leads = (leadsResult.data.leads ?? []) as LeadSummaryDto[];
  const forms = (formsResult.data.forms || []) as FormDto[];

  const activeForm = formId
    ? forms.find((form) => form.id === formId)
    : undefined;

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Leads</h1>
      </div>

      {/* Filter nach Formular */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-gray-600">Filtern nach Formular:</span>
        <Link
          href="/admin/leads"
          className={`rounded-full border px-3 py-1 text-sm ${
            !activeForm ? 'bg-gray-900 text-white' : 'bg-white'
          }`}
        >
          Alle
        </Link>
        {forms.map((form) => (
          <Link
            key={form.id}
            href={`/admin/leads?formId=${form.id}`}
            className={`rounded-full border px-3 py-1 text-sm ${
              activeForm?.id === form.id ? 'bg-gray-900 text-white' : 'bg-white'
            }`}
          >
            {form.name}
          </Link>
        ))}
      </div>

      {/* Liste der Leads */}
      {leads.length === 0 ? (
        <div className="rounded-lg border border-dashed p-6 text-sm text-gray-500">
          Keine Leads gefunden
          {activeForm ? ` für Formular „${activeForm.name}“` : ''}.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-600">
              <tr>
                <th className="px-4 py-2">Datum</th>
                <th className="px-4 py-2">Formular</th>
                <th className="px-4 py-2">Werte (Auszug)</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 align-top text-xs text-gray-600">
                    {new Date(lead.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-2 align-top text-sm">
                    {lead.formName}
                  </td>
                  <td className="px-4 py-2 align-top text-xs text-gray-700">
                    {lead.values.length === 0 ? (
                      <span className="text-gray-400">Keine Werte</span>
                    ) : (
                      <ul className="space-y-1">
                        {lead.values.slice(0, 3).map((v) => (
                          <li key={v.fieldId}>
                            <span className="font-medium">{v.label}: </span>
                            <span>{v.value ?? '—'}</span>
                          </li>
                        ))}
                        {lead.values.length > 3 && (
                          <li className="text-gray-400">… weitere Felder</li>
                        )}
                      </ul>
                    )}
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
