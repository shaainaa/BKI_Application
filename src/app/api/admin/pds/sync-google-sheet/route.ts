import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/session';
import { syncPdsToGoogleSheet } from '@/lib/pdsGoogleSheet';

export async function POST(req: Request) {
  try {
    const { response } = await requireAdmin(req);
    if (response) return response;

    const result = await syncPdsToGoogleSheet();
    return NextResponse.json({ success: true, ...result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Sinkronisasi Google Sheet gagal.';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
