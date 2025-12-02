import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { CreateLeadRequest } from '@/lib/api-types';
import type { Prisma } from '@prisma/client';

/**
 * POST /api/leads
 * Öffentlicher Endpoint zum Anlegen eines Leads.
 *
 * Erwarteter Body:
 * {
 *   "formId": 1,
 *   "values": {
 *     "firstName": "Beat",
 *     "lastName": "Müller",
 *     "email": "beat@example.com"
 *   }
 * }
 *
 * Werte werden über FormField.key aufgelöst.
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as CreateLeadRequest | null;

    if (!body || typeof body !== 'object') {
      return Response.json(
        { error: 'Invalid JSON body' },
        { status: 400 },
      );
    }

    const { formId, values } = body;

    if (
      typeof formId !== 'number' ||
      !Number.isInteger(formId) ||
      formId <= 0
    ) {
      return Response.json(
        { error: 'Field "formId" must be a positive integer' },
        { status: 400 },
      );
    }

    if (!values || typeof values !== 'object') {
      return Response.json(
        { error: 'Field "values" must be an object' },
        { status: 400 },
      );
    }

    const form = await prisma.form.findUnique({
      where: { id: formId },
      include: {
        fields: true,
      },
    });

    if (!form) {
      return Response.json(
        { error: 'Form not found' },
        { status: 404 },
      );
    }

    if (form.status === 'ARCHIVED') {
      return Response.json(
        { error: 'Form is archived and cannot accept new leads' },
        { status: 400 },
      );
    }

    // Unchecked-Variante, damit wir fieldId direkt setzen können.
    const leadValuesData: Prisma.LeadValueUncheckedCreateWithoutLeadInput[] =
      form.fields.map((field) => {
        const rawValue = (values as Record<string, unknown>)[field.key];

        let valueString: string;
        if (rawValue == null) {
          valueString = '';
        } else if (typeof rawValue === 'string') {
          valueString = rawValue;
        } else {
          valueString = String(rawValue);
        }

        return {
          fieldId: field.id,
          value: valueString,
        };
      });

    const lead = await prisma.lead.create({
      data: {
        formId: form.id,
        values: {
          create: leadValuesData,
        },
      },
    });

    return Response.json(
      {
        id: lead.id,
        formId: lead.formId,
        createdAt: lead.createdAt.toISOString(),
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Error creating lead', error);
    return Response.json(
      { error: 'Failed to create lead' },
      { status: 500 },
    );
  }
}
