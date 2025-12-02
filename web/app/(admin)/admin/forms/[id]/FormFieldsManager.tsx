// web/app/(admin)/admin/forms/[id]/FormFieldsManager.tsx
'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

export type FieldType =
  | 'TEXT'
  | 'TEXTAREA'
  | 'SINGLE_SELECT'
  | 'MULTI_SELECT'
  | 'NUMBER'
  | 'EMAIL'
  | 'PHONE'
  | 'DATE'
  | 'DATETIME'
  | 'BOOLEAN';

export interface RawFormField {
  id: number;
  formId: number;
  label: string;
  key: string;
  type: FieldType;
  required: boolean;
  // In der DB: string | null (JSON-Array) – wir normalisieren auf string[]
  options: string | null;
  order: number | null;
}

export interface FormField {
  id: number;
  formId: number;
  label: string;
  key: string;
  type: FieldType;
  required: boolean;
  options: string[];
  order: number;
}

interface FormFieldsManagerProps {
  formId: number;
  initialFields: RawFormField[];
}

interface ApiErrorResponse {
  error?: {
    code?: string;
    message?: string;
  };
}

function normalizeField(raw: RawFormField): FormField {
  let options: string[] = [];

  if (raw.options) {
    try {
      const parsed = JSON.parse(raw.options);
      if (Array.isArray(parsed)) {
        options = parsed.filter((o) => typeof o === 'string');
      }
    } catch {
      // falls options kein gültiges JSON ist, ignorieren wir es
      options = [];
    }
  }

  return {
    id: raw.id,
    formId: raw.formId,
    label: raw.label,
    key: raw.key,
    type: raw.type,
    required: raw.required,
    options,
    order: raw.order ?? 0,
  };
}

function optionsToTextareaValue(options: string[]): string {
  return options.join('\n');
}

function textareaToOptions(value: string): string[] {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

export default function FormFieldsManager({
  formId,
  initialFields,
}: FormFieldsManagerProps) {
  const router = useRouter();

  const [fields, setFields] = useState<FormField[]>(() =>
    [...initialFields].map(normalizeField).sort((a, b) => a.order - b.order),
  );

  const [error, setError] = useState<string | null>(null);

  // Neues Feld
  const [newLabel, setNewLabel] = useState('');
  const [newKey, setNewKey] = useState('');
  const [newType, setNewType] = useState<FieldType>('TEXT');
  const [newRequired, setNewRequired] = useState(false);
  const [newOptionsText, setNewOptionsText] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Edit-Feld
  const [editingFieldId, setEditingFieldId] = useState<number | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editKey, setEditKey] = useState('');
  const [editType, setEditType] = useState<FieldType>('TEXT');
  const [editRequired, setEditRequired] = useState(false);
  const [editOptionsText, setEditOptionsText] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const [isReordering, setIsReordering] = useState(false);
  const [deletingFieldId, setDeletingFieldId] = useState<number | null>(
    null,
  );

  const hasFields = fields.length > 0;

  const orderedFields = useMemo(
    () => [...fields].sort((a, b) => a.order - b.order),
    [fields],
  );

  function startEdit(field: FormField) {
    setEditingFieldId(field.id);
    setEditLabel(field.label);
    setEditKey(field.key);
    setEditType(field.type);
    setEditRequired(field.required);
    setEditOptionsText(optionsToTextareaValue(field.options));
    setError(null);
  }

  function cancelEdit() {
    setEditingFieldId(null);
    setEditLabel('');
    setEditKey('');
    setEditType('TEXT');
    setEditRequired(false);
    setEditOptionsText('');
    setError(null);
  }

  async function handleCreateField(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!newLabel.trim()) {
      setError('Bitte einen Label-Namen angeben.');
      return;
    }

    if (!newKey.trim()) {
      setError('Bitte einen Feldschlüssel (key) angeben.');
      return;
    }

    const options = textareaToOptions(newOptionsText);

    setIsCreating(true);

    try {
      const res = await fetch(`/api/admin/forms/${formId}/fields`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          label: newLabel.trim(),
          key: newKey.trim(),
          type: newType,
          required: newRequired,
          options,
        }),
      });

      const data = (await res.json()) as {
        field?: RawFormField;
      } & ApiErrorResponse;

      if (!res.ok) {
        const msg =
          data?.error?.message ??
          'Beim Erstellen des Feldes ist ein Fehler aufgetreten.';
        setError(msg);
        return;
      }

      if (!data.field) {
        setError('Antwort des Servers enthält kein Feld-Objekt.');
        return;
      }

      const created = normalizeField(data.field);

      setFields((prev) =>
        [...prev, created].sort((a, b) => a.order - b.order),
      );

      setNewLabel('');
      setNewKey('');
      setNewType('TEXT');
      setNewRequired(false);
      setNewOptionsText('');

      router.refresh();
    } catch (err) {
      console.error('Error creating field:', err);
      setError(
        'Beim Erstellen des Feldes ist ein unerwarteter Fehler aufgetreten.',
      );
    } finally {
      setIsCreating(false);
    }
  }

  async function handleSaveEdit(fieldId: number) {
    if (!editLabel.trim()) {
      setError('Bitte einen Label-Namen angeben.');
      return;
    }

    if (!editKey.trim()) {
      setError('Bitte einen Feldschlüssel (key) angeben.');
      return;
    }

    const options = textareaToOptions(editOptionsText);

    setIsSavingEdit(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/admin/forms/${formId}/fields/${fieldId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            label: editLabel.trim(),
            key: editKey.trim(),
            type: editType,
            required: editRequired,
            options,
          }),
        },
      );

      const data = (await res.json()) as {
        field?: RawFormField;
      } & ApiErrorResponse;

      if (!res.ok) {
        const msg =
          data?.error?.message ??
          'Beim Aktualisieren des Feldes ist ein Fehler aufgetreten.';
        setError(msg);
        return;
      }

      if (!data.field) {
        setError('Antwort des Servers enthält kein Feld-Objekt.');
        return;
      }

      const updated = normalizeField(data.field);

      setFields((prev) =>
        prev
          .map((f) => (f.id === fieldId ? updated : f))
          .sort((a, b) => a.order - b.order),
      );

      cancelEdit();
      router.refresh();
    } catch (err) {
      console.error('Error updating field:', err);
      setError(
        'Beim Aktualisieren des Feldes ist ein unerwarteter Fehler aufgetreten.',
      );
    } finally {
      setIsSavingEdit(false);
    }
  }

  async function handleDeleteField(fieldId: number) {
    const confirmed = window.confirm(
      'Dieses Feld wird gelöscht. Bestehende Leads können dadurch inkonsistente Daten enthalten. Fortfahren?',
    );
    if (!confirmed) return;

    setError(null);
    setDeletingFieldId(fieldId);

    try {
      const res = await fetch(
        `/api/admin/forms/${formId}/fields/${fieldId}`,
        {
          method: 'DELETE',
        },
      );

      const data = (await res.json()) as ApiErrorResponse;

      if (!res.ok) {
        const msg =
          data?.error?.message ??
          'Beim Löschen des Feldes ist ein Fehler aufgetreten.';
        setError(msg);
        return;
      }

      setFields((prev) => prev.filter((f) => f.id !== fieldId));
      if (editingFieldId === fieldId) {
        cancelEdit();
      }

      router.refresh();
    } catch (err) {
      console.error('Error deleting field:', err);
      setError(
        'Beim Löschen des Feldes ist ein unerwarteter Fehler aufgetreten.',
      );
    } finally {
      setDeletingFieldId(null);
    }
  }

  async function handleMoveField(fieldId: number, direction: 'up' | 'down') {
    setError(null);

    const currentIndex = orderedFields.findIndex(
      (f) => f.id === fieldId,
    );
    if (currentIndex === -1) return;

    const delta = direction === 'up' ? -1 : 1;
    const targetIndex = currentIndex + delta;
    if (targetIndex < 0 || targetIndex >= orderedFields.length) {
      return;
    }

    const newOrder = [...orderedFields];
    const temp = newOrder[currentIndex];
    newOrder[currentIndex] = newOrder[targetIndex];
    newOrder[targetIndex] = temp;

    // Optimistisch lokale Reihenfolge setzen
    const withUpdatedOrder = newOrder.map((f, index) => ({
      ...f,
      order: index + 1,
    }));

    const previousFields = fields;

    setFields(withUpdatedOrder);
    setIsReordering(true);

    try {
      const res = await fetch(
        `/api/admin/forms/${formId}/fields/reorder`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fieldOrder: withUpdatedOrder.map((f) => f.id),
          }),
        },
      );

      const data = (await res.json()) as {
        fields?: RawFormField[];
      } & ApiErrorResponse;

      if (!res.ok) {
        const msg =
          data?.error?.message ??
          'Beim Aktualisieren der Reihenfolge ist ein Fehler aufgetreten.';
        setError(msg);
        // alten Stand wiederherstellen
        setFields(previousFields);
        return;
      }

      if (data.fields && Array.isArray(data.fields)) {
        setFields(
          data.fields.map(normalizeField).sort((a, b) => a.order - b.order),
        );
      }

      router.refresh();
    } catch (err) {
      console.error('Error reordering fields:', err);
      setError(
        'Beim Aktualisieren der Reihenfolge ist ein unerwarteter Fehler aufgetreten.',
      );
      setFields(previousFields);
    } finally {
      setIsReordering(false);
    }
  }

  return (
    <section className="rounded-md border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-lg font-semibold">
            Formularfelder verwalten
          </h2>
          <p className="text-sm text-gray-600">
            Felder hinzufügen, bearbeiten, löschen und Reihenfolge
            anpassen.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Feldliste */}
      {hasFields ? (
        <div className="mb-6 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-gray-700">
                  Reihenfolge
                </th>
                <th className="px-3 py-2 text-left font-medium text-gray-700">
                  Label
                </th>
                <th className="px-3 py-2 text-left font-medium text-gray-700">
                  Key
                </th>
                <th className="px-3 py-2 text-left font-medium text-gray-700">
                  Typ
                </th>
                <th className="px-3 py-2 text-left font-medium text-gray-700">
                  Pflicht
                </th>
                <th className="px-3 py-2 text-left font-medium text-gray-700">
                  Optionen
                </th>
                <th className="px-3 py-2 text-right font-medium text-gray-700">
                  Aktionen
                </th>
              </tr>
            </thead>
            <tbody>
              {orderedFields.map((field, index) => {
                const isEditing = editingFieldId === field.id;
                const isFirst = index === 0;
                const isLast = index === orderedFields.length - 1;

                return (
                  <tr
                    key={field.id}
                    className="border-b border-gray-100 align-top"
                  >
                    {/* Reihenfolge / Up-Down */}
                    <td className="px-3 py-2 text-gray-600 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-500 mr-1">
                          {index + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleMoveField(field.id, 'up')}
                          disabled={
                            isFirst || isReordering || !!editingFieldId
                          }
                          className="rounded border border-gray-300 px-1 text-xs disabled:opacity-40"
                          title="Nach oben"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleMoveField(field.id, 'down')
                          }
                          disabled={
                            isLast || isReordering || !!editingFieldId
                          }
                          className="rounded border border-gray-300 px-1 text-xs disabled:opacity-40"
                          title="Nach unten"
                        >
                          ↓
                        </button>
                      </div>
                    </td>

                    {/* Label */}
                    <td className="px-3 py-2">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editLabel}
                          onChange={(e) =>
                            setEditLabel(e.target.value)
                          }
                          className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      ) : (
                        <span>{field.label}</span>
                      )}
                    </td>

                    {/* Key */}
                    <td className="px-3 py-2">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editKey}
                          onChange={(e) =>
                            setEditKey(e.target.value)
                          }
                          className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      ) : (
                        <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs">
                          {field.key}
                        </code>
                      )}
                    </td>

                    {/* Typ */}
                    <td className="px-3 py-2">
                      {isEditing ? (
                        <select
                          value={editType}
                          onChange={(e) =>
                            setEditType(e.target.value as FieldType)
                          }
                          className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="TEXT">Text</option>
                          <option value="TEXTAREA">Textarea</option>
                          <option value="SINGLE_SELECT">
                            Single Select
                          </option>
                          <option value="MULTI_SELECT">
                            Multi Select
                          </option>
                          <option value="NUMBER">Zahl</option>
                          <option value="EMAIL">E-Mail</option>
                          <option value="PHONE">Telefon</option>
                          <option value="DATE">Datum</option>
                          <option value="DATETIME">
                            Datum &amp; Zeit
                          </option>
                          <option value="BOOLEAN">Ja/Nein</option>
                        </select>
                      ) : (
                        <span className="text-xs uppercase text-gray-600">
                          {field.type}
                        </span>
                      )}
                    </td>

                    {/* Pflicht */}
                    <td className="px-3 py-2 text-center">
                      {isEditing ? (
                        <input
                          type="checkbox"
                          checked={editRequired}
                          onChange={(e) =>
                            setEditRequired(e.target.checked)
                          }
                        />
                      ) : field.required ? (
                        <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
                          Pflicht
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-gray-50 px-2 py-0.5 text-xs text-gray-500">
                          Optional
                        </span>
                      )}
                    </td>

                    {/* Optionen */}
                    <td className="px-3 py-2">
                      {isEditing ? (
                        <textarea
                          value={editOptionsText}
                          onChange={(e) =>
                            setEditOptionsText(e.target.value)
                          }
                          rows={3}
                          placeholder="Eine Option pro Zeile"
                          className="w-full rounded-md border border-gray-300 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      ) : field.options.length > 0 ? (
                        <div className="max-w-xs text-xs text-gray-700">
                          {field.options.map((opt) => (
                            <span
                              key={opt}
                              className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 mr-1 mb-1"
                            >
                              {opt}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">
                          – keine –
                        </span>
                      )}
                    </td>

                    {/* Aktionen */}
                    <td className="px-3 py-2 text-right whitespace-nowrap">
                      {isEditing ? (
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(field.id)}
                            disabled={isSavingEdit}
                            className="rounded-md bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                          >
                            {isSavingEdit ? 'Speichern…' : 'Speichern'}
                          </button>
                          <button
                            type="button"
                            onClick={cancelEdit}
                            disabled={isSavingEdit}
                            className="rounded-md border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                          >
                            Abbrechen
                          </button>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => startEdit(field)}
                            disabled={!!editingFieldId}
                            className="rounded-md border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                          >
                            Bearbeiten
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleDeleteField(field.id)
                            }
                            disabled={deletingFieldId === field.id}
                            className="rounded-md border border-red-500 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
                          >
                            {deletingFieldId === field.id
                              ? 'Löschen…'
                              : 'Löschen'}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mb-6 rounded-md border border-dashed border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-600">
          Dieses Formular hat noch keine Felder. Lege unten das erste
          Feld an.
        </div>
      )}

      {/* Neues Feld anlegen */}
      <div className="border-t border-gray-200 pt-4 mt-4">
        <h3 className="text-sm font-semibold mb-3">Neues Feld anlegen</h3>

        <form
          onSubmit={handleCreateField}
          className="grid gap-4 md:grid-cols-2"
        >
          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-700">
              Label
            </label>
            <input
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="z. B. Firma"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-700">
              Key
            </label>
            <input
              type="text"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="z. B. company"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-700">
              Typ
            </label>
            <select
              value={newType}
              onChange={(e) =>
                setNewType(e.target.value as FieldType)
              }
              className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="TEXT">Text</option>
              <option value="TEXTAREA">Textarea</option>
              <option value="SINGLE_SELECT">Single Select</option>
              <option value="MULTI_SELECT">Multi Select</option>
              <option value="NUMBER">Zahl</option>
              <option value="EMAIL">E-Mail</option>
              <option value="PHONE">Telefon</option>
              <option value="DATE">Datum</option>
              <option value="DATETIME">Datum &amp; Zeit</option>
              <option value="BOOLEAN">Ja/Nein</option>
            </select>
          </div>

          <div className="space-y-1 flex items-center gap-2">
            <input
              id="new-required"
              type="checkbox"
              checked={newRequired}
              onChange={(e) => setNewRequired(e.target.checked)}
              className="h-4 w-4"
            />
            <label
              htmlFor="new-required"
              className="text-sm text-gray-700"
            >
              Pflichtfeld
            </label>
          </div>

          <div className="space-y-1 md:col-span-2">
            <label className="block text-xs font-medium text-gray-700">
              Optionen (für Select-Felder)
            </label>
            <textarea
              value={newOptionsText}
              onChange={(e) => setNewOptionsText(e.target.value)}
              rows={3}
              placeholder="Eine Option pro Zeile"
              className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="md:col-span-2 flex justify-start">
            <button
              type="submit"
              disabled={isCreating}
              className="inline-flex items-center rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60"
            >
              {isCreating ? 'Feld wird erstellt…' : 'Feld erstellen'}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
