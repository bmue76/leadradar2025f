// app/(admin)/admin/layout.tsx
import type { ReactNode } from "react";
import Link from "next/link";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mt-2 flex gap-6">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 rounded-lg border border-slate-200 bg-white p-4 text-sm">
        <div className="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Admin-Navigation
        </div>
        <nav className="space-y-2">
          <Link
            href="/admin"
            className="flex items-center justify-between rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            <span>Dashboard</span>
            <span className="text-[10px] uppercase tracking-wide text-emerald-300">
              leer
            </span>
          </Link>

          {/* Platzhalter für zukünftige Menüpunkte */}
          <div className="rounded-md px-3 py-2 text-slate-400">
            Formbuilder
            <span className="ml-1 text-[10px] uppercase tracking-wide">
              coming soon
            </span>
          </div>
          <div className="rounded-md px-3 py-2 text-slate-400">
            Events &amp; Leads
          </div>
        </nav>
      </aside>

      {/* Hauptbereich */}
      <main className="flex-1 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6">
        {children}
      </main>
    </div>
  );
}
