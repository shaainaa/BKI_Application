import { NextResponse, NextRequest } from 'next/server';
import Pds from '@/models/Pds';
import User from '@/models/User';
import BuktiPds from '@/models/BuktiPDS';

// GUNAKAN PENGECEKAN INI AGAR TIDAK DOUBLE ALIAS
if (!Pds.associations.user) {
  Pds.belongsTo(User, { foreignKey: 'userId', as: 'user' });
}
if (!Pds.associations.bukti) {
  Pds.hasMany(BuktiPds, { foreignKey: 'pdsId', as: 'bukti' });
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
        return NextResponse.json({ success: false, message: 'Unauthorized'}, { status: 401});
    }

    const listPds = await Pds.findAll({
        where: { userId: userId },
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
  } catch (error: any) {
    console.error("Error fetching PDS with User:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}