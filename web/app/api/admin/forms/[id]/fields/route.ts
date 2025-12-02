// web/app/api/admin/forms/[id]/fields/route.ts
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

interface CreateFieldBody {
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

export async function POST(
  req: NextRequest,
  context: { params: { id: string } },
) {
  const { id } = context.params;
  const formIdNum = Number(id);

  if (!Number.isInteger(formIdNum) || formIdNum <= 0) {
    return jsonError(
      400,
      'INVALID_FORM_ID',
      'Ungültige Formular-ID in der URL.',
    );
  }

  let body: CreateFieldBody;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, 'INVALID_JSON', 'Request-Body ist kein gültiges JSON.');
  }

  const label = typeof body.label === 'string' ? body.label.trim() : '';
  const key = typeof body.key === 'string' ? body.key.trim() : '';
  const typeStr = typeof body.type === 'string' ? body.type : '';
  const required =
    typeof body.required === 'boolean' ? body.required : false;
  const order = typeof body.order === 'number' ? body.order : undefined;

  if (!label) {
    return jsonError(
      400,
      'VALIDATION_ERROR',
      'Das Feld "label" darf nicht leer sein.',
    );
  }

  if (!key) {
    return jsonError(
      400,
      'VALIDATION_ERROR',
      'Das Feld "key" darf nicht leer sein.',
    );
  }

  if (!typeStr) {
    return jsonError(
      400,
      'VALIDATION_ERROR',
      'Das Feld "type" darf nicht leer sein.',
    );
  }

  if (!ALLOWED_FIELD_TYPES.includes(typeStr as FieldType)) {
    return jsonError(
      400,
      'INVALID_FIELD_TYPE',
      `Der Feldtyp "${typeStr}" ist ungültig.`,
    );
  }

  const fieldType = typeStr as FieldType;

  let optionsArray: string[] | undefined;
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
    optionsArray = body.options as string[];
  }

  // options als JSON-String in der DB speichern (string | null)
  const optionsSerialized =
    optionsArray && optionsArray.length > 0
      ? JSON.stringify(optionsArray)
      : null;

  // Prüfen, ob das Formular existiert
  const form = await prisma.form.findUnique({
    where: { id: formIdNum },
    select: { id: true },
  });

  if (!form) {
    return jsonError(
      404,
      'FORM_NOT_FOUND',
      'Das Formular wurde nicht gefunden.',
    );
  }

  // Order bestimmen: falls nicht gesetzt → ans Ende
  let finalOrder = order;
  if (finalOrder === undefined) {
    const aggregate = await prisma.formField.aggregate({
      where: { formId: formIdNum },
      _max: { order: true },
    });
    const currentMax = aggregate._max.order ?? 0;
    finalOrder = currentMax + 1;
  }

  try {
    const field = await prisma.formField.create({
      data: {
        formId: formIdNum,
        label,
        key,
        type: fieldType,
        required,
        options: optionsSerialized,
        order: finalOrder,
      },
    });

    return NextResponse.json(
      { field },
      { status: 201 },
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
          `Der Feldschlüssel "${key}" wird in diesem Formular bereits verwendet.`,
        );
      }

      return jsonError(
        409,
        'UNIQUE_CONSTRAINT_VIOLATION',
        'Es ist ein Unique-Constraint-Fehler aufgetreten.',
      );
    }

    console.error('Error creating form field:', error);
    return jsonError(
      500,
      'INTERNAL_SERVER_ERROR',
      'Beim Erstellen des Feldes ist ein unerwarteter Fehler aufgetreten.',
    );
  }
}
