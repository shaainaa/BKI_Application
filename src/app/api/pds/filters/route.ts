import { NextResponse } from 'next/server';
import Pds from '@/models/Pds';
import sequelize from '@/lib/db';

export async function GET() {
  try {
    // Ambil daftar lokasi unik
    const lokasi = await Pds.findAll({
      attributes: [[sequelize.fn('DISTINCT', sequelize.col('lokasi')), 'lokasi']],
      raw: true
    });

    // Ambil daftar keperluan unik
    const keperluan = await Pds.findAll({
      attributes: [[sequelize.fn('DISTINCT', sequelize.col('keperluan')), 'keperluan']],
      raw: true
    });

    return NextResponse.json({
      success: true,
      lokasi: lokasi.map((item: any) => item.lokasi).filter(Boolean),
      keperluan: keperluan.map((item: any) => item.keperluan).filter(Boolean)
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}