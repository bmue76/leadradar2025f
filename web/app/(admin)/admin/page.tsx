// web/app/(admin)/admin/page.tsx
import Link from 'next/link';

const tiles = [
  {
    href: '/admin/forms',
    title: 'Formulare',
    description: 'Formulare einsehen und die Feldstruktur prüfen.',
  },
  {
    href: '/admin/leads',
    title: 'Leads',
    description: 'Erfasste Leads je Formular / Event anzeigen.',
  },
];

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Admin-Dashboard</h1>
        <p className="mt-1 text-sm text-slate-600">
          Einstieg in die wichtigsten Bereiche der LeadRadar-Adminoberfläche.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map((tile) => (
          <Link
            key={tile.href}
            href={tile.href}
            className="group rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md hover:border-slate-300 transition"
          >
            <h2 className="text-base font-medium group-hover:text-slate-900">
              {tile.title}
            </h2>
            <p className="mt-1 text-sm text-slate-600">{tile.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
