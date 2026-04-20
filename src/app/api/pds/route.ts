    import { NextRequest, NextResponse } from 'next/server';
    import  Pds  from '@/models/Pds';
    import { uploadOneToUploadThing } from '@/lib/uploadthing';

    export async function POST(req: NextRequest) {
        try {
            const data = await req.formData();

            const fileData = data.get('ttdDigitalUrl') as File;
            let ttdUrl = '';

            if (fileData && fileData.size > 0) {
                ttdUrl = await uploadOneToUploadThing(fileData);
            }
            const newPds = await Pds.create({
                userId: data.get('userId'),
                permohonan: (data.get('permohonan') as string).toUpperCase(),
                tanggalPengajuan: data.get('tanggalPengajuan') || undefined,
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
            
        } catch (error: unknown) {
            console.error('Error processing PDS submission:', error);
            const message = error instanceof Error
                ? error.message
                : 'An error occurred while processing the PDS submission.';
            return NextResponse.json({ success: false, message }, { status: 500 });
        }
    }