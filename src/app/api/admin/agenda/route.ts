import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir, unlink } from 'fs/promises';
import path from 'path';
import Agenda from '@/models/Agenda';
import AgendaLampiran from '@/models/AgendaLampiran';

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const toPublicPath = (fileUrl?: string | null) => {
  if (!fileUrl) return null;
  if (!fileUrl.startsWith('/')) return null;
  return path.join(process.cwd(), 'public', fileUrl.replace(/^\/+/, '').replace(/\//g, path.sep));
};

const safeUnlink = async (fileUrl?: string | null) => {
  try {
    const filePath = toPublicPath(fileUrl);
    if (filePath) await unlink(filePath);
  } catch {
    // Ignore file delete failures to avoid blocking DB updates.
  }
};

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const start = formData.get('start') as string;
    const end = formData.get('end') as string;
    const category = formData.get('category') as string;
    const createdByRaw = formData.get('createdBy') as string;
    const fileSurat = formData.get('fileSurat') as File | null;
    const lampiranFiles = formData.getAll('lampiranFiles').filter((item): item is File => item instanceof File);

    if (!fileSurat) {
      return NextResponse.json({ success: false, message: 'File surat wajib diunggah.' }, { status: 400 });
    }

    if (fileSurat.size > MAX_FILE_SIZE) {
      return NextResponse.json({ success: false, message: 'Ukuran file surat terlalu besar. Maksimal 5MB.' }, { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), 'public/uploads/agendas');
    await mkdir(uploadDir, { recursive: true });

    const suratBuffer = Buffer.from(await fileSurat.arrayBuffer());
    const suratFilename = `${Date.now()}_surat_${fileSurat.name.replace(/\s+/g, '_')}`;
    await writeFile(path.join(uploadDir, suratFilename), suratBuffer);
    const suratFileUrl = `/uploads/agendas/${suratFilename}`;

    const lampiranPayload: Array<{ name: string; url: string }> = [];
    for (const lampiran of lampiranFiles) {
      if (lampiran.size > MAX_FILE_SIZE) {
        return NextResponse.json({ success: false, message: `Ukuran file lampiran ${lampiran.name} terlalu besar. Maksimal 5MB.` }, { status: 400 });
      }

      const lampiranBuffer = Buffer.from(await lampiran.arrayBuffer());
      const lampiranFilename = `${Date.now()}_lampiran_${lampiran.name.replace(/\s+/g, '_')}`;
      await writeFile(path.join(uploadDir, lampiranFilename), lampiranBuffer);

      lampiranPayload.push({
        name: lampiran.name,
        url: `/uploads/agendas/${lampiranFilename}`,
      });
    }

    const createdBy = Number(createdByRaw);

    const agenda = await Agenda.create({
      title, description, start, end, category,
      suratFileUrl,
      suratNamaFile: fileSurat.name,
      fileUrl: suratFileUrl,
      createdBy: Number.isFinite(createdBy) ? createdBy : null,
    });

    if (lampiranPayload.length > 0) {
      await AgendaLampiran.bulkCreate(
        lampiranPayload.map((lampiran) => ({
          agendaId: (agenda as any).id,
          namaFile: lampiran.name,
          urlFile: lampiran.url,
        }))
      );
    }

    return NextResponse.json({ success: true, data: agenda });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const idRaw = req.nextUrl.searchParams.get('id');
    const id = Number(idRaw);

    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json({ success: false, message: 'ID agenda tidak valid.' }, { status: 400 });
    }

    const agenda = await Agenda.findByPk(id);
    if (!agenda) {
      return NextResponse.json({ success: false, message: 'Agenda tidak ditemukan.' }, { status: 404 });
    }

    const formData = await req.formData();
    const title = (formData.get('title') as string) || '';
    const description = (formData.get('description') as string) || '';
    const start = (formData.get('start') as string) || '';
    const end = (formData.get('end') as string) || '';
    const category = (formData.get('category') as string) || '';
    const fileSurat = formData.get('fileSurat') as File | null;
    const lampiranFiles = formData.getAll('lampiranFiles').filter((item): item is File => item instanceof File);

    if (!title || !start || !end || !category) {
      return NextResponse.json({ success: false, message: 'Data agenda belum lengkap.' }, { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), 'public/uploads/agendas');
    await mkdir(uploadDir, { recursive: true });

    let suratFileUrl = (agenda as any).suratFileUrl as string | null;
    let suratNamaFile = (agenda as any).suratNamaFile as string | null;
    let fileUrl = (agenda as any).fileUrl as string | null;

    if (fileSurat) {
      if (fileSurat.size > MAX_FILE_SIZE) {
        return NextResponse.json({ success: false, message: 'Ukuran file surat terlalu besar. Maksimal 5MB.' }, { status: 400 });
      }

      const suratBuffer = Buffer.from(await fileSurat.arrayBuffer());
      const suratFilename = `${Date.now()}_surat_${fileSurat.name.replace(/\s+/g, '_')}`;
      await writeFile(path.join(uploadDir, suratFilename), suratBuffer);

      await safeUnlink(suratFileUrl || fileUrl);

      suratFileUrl = `/uploads/agendas/${suratFilename}`;
      suratNamaFile = fileSurat.name;
      fileUrl = suratFileUrl;
    }

    await agenda.update({
      title,
      description,
      start,
      end,
      category,
      suratFileUrl,
      suratNamaFile,
      fileUrl,
    });

    if (lampiranFiles.length > 0) {
      const lampiranPayload: Array<{ agendaId: number; namaFile: string; urlFile: string }> = [];

      for (const lampiran of lampiranFiles) {
        if (lampiran.size > MAX_FILE_SIZE) {
          return NextResponse.json({ success: false, message: `Ukuran file lampiran ${lampiran.name} terlalu besar. Maksimal 5MB.` }, { status: 400 });
        }

        const lampiranBuffer = Buffer.from(await lampiran.arrayBuffer());
        const lampiranFilename = `${Date.now()}_lampiran_${lampiran.name.replace(/\s+/g, '_')}`;
        await writeFile(path.join(uploadDir, lampiranFilename), lampiranBuffer);

        lampiranPayload.push({
          agendaId: id,
          namaFile: lampiran.name,
          urlFile: `/uploads/agendas/${lampiranFilename}`,
        });
      }

      await AgendaLampiran.bulkCreate(lampiranPayload);
    }

    const updatedAgenda = await Agenda.findByPk(id, {
      include: [
        {
          model: AgendaLampiran,
          as: 'lampiranList',
          attributes: ['id', 'namaFile', 'urlFile'],
          required: false,
        },
      ],
    });

    return NextResponse.json({ success: true, data: updatedAgenda });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const idRaw = req.nextUrl.searchParams.get('id');
    const id = Number(idRaw);

    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json({ success: false, message: 'ID agenda tidak valid.' }, { status: 400 });
    }

    const agenda = await Agenda.findByPk(id);
    if (!agenda) {
      return NextResponse.json({ success: false, message: 'Agenda tidak ditemukan.' }, { status: 404 });
    }

    const lampiranRows = await AgendaLampiran.findAll({
      where: { agendaId: id },
      attributes: ['id', 'urlFile'],
    });

    await Promise.all(lampiranRows.map((lampiran: any) => safeUnlink(lampiran.urlFile)));
    await AgendaLampiran.destroy({ where: { agendaId: id } });

    await safeUnlink((agenda as any).suratFileUrl || (agenda as any).fileUrl);
    await agenda.destroy();

    return NextResponse.json({ success: true, message: 'Agenda berhasil dihapus.' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const data = await Agenda.findAll({
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
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}