import { NextRequest, NextResponse } from 'next/server';
import { Pds } from '@/models';
import { writeFile} from 'fs/promises';
import path from 'path';

export async function POST(req: NextRequest) {
    try {
        const data = await req.json();

        const fileData = data.get('ttdDigitalUrl') as File;
        let ttdUrl = '';

        if (fileData) {
            const bytes = await fileData.arrayBuffer();
            const buffer = Buffer.from(bytes);

            const fileName = `${Date.now()}_${fileData.name}`;
            const filePath = path.join(process.cwd(), 'public', 'ttd', fileName);
            await writeFile(filePath, buffer);
            ttdUrl = `/ttd/${fileName}`;
        }
        const newPds = await Pds.create({
            userId: data.get('userId'),
            permohonan: data.get('permohonan'),
            lokasi: data.get('lokasi'),
            keperluan: data.get('keperluan'),
            noAgenda: data.get('noAgenda'),
            tglBerangkat: data.get('tglBerangkat'), 
            jamBerangkat: data.get('jamBerangkat'),
            tglKembali: data.get('tglKembali'),
            jamKembali: data.get('jamKembali'),
            visitKe: data.get('visitKe'),
            keteranganVisit: data.get(('keteranganVisit') as string).toUpperCase(),
            ttdDigitalUrl: ttdUrl,
            status: 'PENDING'
        });

        return NextResponse.json({ success: true, pds: newPds });
        
    } catch (error: any) {
        console.error('Error processing PDS submission:', error);
        return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
    }
}