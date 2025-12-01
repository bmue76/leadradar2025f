// web/app/api/admin/forms/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // params ist ein Promise → erst awaiten
  const { id: rawId } = await params;
  const id = Number(rawId);

  if (!Number.isFinite(id)) {
    return NextResponse.json(
      {
        error: {
          code: 'BAD_REQUEST',
          message: 'Invalid form id',
        },
      },
      { status: 400 },
    );
  }

  try {
    const form = await prisma.form.findUnique({
      where: { id },
      include: {
        fields: {
          orderBy: {
            id: 'asc',
          },
        },
      },
    });

    if (!form) {
      return NextResponse.json(
        {
          error: {
            code: 'NOT_FOUND',
            message: 'Form not found',
          },
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      item: form,
    });
  } catch (error) {
    console.error(`GET /api/admin/forms/${id} failed`, error);

    return NextResponse.json(
      {
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to load form',
        },
      },
      { status: 500 },
    );
  }
}
