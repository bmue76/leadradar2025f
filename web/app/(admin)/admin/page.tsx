// app/(admin)/admin/page.tsx
export default function AdminDashboardPage() {
  return (
    <section className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          Admin Dashboard
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Noch leer – in den nächsten Teilprojekten kommen hier Formbuilder,
          Events, Leads und Auswertungen hin.
        </p>
      </header>

      <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">
        <p>
          <span className="font-medium">Status:</span> Grundgerüst steht. Next
          App Router, Tailwind-Basis und Admin-Shell sind eingerichtet.
        </p>
        <p className="mt-2">
          Nächste Schritte in diesem Teilprojekt: Prisma + SQLite vorbereiten
          sowie die Doku anlegen.
        </p>
      </div>
    </section>
  );
}
