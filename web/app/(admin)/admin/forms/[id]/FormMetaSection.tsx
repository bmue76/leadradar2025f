// web/app/(admin)/admin/forms/[id]/FormMetaSection.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type FormStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';

interface FormMeta {
  id: number;
  name: string;
  description: string | null;
  status: FormStatus;
}

interface FormMetaSectionProps {
  form: FormMeta;
}

interface ApiErrorResponse {
  error?: {
    code?: string;
    message?: string;
  };
}

export default function FormMetaSection({ form }: FormMetaSectionProps) {
  const router = useRouter();

  const [name, setName] = useState(form.name);
  const [description, setDescription] = useState(form.description ?? '');
  const [status, setStatus] = useState<FormStatus>(form.status);
  const [isSaving, setIsSaving] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSaving(true);

    try {
      const res = await fetch(`/api/admin/forms/${form.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          status,
        }),
      });

      const data = (await res.json()) as ApiErrorResponse;

      if (!res.ok) {
        const msg =
          data?.error?.message ??
          'Beim Speichern des Formulars ist ein Fehler aufgetreten.';
        setError(msg);
        return;
      }

      setSuccess('Formular-Metadaten wurden gespeichert.');
      router.refresh();
    } catch (err) {
      console.error('Error updating form meta:', err);
      setError(
        'Beim Speichern des Formulars ist ein unerwarteter Fehler aufgetreten.',
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleArchive() {
    const confirmed = window.confirm(
      'Dieses Formular wird archiviert und steht nicht mehr für neue Leads zur Verfügung. Bestehende Leads bleiben erhalten. Fortfahren?',
    );
    if (!confirmed) return;

    setError(null);
    setSuccess(null);
    setIsArchiving(true);

    try {
      const res = await fetch(`/api/admin/forms/${form.id}`, {
        method: 'DELETE',
      });

      const data = (await res.json()) as ApiErrorResponse;

      if (!res.ok) {
        const msg =
          data?.error?.message ??
          'Beim Archivieren des Formulars ist ein Fehler aufgetreten.';
        setError(msg);
        return;
      }

      // Nach dem Archivieren zurück zur Formularliste
      router.push('/admin/forms');
      router.refresh();
    } catch (err) {
      console.error('Error archiving form:', err);
      setError(
        'Beim Archivieren des Formulars ist ein unerwarteter Fehler aufgetreten.',
      );
    } finally {
      setIsArchiving(false);
    }
  }

  return (
    <section className="rounded-md border border-gray-200 bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold mb-4">
        Formulardaten bearbeiten
      </h2>

      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as FormStatus)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="DRAFT">Entwurf</option>
              <option value="ACTIVE">Aktiv</option>
              <option value="ARCHIVED">Archiviert</option>
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            Beschreibung
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Optionale Beschreibung für dieses Formular…"
          />
        </div>

        {(error || success) && (
          <div className="text-sm">
            {error && <p className="text-red-600 mb-1">{error}</p>}
            {success && <p className="text-green-600">{success}</p>}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {isSaving ? 'Speichern…' : 'Speichern'}
          </button>

          <button
            type="button"
            onClick={handleArchive}
            disabled={isArchiving}
            className="inline-flex items-center rounded-md border border-red-500 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
          >
            {isArchiving ? 'Archivieren…' : 'Formular archivieren'}
          </button>
        </div>
      </form>
    </section>
  );
}
