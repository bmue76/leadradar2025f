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

function parseId(idParam: string): number | null {
  const id = Number(idParam);
  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }
  return id;
}

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
 * GET /api/admin/forms/:id
 * Einzelnes Formular inkl. Felder.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const id = parseId(params.id);

  if (!id) {
    return Response.json(
      { error: 'Invalid form id' },
      { status: 400 },
    );
  }

  try {
    const form = await prisma.form.findUnique({
      where: { id },
      include: {
        fields: {
          orderBy: { order: 'asc' },
        },
        _count: {
          select: { fields: true },
        },
      },
    });

    if (!form) {
      return Response.json(
        { error: 'Form not found' },
        { status: 404 },
      );
    }

    const dto = toFormDto(form);

    return Response.json(dto);
  } catch (error) {
    console.error('Error fetching form by id', error);
    return Response.json(
      { error: 'Failed to load form' },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/admin/forms/:id
 * Aktualisiert Metadaten (Name, Beschreibung, Status).
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const id = parseId(params.id);

  if (!id) {
    return Response.json(
      { error: 'Invalid form id' },
      { status: 400 },
    );
  }

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

    if (
      typeof name === 'undefined' &&
      typeof description === 'undefined' &&
      typeof status === 'undefined'
    ) {
      return Response.json(
        { error: 'No fields to update' },
        { status: 400 },
      );
    }

    const existing = await prisma.form.findUnique({
      where: { id },
    });

    if (!existing) {
      return Response.json(
        { error: 'Form not found' },
        { status: 404 },
      );
    }

    const updateData: {
      name?: string;
      description?: string | null;
      status?: FormStatus;
    } = {};

    if (typeof name !== 'undefined') {
      if (!name || typeof name !== 'string' || !name.trim()) {
        return Response.json(
          { error: 'Field "name" must be a non-empty string if provided' },
          { status: 400 },
        );
      }
      updateData.name = name.trim();
    }

    if (typeof description !== 'undefined') {
      updateData.description = description ?? null;
    }

    if (typeof status !== 'undefined') {
      if (!VALID_FORM_STATUSES.includes(status)) {
        return Response.json(
          { error: 'Invalid status value' },
          { status: 400 },
        );
      }
      updateData.status = status;
    }

    const updated = await prisma.form.update({
      where: { id },
      data: updateData,
      include: {
        fields: {
          orderBy: { order: 'asc' },
        },
        _count: {
          select: { fields: true },
        },
      },
    });

    const dto = toFormDto(updated);

    return Response.json(dto);
  } catch (error) {
    console.error('Error updating form', error);
    return Response.json(
      { error: 'Failed to update form' },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/admin/forms/:id
 * Soft-Delete: setzt Status auf ARCHIVED.
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const id = parseId(params.id);

  if (!id) {
    return Response.json(
      { error: 'Invalid form id' },
      { status: 400 },
    );
  }

  try {
    const existing = await prisma.form.findUnique({
      where: { id },
    });

    if (!existing) {
      return Response.json(
        { error: 'Form not found' },
        { status: 404 },
      );
    }

    if (existing.status === 'ARCHIVED') {
      // Idempotent: bereits archiviert
      return new Response(null, { status: 204 });
    }

    await prisma.form.update({
      where: { id },
      data: {
        status: 'ARCHIVED',
      },
    });

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Error archiving form', error);
    return Response.json(
      { error: 'Failed to archive form' },
      { status: 500 },
    );
  }
}
