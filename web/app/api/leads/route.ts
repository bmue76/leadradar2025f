import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { CreateLeadRequest } from '@/lib/api-types';
import type { Prisma } from '@prisma/client';
import {
  isMailEnabled,
  sendLeadNotifyMail,
  sendThankYouMail,
  type LeadNotifyMailValue,
} from '@/lib/mail';

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

type MailStatus =
  | { status: 'disabled'; reason?: string }
  | { status: 'ok' }
  | { status: 'partial'; error?: string }
  | { status: 'error'; error?: string };

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

    // -----------------------------
    // Mail-Handling (neu in 4.1)
    // -----------------------------
    let mailStatus: MailStatus = { status: 'disabled' };

    try {
      mailStatus = await handleLeadMails({
        lead,
        form,
        values: values as Record<string, unknown>,
      });
    } catch (error) {
      console.error('[mail] Fehler in handleLeadMails:', error);
      mailStatus = { status: 'error', error: 'handler-exception' };
    }

    return Response.json(
      {
        id: lead.id,
        formId: lead.formId,
        createdAt: lead.createdAt.toISOString(),
        mailStatus,
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

// -----------------------------------------------------------------------------
// Mail-Helfer
// -----------------------------------------------------------------------------

type LeadMailContext = {
  lead: any; // Prisma Lead (mindestens id, createdAt)
  form: any; // Prisma Form inkl. fields
  values: Record<string, unknown>; // Originalwerte aus dem Request
};

/**
 * Versucht nach einer erfolgreichen Lead-Erfassung die Danke-Mail (Besucher)
 * und die Innendienst-Mail zu versenden. Fehler werden geloggt, der API-Call
 * schlägt aber trotzdem nicht fehl.
 */
async function handleLeadMails({ lead, form, values }: LeadMailContext): Promise<MailStatus> {
  if (!isMailEnabled()) {
    return { status: 'disabled' };
  }

  const email = extractEmailFromValues(values);
  const visitorName = extractNameFromValues(values);
  const companyName = extractCompanyFromValues(values);

  const valuesForNotify: LeadNotifyMailValue[] = Array.isArray(form.fields)
    ? form.fields.map((field: any) => {
        const key = String(field.key ?? '');
        const label =
          field.label ??
          field.name ??
          key;

        const rawValue = values[key];
        let valueString: string | null;

        if (rawValue == null) {
          valueString = null;
        } else if (typeof rawValue === 'string') {
          valueString = rawValue;
        } else {
          valueString = String(rawValue);
        }

        return {
          label,
          value: valueString,
        };
      })
    : [];

  const formName: string | null =
    form.name ??
    form.title ??
    null;

  // Aktuell kein Event-Kontext im Endpoint – optional später ergänzbar
  const eventName: string | null = null;

  const createdAt: Date = lead.createdAt ? new Date(lead.createdAt) : new Date();

  const tasks: Array<Promise<{ kind: 'thankYou' | 'notify'; ok: boolean }>> = [];

  if (email) {
    tasks.push(
      sendThankYouMail({
        to: email,
        leadId: Number(lead.id),
        formName,
        eventName,
        visitorName,
        companyName,
      }).then((res) => {
        if (!res.ok) {
          console.warn('[mail] Danke-Mail fehlgeschlagen', res.error);
        }
        return { kind: 'thankYou', ok: res.ok };
      }),
    );
  }

  const hasNotifyAddress = !!process.env.MAIL_LEADS_NOTIFY;
  if (hasNotifyAddress) {
    tasks.push(
      sendLeadNotifyMail({
        leadId: Number(lead.id),
        formName,
        eventName,
        createdAt,
        values: valuesForNotify,
      }).then((res) => {
        if (!res.ok) {
          console.warn('[mail] Innendienst-Mail fehlgeschlagen', res.error);
        }
        return { kind: 'notify', ok: res.ok };
      }),
    );
  }

  if (tasks.length === 0) {
    return {
      status: 'disabled',
      reason:
        'Kein Empfänger verfügbar (keine Besucher-E-Mail und keine MAIL_LEADS_NOTIFY).',
    };
  }

  try {
    const results = await Promise.all(tasks);
    const failed = results.filter((r) => !r.ok);

    if (failed.length === 0) {
      return { status: 'ok' };
    }

    if (failed.length === results.length) {
      return { status: 'error', error: 'all-failed' };
    }

    return { status: 'partial', error: 'partial-failure' };
  } catch (error) {
    console.error('[mail] Unerwarteter Fehler beim Mailversand:', error);
    return { status: 'error', error: 'unexpected-error' };
  }
}

// -----------------------------------------------------------------------------
// Feld-Auslese-Helfer (E-Mail, Name, Firma) für values-Objekt
// -----------------------------------------------------------------------------

function extractEmailFromValues(values: Record<string, unknown>): string | undefined {
  const candidates = ['email', 'e-mail', 'mail'];
  for (const [key, rawValue] of Object.entries(values)) {
    const normalizedKey = key.toLowerCase();
    if (!candidates.includes(normalizedKey)) continue;

    if (typeof rawValue === 'string' && rawValue.includes('@')) {
      return rawValue;
    }
  }
  return undefined;
}

function extractNameFromValues(values: Record<string, unknown>): string | undefined {
  let fullName: string | undefined;
  let firstName: string | undefined;
  let lastName: string | undefined;

  for (const [key, rawValue] of Object.entries(values)) {
    if (typeof rawValue !== 'string') continue;
    const value = rawValue.trim();
    if (!value) continue;

    const normalizedKey = key.toLowerCase();

    if (!fullName && (normalizedKey === 'name' || normalizedKey === 'kontaktperson')) {
      fullName = value;
    }

    if (!firstName && (normalizedKey === 'firstname' || normalizedKey === 'vorname')) {
      firstName = value;
    }

    if (
      !lastName &&
      (normalizedKey === 'lastname' ||
        normalizedKey === 'nachname' ||
        normalizedKey === 'surname')
    ) {
      lastName = value;
    }
  }

  if (fullName) return fullName;
  if (firstName || lastName) {
    return [firstName, lastName].filter(Boolean).join(' ');
  }
  return undefined;
}

function extractCompanyFromValues(values: Record<string, unknown>): string | undefined {
  for (const [key, rawValue] of Object.entries(values)) {
    if (typeof rawValue !== 'string') continue;
    const value = rawValue.trim();
    if (!value) continue;

    const normalizedKey = key.toLowerCase();

    if (
      normalizedKey === 'firma' ||
      normalizedKey === 'unternehmen' ||
      normalizedKey === 'company' ||
      normalizedKey === 'organisation'
    ) {
      return value;
    }
  }
  return undefined;
}
