// web/app/api/leads/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type {
  LeadCreatePayload,
  LeadCreateValueInput,
  ErrorResponse,
} from '@/lib/api-types';

function badRequest(code: string, message: string, details?: any) {
  const body: ErrorResponse = {
    error: { code, message, details },
  };
  return NextResponse.json(body, { status: 400 });
}

export async function POST(req: NextRequest) {
  let payload: unknown;

  try {
    payload = await req.json();
  } catch {
    return badRequest('BAD_REQUEST', 'Invalid JSON body');
  }

  const body = payload as Partial<LeadCreatePayload>;

  // formId robust parsen (Zahl oder String)
  const formIdRaw = (body as any)?.formId;
  const formId = Number(formIdRaw);

  if (!Number.isFinite(formId)) {
    return badRequest('BAD_REQUEST', 'formId is required and must be a number');
  }

  if (!Array.isArray(body.values) || body.values.length === 0) {
    return badRequest(
      'VALIDATION_ERROR',
      'values must be a non-empty array',
    );
  }

  // Values grob validieren
  const values: LeadCreateValueInput[] = body.values.map((v) => ({
    fieldKey: String((v as any).fieldKey ?? ''),
    value: String((v as any).value ?? ''),
  }));

  if (values.some((v) => !v.fieldKey)) {
    return badRequest(
      'VALIDATION_ERROR',
      'Each value must have a non-empty fieldKey',
    );
  }

  try {
    // Formular + Felder holen
    const form = await prisma.form.findUnique({
      where: { id: formId },
      include: { fields: true },
    });

    if (!form) {
      return NextResponse.json(
        {
          error: {
            code: 'FORM_NOT_FOUND',
            message: `Form with id ${formId} not found`,
          },
        },
        { status: 404 },
      );
    }

    // Map fieldKey -> FormField
    const fieldByKey = new Map(
      form.fields.map((field) => [field.key, field]),
    );

    // Unbekannte fieldKeys sammeln
    const unknownFieldKeys = values
      .filter((v) => !fieldByKey.has(v.fieldKey))
      .map((v) => v.fieldKey);

    if (unknownFieldKeys.length > 0) {
      return badRequest(
        'UNKNOWN_FIELD_KEY',
        'One or more fieldKeys are not defined for this form',
        { unknownFieldKeys },
      );
    }

    // Pflichtfelder prüfen
    const missingRequired = form.fields
      .filter((f) => f.required)
      .filter((f) => {
        const matching = values.find((v) => v.fieldKey === f.key);
        return !matching || !matching.value || matching.value.trim().length === 0;
      })
      .map((f) => f.key);

    if (missingRequired.length > 0) {
      return badRequest(
        'MISSING_REQUIRED_FIELD',
        'One or more required fields are missing or empty',
        { missingRequired },
      );
    }

    // eventId & capturedByUserId optional parsen
    const eventIdRaw = (body as any)?.eventId;
    const eventId =
      typeof eventIdRaw === 'number' || typeof eventIdRaw === 'string'
        ? Number(eventIdRaw)
        : undefined;

    const capturedByUserIdRaw = (body as any)?.capturedByUserId;
    const capturedByUserId =
      typeof capturedByUserIdRaw === 'number' ||
      typeof capturedByUserIdRaw === 'string'
        ? Number(capturedByUserIdRaw)
        : undefined;

    // Lead + LeadValues anlegen (nested create)
    const lead = await prisma.lead.create({
      data: {
        formId,
        eventId: eventId ?? null,
        capturedByUserId: capturedByUserId ?? null,
        values: {
          create: values.map((v) => {
            const field = fieldByKey.get(v.fieldKey)!;
            return {
              fieldId: field.id,
              value: v.value,
            };
          }),
        },
      },
      include: {
        form: {
          select: {
            id: true,
            name: true,
          },
        },
        event: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        lead: {
          id: lead.id,
          formId: lead.formId,
          eventId: lead.eventId,
          capturedByUserId: lead.capturedByUserId,
          createdAt: lead.createdAt.toISOString(),
          form: lead.form,
          event: lead.event,
        },
        summary: {
          fieldCount: values.length,
          requiredFieldsMissing: 0,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('POST /api/leads failed', error);

    return NextResponse.json(
      {
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to create lead',
        },
      },
      { status: 500 },
    );
  }
}
