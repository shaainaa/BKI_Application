import { NextResponse, NextRequest } from 'next/server';
import Pds from '@/models/Pds';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
        return NextResponse.json({ success: false, message: 'Unauthorized'}, { status: 401});
    }


    const listPds = await Pds.findAll({
        where: { userId: userId },
        order: [['tanggalPengajuan', 'DESC']]
    });

    return NextResponse.json({ success: true, data: listPds });
  } catch (error:any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}