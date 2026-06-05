import { NextRequest, NextResponse } from 'next/server';
import Agenda from '@/models/Agenda';

export async function GET(req: NextRequest) {
  try {
    const userIdRaw = req.nextUrl.searchParams.get('userId');
    const userId = Number(userIdRaw);

    if (!Number.isFinite(userId) || userId <= 0) {
      return NextResponse.json({ success: false, message: 'userId tidak valid.' }, { status: 400 });
    }

    const data = await Agenda.findAll({
      where: { createdBy: userId, isPublic: false },
      order: [['start', 'ASC']],
    });

    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan pada server.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const userId = Number(body?.userId);

    if (!Number.isFinite(userId) || userId <= 0) {
      return NextResponse.json({ success: false, message: 'userId tidak valid.' }, { status: 400 });
    }

    const title = (body?.title as string) || '';
    const description = (body?.description as string) || '';
    const start = (body?.start as string) || '';
    const end = (body?.end as string) || '';
    const category = (body?.category as string) || 'LAINNYA';

    if (!title || !start || !end) {
      return NextResponse.json({ success: false, message: 'Data agenda belum lengkap.' }, { status: 400 });
    }

    const agenda = await Agenda.create({
      title,
      description,
      start,
      end,
      category,
      createdBy: userId,
      isPublic: false,
      suratFileUrl: null,
      suratNamaFile: null,
      fileUrl: null,
      lampiranFiles: null,
    });

    return NextResponse.json({ success: true, data: agenda });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan pada server.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const idRaw = req.nextUrl.searchParams.get('id');
    const id = Number(idRaw);

    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json({ success: false, message: 'ID agenda tidak valid.' }, { status: 400 });
    }

    const body = await req.json();
    const userId = Number(body?.userId);

    if (!Number.isFinite(userId) || userId <= 0) {
      return NextResponse.json({ success: false, message: 'userId tidak valid.' }, { status: 400 });
    }

    const agenda = await Agenda.findByPk(id);
    if (!agenda) {
      return NextResponse.json({ success: false, message: 'Agenda tidak ditemukan.' }, { status: 404 });
    }

    if (agenda.get('createdBy') !== userId) {
      return NextResponse.json({ success: false, message: 'Tidak memiliki akses.' }, { status: 403 });
    }

    const title = (body?.title as string) || '';
    const description = (body?.description as string) || '';
    const start = (body?.start as string) || '';
    const end = (body?.end as string) || '';
    const category = (body?.category as string) || 'LAINNYA';

    if (!title || !start || !end) {
      return NextResponse.json({ success: false, message: 'Data agenda belum lengkap.' }, { status: 400 });
    }

    await agenda.update({
      title,
      description,
      start,
      end,
      category,
    });

    return NextResponse.json({ success: true, data: agenda });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan pada server.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const idRaw = req.nextUrl.searchParams.get('id');
    const userIdRaw = req.nextUrl.searchParams.get('userId');
    const id = Number(idRaw);
    const userId = Number(userIdRaw);

    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json({ success: false, message: 'ID agenda tidak valid.' }, { status: 400 });
    }

    if (!Number.isFinite(userId) || userId <= 0) {
      return NextResponse.json({ success: false, message: 'userId tidak valid.' }, { status: 400 });
    }

    const agenda = await Agenda.findByPk(id);
    if (!agenda) {
      return NextResponse.json({ success: false, message: 'Agenda tidak ditemukan.' }, { status: 404 });
    }

    if (agenda.get('createdBy') !== userId) {
      return NextResponse.json({ success: false, message: 'Tidak memiliki akses.' }, { status: 403 });
    }

    await agenda.destroy();

    return NextResponse.json({ success: true, message: 'Agenda pribadi berhasil dihapus.' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan pada server.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
