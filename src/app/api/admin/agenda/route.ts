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
    const file = formData.get('file') as File | null;

    let fileUrl = '';
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // Batasi ukuran file 5MB
        return NextResponse.json({ success: false, message: 'Ukuran file terlalu besar. Maksimal 5MB.' }, { status: 400 });
      }
      
      const buffer = Buffer.from(await file.arrayBuffer());
      const filename = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
      const uploadDir = path.join(process.cwd(), 'public/uploads/agendas');
      
      await mkdir(uploadDir, { recursive: true });
      await writeFile(path.join(uploadDir, filename), buffer);
      fileUrl = `/uploads/agendas/${filename}`;
    }

    const agenda = await Agenda.create({
      title, description, start, end, category,
      fileUrl: fileUrl || null,
      color: category === 'URGENT' ? '#ef4444' : '#0A8E9A'
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