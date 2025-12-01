// web/app/(admin)/admin/leads/page.tsx
import { apiGet } from '@/lib/admin-api-client';
import type { LeadSummaryDto, FormDto } from '@/lib/api-types';
import { LeadFormFilter } from './LeadFormFilter';

type LeadsPageProps = {
  searchParams?: {
    formId?: string;
  };
};

type LeadForList = LeadSummaryDto & {
  formName?: string;
  eventName?: string | null;
  createdAt?: string;
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

export default async function LeadsPage({ searchParams }: LeadsPageProps) {
  const formIdParam = searchParams?.formId;
  const formId = formIdParam ? Number(formIdParam) : undefined;

  const leadsPath = formId
    ? `/api/admin/leads?formId=${formId}`
    : '/api/admin/leads';

  const { data: leadsData, error } = await apiGet<LeadSummaryDto[]>(leadsPath);
  const leads: LeadForList[] = Array.isArray(leadsData)
    ? (leadsData as LeadForList[])
    : [];

  // Forms für Dropdown (Fehler hier ist nicht kritisch – dann ist der Filter einfach leer/disabled)
  const { data: formsData } = await apiGet<FormDto[]>('/api/admin/forms');
  const forms: FormDto[] = Array.isArray(formsData)
    ? (formsData as FormDto[])
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Leads</h1>
          <p className="mt-1 text-sm text-slate-600">
            Übersicht der erfassten Leads. Optional gefiltert nach Formular.
          </p>
        </div>

        <LeadFormFilter forms={forms} currentFormId={formId} />
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {!error && leads.length === 0 && (
        <div className="rounded-md border border-slate-200 bg-white px-4 py-6 text-sm text-slate-600">
          Noch keine Leads vorhanden.
        </div>
      )}

      {!error && leads.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2">Lead-ID</th>
                <th className="px-4 py-2">Formular</th>
                <th className="px-4 py-2">Event</th>
                <th className="px-4 py-2">Erfasst am</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2 text-xs font-mono text-slate-800">
                    #{lead.id}
                  </td>
                  <td className="px-4 py-2 text-sm text-slate-900">
                    {lead.formName ?? '–'}
                  </td>
                  <td className="px-4 py-2 text-sm text-slate-700">
                    {lead.eventName ?? '–'}
                  </td>
                  <td className="px-4 py-2 text-sm text-slate-600">
                    {formatDateTime(lead.createdAt)}
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
