import { NextRequest, NextResponse } from 'next/server';
import Agenda from '@/models/Agenda';
import AgendaLampiran from '@/models/AgendaLampiran';
import {
  deleteUploadThingByUrl,
  deleteUploadThingManyByUrls,
  uploadManyToUploadThing,
  uploadOneToUploadThing,
} from '@/lib/uploadthing';

const MAX_FILE_SIZE = 10 * 1024 * 1024;

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

    const createdBy = Number(createdByRaw);

    const agenda = await Agenda.create({
      title, description, start, end, category,
      suratFileUrl,
      suratNamaFile: fileSurat.name,
      fileUrl: suratFileUrl,
      createdBy: Number.isFinite(createdBy) ? createdBy : null,
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
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan pada server.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
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
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan pada server.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
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
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan pada server.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}