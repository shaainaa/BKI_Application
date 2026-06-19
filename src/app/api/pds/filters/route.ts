import { NextRequest, NextResponse } from 'next/server';
import Pds from '@/models/Pds';
import sequelize from '@/lib/db';
import { requireAuth } from '@/lib/session';
import { errorResponse } from '@/lib/apiError';

type FilterRow = {
  lokasi?: string | null;
  keperluan?: string | null;
};

export async function GET(req: NextRequest) {
  try {
    const { response } = await requireAuth(req);
    if (response) return response;

    // Ambil daftar lokasi unik
    const lokasi = await Pds.findAll({
      attributes: [[sequelize.fn('DISTINCT', sequelize.col('lokasi')), 'lokasi']],
      raw: true
    }) as unknown as FilterRow[];

    // Ambil daftar keperluan unik
    const keperluan = await Pds.findAll({
      attributes: [[sequelize.fn('DISTINCT', sequelize.col('keperluan')), 'keperluan']],
      raw: true
    }) as unknown as FilterRow[];

    return NextResponse.json({
      success: true,
      lokasi: lokasi.map((item) => item.lokasi).filter(Boolean),
      keperluan: keperluan.map((item) => item.keperluan).filter(Boolean)
    });
  } catch (error: unknown) {
    return errorResponse(error, 'Gagal memuat filter PDS.');
  }
}
