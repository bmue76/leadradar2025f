// web/app/(admin)/admin/layout.tsx
import Link from 'next/link';
import type { ReactNode } from 'react';

type AdminLayoutProps = {
  children: ReactNode;
};

const navItems = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/forms', label: 'Formulare' },
  { href: '/admin/leads', label: 'Leads' },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex md:flex-col w-64 border-r border-slate-200 bg-white">
        <div className="h-14 flex items-center px-4 border-b border-slate-200">
          <span className="font-semibold tracking-tight">LeadRadar Admin</span>
        </div>

        <nav className="flex-1 p-3 space-y-1 text-sm">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-md px-3 py-2 hover:bg-slate-100 transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main-Bereich */}
      <div className="flex-1 flex flex-col">
        {/* Header (Mobile) */}
        <header className="md:hidden h-14 flex items-center justify-between px-4 border-b border-slate-200 bg-white">
          <span className="font-semibold">LeadRadar Admin</span>
          {/* Optional: später Burger-Menu */}
        </header>

        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
