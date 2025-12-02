// web/app/api/admin/forms/[id]/fields/[fieldId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma, FieldType } from '@prisma/client';

const ALLOWED_FIELD_TYPES: FieldType[] = [
  FieldType.TEXT,
  FieldType.TEXTAREA,
  FieldType.SINGLE_SELECT,
  FieldType.MULTI_SELECT,
  FieldType.NUMBER,
  FieldType.EMAIL,
  FieldType.PHONE,
  FieldType.DATE,
  FieldType.DATETIME,
  FieldType.BOOLEAN,
];

interface UpdateFieldBody {
  label?: string;
  key?: string;
  type?: string;
  required?: boolean;
  options?: unknown;
  order?: number;
}

function jsonError(
  status: number,
  code: string,
  message: string,
): NextResponse {
  return NextResponse.json(
    {
      error: { code, message },
    },
    { status },
  );
}

async function ensureFieldBelongsToForm(
  formIdNum: number,
  fieldIdNum: number,
) {
  const field = await prisma.formField.findUnique({
    where: { id: fieldIdNum },
  });

  if (!field || field.formId !== formIdNum) {
    return null;
  }

  return field;
}

export async function PUT(
  req: NextRequest,
  context: { params: { id: string; fieldId: string } },
) {
  const { id, fieldId } = context.params;
  const formIdNum = Number(id);
  const fieldIdNum = Number(fieldId);

  if (!Number.isInteger(formIdNum) || formIdNum <= 0) {
    return jsonError(
      400,
      'INVALID_FORM_ID',
      'Ungültige Formular-ID in der URL.',
    );
  }

  if (!Number.isInteger(fieldIdNum) || fieldIdNum <= 0) {
    return jsonError(
      400,
      'INVALID_FIELD_ID',
      'Ungültige Feld-ID in der URL.',
    );
  }

  let body: UpdateFieldBody;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, 'INVALID_JSON', 'Request-Body ist kein gültiges JSON.');
  }

  const existing = await ensureFieldBelongsToForm(formIdNum, fieldIdNum);
  if (!existing) {
    return jsonError(
      404,
      'FIELD_NOT_FOUND',
      'Das Feld wurde nicht gefunden.',
    );
  }

  const data: Record<string, unknown> = {};

  if (body.label !== undefined) {
    if (typeof body.label !== 'string' || !body.label.trim()) {
      return jsonError(
        400,
        'VALIDATION_ERROR',
        'Das Feld "label" darf nicht leer sein.',
      );
    }
    data.label = body.label.trim();
  }

  if (body.key !== undefined) {
    if (typeof body.key !== 'string' || !body.key.trim()) {
      return jsonError(
        400,
        'VALIDATION_ERROR',
        'Das Feld "key" darf nicht leer sein.',
      );
    }
    data.key = body.key.trim();
  }

  if (body.type !== undefined) {
    if (
      typeof body.type !== 'string' ||
      !ALLOWED_FIELD_TYPES.includes(body.type as FieldType)
    ) {
      return jsonError(
        400,
        'INVALID_FIELD_TYPE',
        `Der Feldtyp "${body.type}" ist ungültig.`,
      );
    }
    data.type = body.type as FieldType;
  }

  if (body.required !== undefined) {
    if (typeof body.required !== 'boolean') {
      return jsonError(
        400,
        'VALIDATION_ERROR',
        'Das Feld "required" muss ein boolean sein.',
      );
    }
    data.required = body.required;
  }

  if (body.options !== undefined) {
    if (!Array.isArray(body.options)) {
      return jsonError(
        400,
        'VALIDATION_ERROR',
        'Das Feld "options" muss ein Array von Strings sein.',
      );
    }
    const allStrings = body.options.every((o) => typeof o === 'string');
    if (!allStrings) {
      return jsonError(
        400,
        'VALIDATION_ERROR',
        'Alle Einträge in "options" müssen Strings sein.',
      );
    }

    const optionsArray = body.options as string[];
    const optionsSerialized =
      optionsArray.length > 0 ? JSON.stringify(optionsArray) : null;

    data.options = optionsSerialized;
  }

  if (body.order !== undefined) {
    if (typeof body.order !== 'number') {
      return jsonError(
        400,
        'VALIDATION_ERROR',
        'Das Feld "order" muss eine Zahl sein.',
      );
    }
    data.order = body.order;
  }

  if (Object.keys(data).length === 0) {
    return jsonError(
      400,
      'NO_UPDATE_FIELDS',
      'Es wurden keine Felder zum Aktualisieren übergeben.',
    );
  }

  try {
    const field = await prisma.formField.update({
      where: { id: fieldIdNum },
      data,
    });

    return NextResponse.json(
      { field },
      { status: 200 },
    );
  } catch (error: unknown) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      const target = error.meta?.target;
      const targetStr = Array.isArray(target)
        ? target.join('_')
        : String(target ?? '');

      if (targetStr.includes('formId') && targetStr.includes('key')) {
        return jsonError(
          409,
          'FIELD_KEY_DUPLICATE',
          'Der Feldschlüssel wird in diesem Formular bereits verwendet.',
        );
      }

      return jsonError(
        409,
        'UNIQUE_CONSTRAINT_VIOLATION',
        'Es ist ein Unique-Constraint-Fehler aufgetreten.',
      );
    }

    console.error('Error updating form field:', error);
    return jsonError(
      500,
      'INTERNAL_SERVER_ERROR',
      'Beim Aktualisieren des Feldes ist ein unerwarteter Fehler aufgetreten.',
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  context: { params: { id: string; fieldId: string } },
) {
  const { id, fieldId } = context.params;
  const formIdNum = Number(id);
  const fieldIdNum = Number(fieldId);

  if (!Number.isInteger(formIdNum) || formIdNum <= 0) {
    return jsonError(
      400,
      'INVALID_FORM_ID',
      'Ungültige Formular-ID in der URL.',
    );
  }

  if (!Number.isInteger(fieldIdNum) || fieldIdNum <= 0) {
    return jsonError(
      400,
      'INVALID_FIELD_ID',
      'Ungültige Feld-ID in der URL.',
    );
  }

  const existing = await ensureFieldBelongsToForm(formIdNum, fieldIdNum);
  if (!existing) {
    return jsonError(
      404,
      'FIELD_NOT_FOUND',
      'Das Feld wurde nicht gefunden.',
    );
  }

  try {
    await prisma.formField.delete({
      where: { id: fieldIdNum },
    });

    return NextResponse.json(
      { success: true },
      { status: 200 },
    );
  } catch (error: unknown) {
    console.error('Error deleting form field:', error);
    return jsonError(
      500,
      'INTERNAL_SERVER_ERROR',
      'Beim Löschen des Feldes ist ein unerwarteter Fehler aufgetreten.',
    );
  }
}
