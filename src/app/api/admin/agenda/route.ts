import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import Agenda from '@/models/Agenda';

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

    if (fileSurat.size > 5 * 1024 * 1024) {
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
      if (lampiran.size > 5 * 1024 * 1024) {
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
      lampiranFiles: lampiranPayload.length > 0 ? JSON.stringify(lampiranPayload) : null,
      fileUrl: suratFileUrl,
      createdBy: Number.isFinite(createdBy) ? createdBy : null,
    });

    return NextResponse.json({ success: true, data: agenda });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const data = await Agenda.findAll({ order: [['start', 'ASC']] });
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}