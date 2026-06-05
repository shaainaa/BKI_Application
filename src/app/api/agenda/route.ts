import { NextRequest, NextResponse } from 'next/server';
import Agenda from '@/models/Agenda';
import AgendaLampiran from '@/models/AgendaLampiran';
import { requireAuth } from '@/lib/session';

export async function GET(req: NextRequest) {
  try {
    const { response } = await requireAuth(req);
    if (response) return response;

    const data = await Agenda.findAll({
      where: { isPublic: true },
      include: [
        {
          model: AgendaLampiran,
          as: 'lampiranList',
          attributes: ['id', 'namaFile', 'urlFile'],
          required: false,
        },
      ],
      order: [['start', 'ASC']],
    });

    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan pada server.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
