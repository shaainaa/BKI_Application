    import { NextRequest, NextResponse } from 'next/server';
    import  Pds  from '@/models/Pds';
    import { uploadOneToUploadThing } from '@/lib/uploadthing';
    import { requireAuth } from '@/lib/session';
    import { syncPdsToGoogleSheetQuietly } from '@/lib/pdsGoogleSheet';

    export async function POST(req: NextRequest) {
        try {
            const { auth, response } = await requireAuth(req);
            if (response || !auth) return response;

            const data = await req.formData();
            const userId = auth.user.id;
            const permohonan = ((data.get('permohonan') as string) || '').toUpperCase();
            const noAgenda = ((data.get('noAgenda') as string) || '').trim();
            const tglBerangkat = data.get('tglBerangkat') as string;
            const tglKembali = data.get('tglKembali') as string;

            if (!tglBerangkat || !tglKembali) {
                return NextResponse.json(
                    { success: false, message: 'tglBerangkat dan tglKembali wajib diisi' },
                    { status: 400 }
                );
            }

            const newStartDate = new Date(tglBerangkat);
            const newEndDate = new Date(tglKembali);

            if (Number.isNaN(newStartDate.getTime()) || Number.isNaN(newEndDate.getTime())) {
                return NextResponse.json(
                    { success: false, message: 'Format tanggal tidak valid' },
                    { status: 400 }
                );
            }

            if (newStartDate > newEndDate) {
                return NextResponse.json(
                    { success: false, message: 'Tanggal berangkat tidak boleh lebih besar dari tanggal kembali' },
                    { status: 400 }
                );
            }

            const existingReturnDateConflicts = await Pds.findAll({
                where: {
                    userId,
                    tglBerangkat: newStartDate,
                    tglKembali: newEndDate,
                },
            });

            const hasSameDateConflict = existingReturnDateConflicts.length > 0;
            const isAllowedLemburOnSameDate =
                permohonan === 'LEMBUR' &&
                noAgenda &&
                existingReturnDateConflicts.every((item) => String(item.get('noAgenda') || '').trim() !== noAgenda);

            if (hasSameDateConflict && !isAllowedLemburOnSameDate) {
                return NextResponse.json(
                    {
                        success: false,
                        message: 'Permohonan ditolak karena tanggal berangkat dan tanggal kembali sudah pernah diajukan. Lembur di tanggal yang sama hanya diizinkan jika nomor agenda berbeda.',
                    },
                    { status: 409 }
                );
            }

            const fileData = data.get('ttdDigitalUrl') as File;
            let ttdUrl = '';

            if (fileData && fileData.size > 0) {
                ttdUrl = await uploadOneToUploadThing(fileData);
            }
            const newPds = await Pds.create({
                userId,
                permohonan,
                tanggalPengajuan: new Date(),
                lokasi: data.get('lokasi'),
                keperluan: data.get('keperluan'),
                noAgenda,
                tglBerangkat,
                jamBerangkat: data.get('jamBerangkat') || null,
                tglKembali,
                jamKembali: data.get('jamKembali') || null,
                visitKe: data.get('visitKe'),
                keteranganVisit: (data.get('keteranganVisit') as string).toUpperCase(),
                ttdDigitalUrl: ttdUrl,
                status: 'PENDING'
            });

            await syncPdsToGoogleSheetQuietly('pds-create');

            return NextResponse.json({ success: true, pds: newPds });
            
        } catch (error: unknown) {
            console.error('Error processing PDS submission:', error);
            const message = error instanceof Error
                ? error.message
                : 'An error occurred while processing the PDS submission.';
            return NextResponse.json({ success: false, message }, { status: 500 });
        }
    }
