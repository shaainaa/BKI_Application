import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/session';
import { syncPdsToGoogleSheet } from '@/lib/pdsGoogleSheet';
import { errorResponse } from '@/lib/apiError';

export async function POST(req: Request) {
  try {
    const { response } = await requireAdmin(req);
    if (response) return response;

    const result = await syncPdsToGoogleSheet();
    return NextResponse.json({ success: true, ...result });
  } catch (error: unknown) {
    return errorResponse(error, 'Sinkronisasi Google Sheet gagal.');
  }
}
