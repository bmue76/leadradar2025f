// web/app/api/admin/forms/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const forms = await prisma.form.findMany({
      include: {
        fields: {
          // hier kein "position" mehr, sondern id
          orderBy: {
            id: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      items: forms,
    });
  } catch (error) {
    console.error('GET /api/admin/forms failed', error);

    return NextResponse.json(
      {
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to load forms',
        },
      },
      { status: 500 },
    );
  }
}
