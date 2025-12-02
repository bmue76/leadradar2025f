// web/app/api/admin/forms/[id]/fields/reorder/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

interface ReorderBody {
  fieldOrder?: unknown;
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

  let body: ReorderBody;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, 'INVALID_JSON', 'Request-Body ist kein gültiges JSON.');
  }

  if (!Array.isArray(body.fieldOrder)) {
    return jsonError(
      400,
      'VALIDATION_ERROR',
      'Das Feld "fieldOrder" muss ein Array von IDs sein.',
    );
  }

  const fieldOrder = body.fieldOrder.map((fieldId) => Number(fieldId));

  if (fieldOrder.some((fieldId) => !Number.isInteger(fieldId) || fieldId <= 0)) {
    return jsonError(
      400,
      'VALIDATION_ERROR',
      'Alle Einträge in "fieldOrder" müssen positive Ganzzahlen sein.',
    );
  }

  const existingFields = await prisma.formField.findMany({
    where: { formId: formIdNum },
    orderBy: { order: 'asc' },
  });

  const existingIds = existingFields.map((f) => f.id);
  const existingIdSet = new Set(existingIds);

  if (existingIds.length !== fieldOrder.length) {
    return jsonError(
      400,
      'INVALID_FIELD_ORDER',
      'Die Anzahl der IDs in "fieldOrder" stimmt nicht mit der Anzahl der Felder überein.',
    );
  }

  // Prüfen, ob alle IDs exakt übereinstimmen
  for (const fieldId of fieldOrder) {
    if (!existingIdSet.has(fieldId)) {
      return jsonError(
        400,
        'INVALID_FIELD_ORDER',
        'Das Array "fieldOrder" enthält ungültige Feld-IDs für dieses Formular.',
      );
    }
  }

  try {
    const updates = fieldOrder.map((fieldId, index) =>
      prisma.formField.update({
        where: { id: fieldId },
        data: { order: index + 1 },
      }),
    );

    const updatedFields = await prisma.$transaction(updates);

    return NextResponse.json(
      { fields: updatedFields },
      { status: 200 },
    );
  } catch (error: unknown) {
    console.error('Error reordering form fields:', error);
    return jsonError(
      500,
      'INTERNAL_SERVER_ERROR',
      'Beim Aktualisieren der Reihenfolge ist ein unerwarteter Fehler aufgetreten.',
    );
  }
}
