import { NextResponse, NextRequest } from 'next/server';
import Pds from '@/models/Pds';
import User from '@/models/User';
import BuktiPds from '@/models/BuktiPDS';
import { requireAuth } from '@/lib/session';
import { errorResponse } from '@/lib/apiError';

// GUNAKAN PENGECEKAN INI AGAR TIDAK DOUBLE ALIAS
if (!Pds.associations.user) {
  Pds.belongsTo(User, { foreignKey: 'userId', as: 'user' });
}
if (!Pds.associations.bukti) {
  Pds.hasMany(BuktiPds, { foreignKey: 'pdsId', as: 'bukti' });
}

export async function GET(req: NextRequest) {
  try {
    const { auth, response } = await requireAuth(req);
    if (response || !auth) return response;

    const { searchParams } = new URL(req.url);
    const status = (searchParams.get('status') || '').toUpperCase();

    const whereClause: Record<string, string | number> = { userId: auth.user.id };
    if (status) {
      whereClause.status = status;
    }

    const listPds = await Pds.findAll({
        where: whereClause,
        include: [
            {
                model: User,
                as: 'user', // Nama alias harus sama dengan yang di-define di belongsTo
                attributes: ['nama', 'email'], // Ambil kolom nama saja (atau email jika perlu)
            },
            {
                model: BuktiPds,
                as: 'bukti', 
                required: false, 
            }
        ],
        order: [['tanggalPengajuan', 'DESC']],
    });

    return NextResponse.json({ success: true, data: listPds });
  } catch (error: unknown) {
    console.error("Error fetching PDS with User:", error);
    return errorResponse(error, 'Gagal memuat daftar PDS.');
  }
}
