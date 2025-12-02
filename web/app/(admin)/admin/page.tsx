import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type TopForm = {
  formId: number;
  name: string;
  leadCount: number;
};

async function getDashboardData() {
  const now = new Date();
  const sevenDaysAgo = new Date(
    now.getTime() - 7 * 24 * 60 * 60 * 1000
  );
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [totalLeads, leadsLast7Days, leadsToday, groupedByForm] =
    await Promise.all([
      prisma.lead.count(),
      prisma.lead.count({
        where: {
          createdAt: {
            gte: sevenDaysAgo,
          },
        },
      }),
      prisma.lead.count({
        where: {
          createdAt: {
            gte: startOfToday,
          },
        },
      }),
      prisma.lead.groupBy({
        by: ["formId"],
        _count: {
          _all: true,
        },
      }),
    ]);

  const formIds = groupedByForm
    .map((g) => g.formId)
    .filter((id): id is number => id !== null);

  const forms = formIds.length
    ? await prisma.form.findMany({
        where: {
          id: {
            in: formIds,
          },
        },
      })
    : [];

  const formsById = new Map<number, (typeof forms)[number]>();
  forms.forEach((form) => {
    formsById.set(form.id, form);
  });

  const topForms: TopForm[] = groupedByForm
    .filter((g) => g.formId !== null)
    .map((g) => {
      const form = formsById.get(g.formId as number);
      return {
        formId: g.formId as number,
        name: form?.name ?? `Formular #${g.formId}`,
        leadCount: g._count._all,
      };
    })
    .sort((a, b) => b.leadCount - a.leadCount)
    .slice(0, 3);

  return {
    totalLeads,
    leadsLast7Days,
    leadsToday,
    topForms,
  };
}

type MetricCardProps = {
  label: string;
  value: number;
};

function MetricCard({ label, value }: MetricCardProps) {
  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
    </div>
  );
}

export default async function AdminDashboardPage() {
  const { totalLeads, leadsLast7Days, leadsToday, topForms } =
    await getDashboardData();

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Admin-Dashboard
          </h1>
          <p className="text-sm text-gray-500">
            Überblick über die wichtigsten Kennzahlen zu deinen Messe-Leads.
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            href="/admin/forms"
            className="inline-flex h-9 items-center rounded-md border border-gray-300 bg-white px-3 text-sm font-medium shadow-sm hover:bg-gray-50"
          >
            Formulare
          </Link>
          <Link
            href="/admin/leads"
            className="inline-flex h-9 items-center rounded-md border border-gray-300 bg-white px-3 text-sm font-medium shadow-sm hover:bg-gray-50"
          >
            Leads
          </Link>
        </div>
      </div>

      <section>
        <div className="grid gap-4 sm:grid-cols-3">
          <MetricCard label="Gesamt-Leads" value={totalLeads} />
          <MetricCard
            label="Leads letzte 7 Tage"
            value={leadsLast7Days}
          />
          <MetricCard label="Leads heute" value={leadsToday} />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">
          Top-Formulare
        </h2>
        {topForms.length === 0 ? (
          <p className="text-sm text-gray-500">
            Noch keine Leads erfasst. Sobald Leads erfasst werden,
            erscheinen hier die aktivsten Formulare.
          </p>
        ) : (
          <div className="overflow-hidden rounded-md border bg-white">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">
                    Formular
                  </th>
                  <th className="px-3 py-2 text-right font-medium text-gray-700">
                    Anzahl Leads
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {topForms.map((form) => (
                  <tr key={form.formId} className="bg-white">
                    <td className="px-3 py-2 align-top">
                      <Link
                        href={`/admin/leads?formId=${form.formId}`}
                        className="text-sm font-medium text-blue-600 hover:underline"
                      >
                        {form.name}
                      </Link>
                    </td>
                    <td className="px-3 py-2 align-top text-right">
                      {form.leadCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
