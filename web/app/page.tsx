// app/page.tsx
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
      <div className="max-w-xl rounded-xl bg-white/80 p-8 shadow-sm">
        <h1 className="mb-2 text-2xl font-semibold tracking-tight">
          LeadRadar Admin – Prototyp
        </h1>
        <p className="mb-4 text-sm text-slate-600">
          Dies ist die Web-Admin-Basis für LeadRadar. In den nächsten
          Teilprojekten kommen Formbuilder, Events, Leads und Auswertungen dazu.
        </p>
        <div className="flex items-center justify-between">
          <Link
            href="/admin"
            className="inline-flex items-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Zum Admin-Dashboard
          </Link>
          <span className="text-xs text-slate-400">
            Version 0.1 – Setup & Web-Basis
          </span>
        </div>
      </div>
    </main>
  );
}
