'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { archiveForm } from '@/lib/admin-api-client';

interface ArchiveFormButtonProps {
  formId: number;
  disabled?: boolean;
}

export default function ArchiveFormButton({
  formId,
  disabled,
}: ArchiveFormButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleArchive() {
    const confirmed = window.confirm(
      'Formular wirklich archivieren? Es kann nicht mehr für neue Leads verwendet werden.',
    );
    if (!confirmed) return;

    setLoading(true);
    try {
      const result = await archiveForm(formId);
      if (!result.ok) {
        alert(result.error ?? 'Archivieren fehlgeschlagen.');
        setLoading(false);
        return;
      }
      router.refresh();
    } catch (err) {
      console.error(err);
      alert('Unerwarteter Fehler beim Archivieren.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleArchive}
      disabled={disabled || loading}
      className="rounded-md border border-red-200 px-2 py-1 text-xs text-red-700 hover:bg-red-50 disabled:opacity-50"
    >
      {loading ? 'Archivieren…' : 'Archivieren'}
    </button>
  );
}
