// web/app/api/health/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // einfacher DB-Check
    await prisma.form.count();

    return NextResponse.json({
      status: 'ok',
      db: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Healthcheck failed', error);

    return NextResponse.json(
      {
        error: {
          code: 'DB_ERROR',
          message: 'Database connection failed',
        },
      },
      { status: 500 },
    );
  }
}
