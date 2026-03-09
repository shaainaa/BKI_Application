import { NextRequest, NextResponse } from 'next/server';
import Pds from '@/models/Pds';
import User from '@/models/User';

export async function PATCH(req: NextRequest) {
  try {
    const { id, status } = await req.json();

    if (!id || !status) {
      return NextResponse.json({ success: false, message: "ID dan Status wajib diisi" }, { status: 400 });
    }

    // Update status di database 
    const updatedPds = await Pds.update(
      { status: status },
      { where: { id: id } }
    );

    if (updatedPds[0] === 0) {
      return NextResponse.json({ success: false, message: "Data tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: `Status berhasil diubah menjadi ${status}` });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// API untuk mengambil SEMUA data PDS (Monitoring Admin)
export async function GET() {
  try {
    const allPds = await Pds.findAll({
      where: {},  
      order: [['tanggalPengajuan', 'DESC']],
      include: [
        {
          model: User,
          as: 'user', // Sesuaikan dengan nama alias relasi kamu (baca poin 2)
          attributes: ['id', 'nama', 'email'],
          required: false, // Opsional: Pilih kolom yang mau diambil agar performa lebih ringan
        }
      ]
      // Opsional: Jika relasi User sudah di-set di models/index.ts, gunakan include
      // include: [{ model: User, attributes: ['nama', 'email'] }] 
    });
    return NextResponse.json({ success: true, data: allPds });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
