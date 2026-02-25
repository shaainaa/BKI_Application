    import { NextRequest, NextResponse } from 'next/server';
    import  Pds  from '@/models/Pds';
    import { writeFile, mkdir} from 'fs/promises';
    import path from 'path';

    export async function POST(req: NextRequest) {
        try {
            const data = await req.formData();

            const fileData = data.get('ttdDigitalUrl') as File;
            let ttdUrl = '';

            if (fileData && fileData.size > 0) {
                const bytes = await fileData.arrayBuffer();
                const buffer = Buffer.from(bytes);

                const uploadDir = path.join(process.cwd(), 'public', 'uploads');
                await mkdir(uploadDir, { recursive: true });

                const fileName = `${Date.now()}_${fileData.name.replace(/\s+/g, '_')}`;
                const filePath = path.join(uploadDir, fileName);
                
                await writeFile(filePath, buffer);
                ttdUrl = `/uploads/${fileName}`;
            }
            const newPds = await Pds.create({
                userId: data.get('userId'),
                permohonan: data.get('permohonan'),
                lokasi: data.get('lokasi'),
                keperluan: data.get('keperluan'),
                noAgenda: data.get('noAgenda'),
                tglBerangkat: data.get('tglBerangkat'), 
                jamBerangkat: data.get('jamBerangkat') || null,
                tglKembali: data.get('tglKembali'),
                jamKembali: data.get('jamKembali') || null,
                visitKe: data.get('visitKe'),
                keteranganVisit: (data.get('keteranganVisit') as string).toUpperCase(),
                ttdDigitalUrl: ttdUrl,
                status: 'PENDING'
            });

            return NextResponse.json({ success: true, pds: newPds });
            
        } catch (error: any) {
            console.error('Error processing PDS submission:', error);
            return NextResponse.json({ success: false, message: error.message || 'An error occurred while processing the PDS submission.' }, { status: 500 });
        }
    }