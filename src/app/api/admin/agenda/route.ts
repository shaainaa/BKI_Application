import { NextRequest, NextResponse } from 'next/server';
import Agenda from '@/models/Agenda';
import AgendaLampiran from '@/models/AgendaLampiran';
import {
  deleteUploadThingByUrl,
  deleteUploadThingManyByUrls,
  uploadManyToUploadThing,
  uploadOneToUploadThing,
} from '@/lib/uploadthing';
import { requireAdmin } from '@/lib/session';
import { errorResponse } from '@/lib/apiError';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
let agendaSchemaReady: Promise<void> | null = null;

function ensureAgendaSchema() {
  agendaSchemaReady ??= (async () => {
    await Agenda.sync({ alter: true });
    await AgendaLampiran.sync({ alter: true });
  })();

  return agendaSchemaReady;
}

export async function POST(req: NextRequest) {
  try {
    const { auth, response } = await requireAdmin(req);
    if (response || !auth) return response;

    await ensureAgendaSchema();

    const formData = await req.formData();
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const start = formData.get('start') as string;
    const end = formData.get('end') as string;
    const category = formData.get('category') as string;
    const isPublicRaw = formData.get('isPublic') as string | null;
    const fileSurat = formData.get('fileSurat') as File | null;
    const lampiranFiles = formData.getAll('lampiranFiles').filter((item): item is File => item instanceof File);

    if (!fileSurat) {
      return NextResponse.json({ success: false, message: 'File surat wajib diunggah.' }, { status: 400 });
    }

    if (fileSurat.size > MAX_FILE_SIZE) {
      return NextResponse.json({ success: false, message: 'Ukuran file surat terlalu besar. Maksimal 5MB.' }, { status: 400 });
    }

    const suratFileUrl = await uploadOneToUploadThing(fileSurat);

    for (const lampiran of lampiranFiles) {
      if (lampiran.size > MAX_FILE_SIZE) {
        return NextResponse.json({ success: false, message: `Ukuran file lampiran ${lampiran.name} terlalu besar. Maksimal 5MB.` }, { status: 400 });
      }
    }

    const lampiranPayload: Array<{ name: string; url: string }> = [];
    const uploadedLampiranUrls = await uploadManyToUploadThing(lampiranFiles);

    for (let index = 0; index < lampiranFiles.length; index += 1) {
      const lampiran = lampiranFiles[index];
      lampiranPayload.push({
        name: lampiran.name,
        url: uploadedLampiranUrls[index],
      });
    }

    const agenda = await Agenda.create({
      title, description, start, end, category,
      isPublic: isPublicRaw === 'true',
      suratFileUrl,
      suratNamaFile: fileSurat.name,
      fileUrl: suratFileUrl,
      createdBy: auth.user.id,
    });

    const agendaId = Number(agenda.getDataValue('id'));

    if (lampiranPayload.length > 0) {
      await AgendaLampiran.bulkCreate(
        lampiranPayload.map((lampiran) => ({
          agendaId,
          namaFile: lampiran.name,
          urlFile: lampiran.url,
        }))
      );
    }

    return NextResponse.json({ success: true, data: agenda });
  } catch (error: unknown) {
    return errorResponse(error, 'Gagal menambah agenda.');
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { response } = await requireAdmin(req);
    if (response) return response;

    await ensureAgendaSchema();

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
    const isPublicRaw = formData.get('isPublic') as string | null;
    const fileSurat = formData.get('fileSurat') as File | null;
    const lampiranFiles = formData.getAll('lampiranFiles').filter((item): item is File => item instanceof File);

    if (!title || !start || !end || !category) {
      return NextResponse.json({ success: false, message: 'Data agenda belum lengkap.' }, { status: 400 });
    }

    let suratFileUrl = (agenda.getDataValue('suratFileUrl') as string | null) || null;
    let suratNamaFile = (agenda.getDataValue('suratNamaFile') as string | null) || null;
    let fileUrl = (agenda.getDataValue('fileUrl') as string | null) || null;

    if (fileSurat) {
      if (fileSurat.size > MAX_FILE_SIZE) {
        return NextResponse.json({ success: false, message: 'Ukuran file surat terlalu besar. Maksimal 5MB.' }, { status: 400 });
      }

      await deleteUploadThingByUrl(suratFileUrl || fileUrl);

      suratFileUrl = await uploadOneToUploadThing(fileSurat);
      suratNamaFile = fileSurat.name;
      fileUrl = suratFileUrl;
    }

    await agenda.update({
      title,
      description,
      start,
      end,
      category,
      isPublic: isPublicRaw === 'true',
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
      }

      const uploadedLampiranUrls = await uploadManyToUploadThing(lampiranFiles);

      for (let index = 0; index < lampiranFiles.length; index += 1) {
        const lampiran = lampiranFiles[index];

        lampiranPayload.push({
          agendaId: id,
          namaFile: lampiran.name,
          urlFile: uploadedLampiranUrls[index],
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
  } catch (error: unknown) {
    return errorResponse(error, 'Gagal memperbarui agenda.');
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { response } = await requireAdmin(req);
    if (response) return response;

    await ensureAgendaSchema();

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

    await deleteUploadThingManyByUrls(
      lampiranRows.map((lampiran) => (lampiran.getDataValue('urlFile') as string | null) || null)
    );
    await AgendaLampiran.destroy({ where: { agendaId: id } });

    await deleteUploadThingByUrl(
      (agenda.getDataValue('suratFileUrl') as string | null) ||
      (agenda.getDataValue('fileUrl') as string | null)
    );
    await agenda.destroy();

    return NextResponse.json({ success: true, message: 'Agenda berhasil dihapus.' });
  } catch (error: unknown) {
    return errorResponse(error, 'Gagal menghapus agenda.');
  }
}

export async function GET(req: NextRequest) {
  try {
    const { response } = await requireAdmin(req);
    if (response) return response;

    await ensureAgendaSchema();

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
  } catch (error: unknown) {
    return errorResponse(error, 'Gagal memuat agenda.');
  }
}
