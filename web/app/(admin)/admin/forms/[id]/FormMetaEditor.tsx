'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { archiveForm, updateForm, FormStatus } from '@/lib/admin-api-client';
import type { FormDto } from '@/lib/api-types';

interface FormMetaEditorProps {
  form: Pick<FormDto, 'id' | 'name' | 'description' | 'status'>;
}

export default function FormMetaEditor({ form }: FormMetaEditorProps) {
  const [name, setName] = useState(form.name);
  const [description, setDescription] = useState(form.description ?? '');
  const [status, setStatus] = useState<FormStatus>(form.status);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const router = useRouter();

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Der Name darf nicht leer sein.');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await updateForm(form.id, {
        name: name.trim(),
        description: description.trim() || null,
        status,
      });

      if (!result.ok || !result.data) {
        setError(result.error ?? 'Speichern fehlgeschlagen.');
        setSaving(false);
        return;
      }

      setSuccess('Formular gespeichert.');
      router.refresh();
    } catch (err) {
      console.error(err);
      setError('Unerwarteter Fehler beim Speichern.');
    } finally {
      setSaving(false);
    }
  };

  const onArchive = async () => {
    const confirmed = window.confirm(
      'Formular wirklich archivieren? Es kann danach nicht mehr für neue Leads verwendet werden.',
    );
    if (!confirmed) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await archiveForm(form.id);
      if (!result.ok) {
        setError(result.error ?? 'Archivieren fehlgeschlagen.');
        setSaving(false);
        return;
      }

      // Nach Archivierung zurück zur Formularliste
      router.push('/admin/forms');
    } catch (err) {
      console.error(err);
      setError('Unerwarteter Fehler beim Archivieren.');
      setSaving(false);
    }
  };

  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
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
        {success && (
          <p className="text-xs text-green-700">{success}</p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
          <button
            type="button"
            onClick={onArchive}
            disabled={saving || status === 'ARCHIVED'}
            className="rounded-md border border-red-200 px-3 py-1.5 text-xs text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            Formular archivieren
          </button>

          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-gray-900 px-4 py-1.5 text-xs font-medium text-white hover:bg-black disabled:opacity-60"
          >
            {saving ? 'Speichern …' : 'Änderungen speichern'}
          </button>
        </div>
      </form>
    </div>
  );
}
