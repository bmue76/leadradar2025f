'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createForm, FormStatus } from '@/lib/admin-api-client';

const DEFAULT_STATUS: FormStatus = 'DRAFT';

export default function FormCreateButton() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<FormStatus>(DEFAULT_STATUS);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Bitte einen Formularnamen eingeben.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const result = await createForm({
        name: name.trim(),
        description: description.trim() || undefined,
        status,
      });

      if (!result.ok) {
        setError(result.error ?? 'Erstellen des Formulars fehlgeschlagen.');
        setSubmitting(false);
        return;
      }

      // Zurücksetzen & Liste neu laden
      setName('');
      setDescription('');
      setStatus(DEFAULT_STATUS);
      setOpen(false);
      router.refresh();
    } catch (err) {
      console.error(err);
      setError('Unerwarteter Fehler beim Erstellen.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-black"
      >
        Neues Formular
      </button>
    );
  }

  return (
    <div className="w-full max-w-xl rounded-lg border bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Neues Formular anlegen</h2>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-gray-500 hover:text-gray-800"
        >
          Schließen
        </button>
      </div>

      <form onSubmit={onSubmit} className="space-y-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-700">
            Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-md border px-2 py-1.5 text-sm"
            placeholder="z. B. Messe Basel 2025 – Standard-Leadformular"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-700">
            Beschreibung
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full rounded-md border px-2 py-1.5 text-sm"
            placeholder="Interne Beschreibung, z. B. Zweck, Event, Zielgruppe ..."
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-700">
            Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as FormStatus)}
            className="w-full rounded-md border px-2 py-1.5 text-sm"
          >
            <option value="DRAFT">DRAFT – in Vorbereitung</option>
            <option value="ACTIVE">ACTIVE – im Einsatz</option>
            <option value="ARCHIVED">ARCHIVED – archiviert</option>
          </select>
        </div>

        {error && (
          <p className="text-xs text-red-600">{error}</p>
        )}

        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-md border px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
            disabled={submitting}
          >
            Abbrechen
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-gray-900 px-4 py-1.5 text-xs font-medium text-white hover:bg-black disabled:opacity-60"
          >
            {submitting ? 'Speichern …' : 'Formular erstellen'}
          </button>
        </div>
      </form>
    </div>
  );
}
