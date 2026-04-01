import { NextResponse } from 'next/server';
import sequelize from '@/lib/db'; 
import Pds from '@/models/Pds'; 
import User from '@/models/User'; 
import BuktiPds from '@/models/BuktiPDS';
import Agenda from '@/models/Agenda';
import AgendaLampiran from '@/models/AgendaLampiran';

export async function GET() {
  try {
    await sequelize.sync({ alter: true }); 
    
    return NextResponse.json({ 
      success: true, 
      message: "Berhasil! Tabel BuktiPds (dan tabel lainnya) sudah tersinkronisasi dengan database SQL." 
    });
  } catch (error: any) {
    console.error("Gagal sync database:", error);
    return NextResponse.json({ 
      success: false, 
      message: "Waduh, gagal sync. Cek console terminalmu ya.", 
      error: error.message 
    }, { status: 500 });
  }
}

