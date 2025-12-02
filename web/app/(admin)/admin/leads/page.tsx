import { prisma } from "@/lib/prisma";

type LeadsPageProps = {
  searchParams?: {
    formId?: string;
  };
};

export const dynamic = "force-dynamic";

export default async function LeadsPage({ searchParams }: LeadsPageProps) {
  const rawFormId = searchParams?.formId;
  const parsedFormId = rawFormId ? Number(rawFormId) : undefined;
  const formId =
    parsedFormId && Number.isInteger(parsedFormId) && parsedFormId > 0
      ? parsedFormId
      : undefined;

  const [forms, leads] = await Promise.all([
    prisma.form.findMany({
      where: {
        // ARCHIVED-Formulare im Filter ausblenden
        status: {
          not: "ARCHIVED",
        },
      },
      orderBy: {
        name: "asc",
      },
    }),
    prisma.lead.findMany({
      where: formId ? { formId } : {},
      include: {
        form: true,
        event: true,
        capturedBy: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
  ]);

  const exportUrl = formId
    ? `/api/admin/leads/export?formId=${encodeURIComponent(String(formId))}`
    : "/api/admin/leads/export";

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Leads</h1>
          <p className="text-sm text-gray-500">
            Übersicht aller erfassten Leads. Über den Filter kannst du nach
            Formular einschränken.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <form
            className="flex items-center gap-2"
            action="/admin/leads"
            method="get"
          >
            <label className="text-sm text-gray-700" htmlFor="formId">
              Formular:
            </label>
            <select
              id="formId"
              name="formId"
              defaultValue={rawFormId ?? ""}
              className="h-9 rounded-md border border-gray-300 bg-white px-2 text-sm"
            >
              <option value="">Alle Formulare</option>
              {forms.map((form) => (
                <option key={form.id} value={form.id}>
                  {form.name}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="inline-flex h-9 items-center rounded-md border border-gray-300 bg-gray-50 px-3 text-sm font-medium hover:bg-gray-100"
            >
              Filtern
            </button>
          </form>

          <a
            href={exportUrl}
            className="inline-flex h-9 items-center justify-center rounded-md border border-gray-300 bg-white px-3 text-sm font-medium shadow-sm hover:bg-gray-50"
          >
            Leads als CSV exportieren
          </a>
        </div>
      </div>

      {leads.length === 0 ? (
        <div className="rounded-md border border-dashed border-gray-200 bg-gray-50 p-6 text-sm text-gray-500">
          Noch keine Leads erfasst.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-gray-700">
                  Erfasst am
                </th>
                <th className="px-3 py-2 text-left font-medium text-gray-700">
                  Formular
                </th>
                <th className="px-3 py-2 text-left font-medium text-gray-700">
                  Event
                </th>
                <th className="px-3 py-2 text-left font-medium text-gray-700">
                  Erfasst von
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {leads.map((lead) => (
                <tr key={lead.id}>
                  <td className="whitespace-nowrap px-3 py-2 align-top">
                    {lead.createdAt.toLocaleString("de-CH")}
                  </td>
                  <td className="px-3 py-2 align-top">
                    {lead.form?.name ?? `Formular #${lead.formId}`}
                  </td>
                  <td className="px-3 py-2 align-top">
                    {lead.event?.name ?? "–"}
                  </td>
                  <td className="px-3 py-2 align-top">
                    {lead.capturedBy
                      ? `${lead.capturedBy.name ?? "Unbekannt"}${
                          lead.capturedBy.email
                            ? ` (${lead.capturedBy.email})`
                            : ""
                        }`
                      : "–"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="text-xs text-gray-400">
        Hinweis: Der CSV-Export verwendet die gleichen Filter (Formular), die du
        hier setzt.
      </div>
    </div>
  );
}
