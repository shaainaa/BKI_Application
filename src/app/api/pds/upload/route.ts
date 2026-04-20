import { NextResponse } from 'next/server';
// PENTING: Pastikan lokasi import model BuktiPds ini sudah benar sesuai foldermu!
import BuktiPds from '@/models/BuktiPDS'; 
import Pds from '@/models/Pds';
import { deleteUploadThingByUrl, uploadOneToUploadThing } from '@/lib/uploadthing';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const pdsId = formData.get('pdsId') as string;
    const kategori = formData.get('kategori') as string;
    const normalizedKategori = (kategori || '').toUpperCase().trim();
    const allowedKategori = ['SURVEY', 'FOTO', 'TRANSPORTASI', 'PENGINAPAN', 'LAINNYA'];

    if (!file || !pdsId || !kategori) {
      return NextResponse.json({ success: false, message: "Data tidak lengkap" }, { status: 400 });
    }

    if (!allowedKategori.includes(normalizedKategori)) {
      return NextResponse.json({ success: false, message: 'Kategori bukti tidak valid' }, { status: 400 });
    }

    const parsedPdsId = parseInt(pdsId, 10);

    const pds = await Pds.findByPk(parsedPdsId);
    if (!pds) {
      return NextResponse.json({ success: false, message: 'Data PDS tidak ditemukan' }, { status: 404 });
    }

    const pdsStatus = (pds.get('status') as string) || '';
    if (pdsStatus !== 'APPROVED') {
      return NextResponse.json({ success: false, message: 'Upload/edit bukti hanya diizinkan saat status APPROVED' }, { status: 400 });
    }

    const fileUrl = await uploadOneToUploadThing(file);

    const existingBuktiList = await BuktiPds.findAll({
      where: {
        pdsId: parsedPdsId,
        kategori: normalizedKategori,
      },
      order: [['updatedAt', 'DESC'], ['id', 'DESC']],
    });

    let savedBukti;

    if (existingBuktiList.length > 0) {
      const existingBukti = existingBuktiList[0];
      await deleteUploadThingByUrl(existingBukti.get('fileUrl') as string);
      savedBukti = await existingBukti.update({
        fileUrl: fileUrl,
        namaFile: file.name,
        kategori: normalizedKategori,
        verificationStatus: 'PENDING',
        verificationNotes: null,
        verifiedAt: null,
        verifiedBy: null,
      });

      // Bersihkan data duplikat lama agar status reject historis tidak mempengaruhi badge terbaru.
      const duplicates = existingBuktiList.slice(1);
      for (const duplicate of duplicates) {
        await deleteUploadThingByUrl(duplicate.get('fileUrl') as string);
      }
      if (duplicates.length > 0) {
        await BuktiPds.destroy({
          where: {
            id: duplicates.map((item) => item.get('id')),
            pdsId: parsedPdsId,
          },
        });
      }
    } else {
      savedBukti = await BuktiPds.create({
        pdsId: parsedPdsId,
        kategori: normalizedKategori,
        fileUrl: fileUrl,
        namaFile: file.name,
        verificationStatus: 'PENDING',
      });
    }
    return NextResponse.json({ success: true, message: "File berhasil diupload dan disimpan di database!", data: savedBukti });
  } catch (error: unknown) {
    console.error("❌ === ERROR TERJADI DI SERVER === ❌", error);
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan pada server.';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const pdsId = Number(body?.pdsId);

    if (!pdsId) {
      return NextResponse.json({ success: false, message: 'pdsId wajib diisi' }, { status: 400 });
    }

    const pds = await Pds.findByPk(pdsId);
    if (!pds) {
      return NextResponse.json({ success: false, message: 'Data PDS tidak ditemukan' }, { status: 404 });
    }

    const pdsStatus = (pds.get('status') as string) || '';
    if (pdsStatus !== 'APPROVED') {
      return NextResponse.json({ success: false, message: 'Submit bukti hanya bisa dari status APPROVED' }, { status: 400 });
    }

    const buktiCount = await BuktiPds.count({ where: { pdsId } });
    if (buktiCount === 0) {
      return NextResponse.json({ success: false, message: 'Minimal upload 1 bukti sebelum submit' }, { status: 400 });
    }

    // Saat submit ulang, hanya bukti yang sebelumnya DIREJECT yang dikembalikan ke antrean verifikasi.
    await BuktiPds.update(
      {
        verificationStatus: 'PENDING',
        verificationNotes: null,
        verifiedAt: null,
        verifiedBy: null,
      },
      {
        where: {
          pdsId,
          verificationStatus: 'DIREJECT',
        },
      }
    );

    await pds.update({
      status: 'SUBMITTED',
      buktiSubmittedAt: new Date(),
    });

    return NextResponse.json({ success: true, message: 'Bukti berhasil disubmit ke admin untuk diverifikasi' });
  } catch (error: unknown) {
    console.error('Submit bukti gagal:', error);
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan pada server.';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}