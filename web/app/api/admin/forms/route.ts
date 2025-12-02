import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { FormDto, FormFieldDto, FormStatus } from '@/lib/api-types';
import type { Form, FormField } from '@prisma/client';

const VALID_FORM_STATUSES: FormStatus[] = ['DRAFT', 'ACTIVE', 'ARCHIVED'];

type FormWithFieldsAndCount = Form & {
  fields: FormField[];
  _count: {
    fields: number;
  };
};

function mapField(field: FormField): FormFieldDto {
  return {
    id: field.id,
    formId: field.formId,
    key: field.key,
    label: field.label,
    type: field.type,
    required: field.required,
    order: field.order,
  };
}

function toFormDto(form: FormWithFieldsAndCount): FormDto {
  return {
    id: form.id,
    name: form.name,
    description: form.description,
    status: form.status as FormStatus,
    fieldCount: form._count.fields,
    fields: form.fields.map(mapField),
    createdAt: form.createdAt.toISOString(),
    updatedAt: form.updatedAt.toISOString(),
  };
}

/**
 * GET /api/admin/forms
 * Liefert alle Formulare (inkl. Felder) für die Admin-Formliste.
 */
export async function GET() {
  try {
    const forms = await prisma.form.findMany({
      include: {
        fields: true,
        _count: {
          select: { fields: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const dtos = forms.map(toFormDto);

    return Response.json({ forms: dtos });
  } catch (error) {
    console.error('Error fetching forms', error);
    return Response.json(
      { error: 'Failed to load forms' },
      { status: 500 },
    );
  }
}

/**
 * POST /api/admin/forms
 * Legt ein neues Formular an (Standardstatus: DRAFT, keine Felder).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    if (!body || typeof body !== 'object') {
      return Response.json(
        { error: 'Invalid JSON body' },
        { status: 400 },
      );
    }

    const { name, description, status } = body as {
      name?: string;
      description?: string | null;
      status?: FormStatus;
    };

    if (!name || typeof name !== 'string' || !name.trim()) {
      return Response.json(
        { error: 'Field "name" is required' },
        { status: 400 },
      );
    }

    let formStatus: FormStatus = 'DRAFT';
    if (status) {
      if (!VALID_FORM_STATUSES.includes(status)) {
        return Response.json(
          { error: 'Invalid status value' },
          { status: 400 },
        );
      }
      formStatus = status;
    }

    const created = await prisma.form.create({
      data: {
        name: name.trim(),
        description: description ?? null,
        status: formStatus,
      },
      include: {
        fields: true,
        _count: {
          select: { fields: true },
        },
      },
    });

    const dto = toFormDto(created);

    return Response.json(dto, { status: 201 });
  } catch (error) {
    console.error('Error creating form', error);
    return Response.json(
      { error: 'Failed to create form' },
      { status: 500 },
    );
  }
}
