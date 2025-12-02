// web/app/(admin)/admin/forms/[id]/page.tsx
import { notFound } from 'next/navigation';
import Link from 'next/link';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import FormMetaSection from './FormMetaSection';
import FormFieldsManager from './FormFieldsManager';

type FormWithFields = Prisma.FormGetPayload<{
  include: { fields: true };
}>;

interface FormDetailPageProps {
  params: {
    id: string;
  };
}

export default async function FormDetailPage({
  params,
}: FormDetailPageProps) {
  const id = Number(params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return (
      <div className="p-6">
        <div className="mb-4">
          <Link
            href="/admin/forms"
            className="text-sm text-blue-600 hover:underline"
          >
            ← Zurück zur Formularübersicht
          </Link>
        </div>
        <h1 className="text-xl font-semibold mb-2">
          Ungültige Formular-ID
        </h1>
        <p className="text-sm text-gray-600">
          Die übergebene Formular-ID ist nicht gültig.
        </p>
      </div>
    );
  }

  const form = await prisma.form.findUnique({
    where: { id },
    include: {
      fields: {
        orderBy: { order: 'asc' },
      },
    },
  });

  if (!form) {
    notFound();
  }

  // Typ-Safety: form ist hier garantiert definiert
  const typedForm = form as FormWithFields;

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="mb-1">
            <Link
              href="/admin/forms"
              className="text-sm text-blue-600 hover:underline"
            >
              ← Zurück zur Formularübersicht
            </Link>
          </div>
          <h1 className="text-2xl font-semibold">
            Formular: {typedForm.name}
          </h1>
          <p className="text-sm text-gray-600">
            ID {typedForm.id} · Status: {typedForm.status}
          </p>
        </div>
      </div>

      {/* Form-Metadaten bearbeiten */}
      <FormMetaSection form={typedForm} />

      {/* Feld-Management */}
      <FormFieldsManager
        formId={typedForm.id}
        initialFields={typedForm.fields}
      />
    </div>
  );
}
