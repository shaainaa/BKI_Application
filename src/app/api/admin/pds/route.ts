import { NextRequest, NextResponse } from 'next/server';
import Pds from '@/models/Pds';
import User from '@/models/User';
import BuktiPds from '@/models/BuktiPDS';

// --- SOLUSI AMPUH: PAKSA RELASI SETIAP KALI API DIPANGGIL ---
function applyAssociations() {
  if (!Pds.associations.user) {
    Pds.belongsTo(User, { foreignKey: 'userId', as: 'user' });
  }
  if (!Pds.associations.bukti) {
    Pds.hasMany(BuktiPds, { foreignKey: 'pdsId', as: 'bukti' });
  }
}

export async function GET() {
  try {
    // Panggil fungsi relasi dulu
    applyAssociations();

    const allPds = await Pds.findAll({
      order: [['id', 'DESC']], // Gunakan ID dulu untuk tes
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'nama', 'email'],
          required: false,
        },
        {
          model: BuktiPds,
          as: 'bukti',
          required: false,
        }
      ]
    });

    return NextResponse.json({ success: true, data: allPds });
  } catch (error: any) {
    console.error("Error Get Admin PDS:", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      id,
      status,
      nominal,
      sps,
      so,
      nomorPdsTrans,
      statusPembayaran,
      tanggalPembayaran,
    } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID PDS wajib diisi' }, { status: 400 });
    }

    const updatePayload: Record<string, any> = {};

    if (typeof status !== 'undefined') updatePayload.status = status;
    if (typeof nominal !== 'undefined') updatePayload.nominalPDS = nominal;
    if (typeof sps !== 'undefined') updatePayload.sps = sps;
    if (typeof so !== 'undefined') updatePayload.so = so;
    if (typeof nomorPdsTrans !== 'undefined') updatePayload.nomorPdsTrans = nomorPdsTrans;
    if (typeof statusPembayaran !== 'undefined') updatePayload.statusPembayaran = statusPembayaran;
    if (typeof tanggalPembayaran !== 'undefined') updatePayload.tanggalPembayaran = tanggalPembayaran;

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json({ success: false, error: 'Tidak ada data yang diubah' }, { status: 400 });
    }

    await Pds.update(updatePayload, { where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}