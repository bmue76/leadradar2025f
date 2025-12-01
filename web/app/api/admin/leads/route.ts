// web/app/api/admin/leads/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { LeadSummaryDto } from '@/lib/api-types';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const formIdParam = searchParams.get('formId');
  let formId: number | undefined;

  if (formIdParam !== null) {
    const parsed = Number(formIdParam);
    if (!Number.isFinite(parsed)) {
      return NextResponse.json(
        {
          error: {
            code: 'BAD_REQUEST',
            message: 'Invalid formId query parameter',
          },
        },
        { status: 400 },
      );
    }
    formId = parsed;
  }

  try {
    const leads = await prisma.lead.findMany({
      where: formId ? { formId } : undefined,
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
      orderBy: {
        createdAt: 'desc',
      },
      take: 100, // einfacher Default-Limit
    });

    const items: LeadSummaryDto[] = leads.map((lead) => ({
      id: lead.id,
      formId: lead.formId,
      eventId: lead.eventId ?? undefined,
      capturedByUserId: lead.capturedByUserId ?? undefined,
      createdAt: lead.createdAt.toISOString(),
      formName: lead.form?.name ?? null,
      eventName: lead.event?.name ?? null,
    }));

    return NextResponse.json({ items });
  } catch (error) {
    console.error('GET /api/admin/leads failed', error);

    return NextResponse.json(
      {
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to load leads',
        },
      },
      { status: 500 },
    );
  }
}
