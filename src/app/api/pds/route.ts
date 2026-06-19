    import { NextRequest, NextResponse } from 'next/server';
    import  Pds  from '@/models/Pds';
    import { uploadOneToUploadThing } from '@/lib/uploadthing';
    import { requireAuth } from '@/lib/session';
    import { syncPdsToGoogleSheetQuietly } from '@/lib/pdsGoogleSheet';
    import { errorResponse, validationError } from '@/lib/apiError';

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
            const visitKeRaw = data.get('visitKe');
            const visitKe = Number(visitKeRaw);

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

            if (!visitKeRaw || !Number.isInteger(visitKe) || visitKe <= 0) {
                return validationError('Visit Ke wajib diisi dengan angka lebih dari 0.', 'visitKe');
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
                visitKe,
                keteranganVisit: (data.get('keteranganVisit') as string).toUpperCase(),
                ttdDigitalUrl: ttdUrl,
                status: 'PENDING'
            });

            await syncPdsToGoogleSheetQuietly('pds-create');

            return NextResponse.json({ success: true, pds: newPds });
            
        } catch (error: unknown) {
            console.error('Error processing PDS submission:', error);
            return errorResponse(error, 'Gagal mengirim permohonan PDS.');
        }
    }
