import { NextRequest, NextResponse } from 'next/server';
import { QueryTypes } from 'sequelize';
import sequelize from '@/lib/db';
import { requireAdmin } from '@/lib/session';
import { ensurePiutangSchema } from '@/models/Piutang';

export const runtime = 'nodejs';

type SummaryRow = {
  total_billing: string | number | null;
  total_collected: string | number | null;
  total_outstanding: string | number | null;
};

type TopDebtorRow = {
  nama_perusahaan: string;
  total_outstanding: string | number;
};

type DistributionRow = {
  name: string;
  total: string | number;
  count: string | number;
};

function toNumber(value: string | number | null | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function GET(req: NextRequest) {
  try {
    const { response } = await requireAdmin(req);
    if (response) return response;

    await ensurePiutangSchema();

    const [summary] = await sequelize.query<SummaryRow>(
      `SELECT
        COALESCE(SUM(nominal_tagihan), 0) AS total_billing,
        COALESCE(SUM(nominal_angsuran), 0) AS total_collected,
        COALESCE(SUM(saldo_piutang), 0) AS total_outstanding
      FROM customer_invoices`,
      { type: QueryTypes.SELECT }
    );

    const topDebtors = await sequelize.query<TopDebtorRow>(
      `SELECT
        c.nama_perusahaan,
        COALESCE(SUM(i.saldo_piutang), 0) AS total_outstanding
      FROM customer_invoices i
      INNER JOIN customer_objects o ON o.object_id = i.object_id
      INNER JOIN customers c ON c.customer_number = o.customer_number
      GROUP BY c.customer_number, c.nama_perusahaan
      HAVING total_outstanding > 0
      ORDER BY total_outstanding DESC
      LIMIT 10`,
      { type: QueryTypes.SELECT }
    );

    const riskDistribution = await sequelize.query<DistributionRow>(
      `SELECT
        kategori_risiko AS name,
        COALESCE(SUM(nominal_tagihan), 0) AS total,
        COUNT(*) AS count
      FROM customer_invoices
      GROUP BY kategori_risiko`,
      { type: QueryTypes.SELECT }
    );

    const repaymentDistribution = await sequelize.query<DistributionRow>(
      `SELECT
        status_pelunasan AS name,
        COALESCE(SUM(nominal_tagihan), 0) AS total,
        COUNT(*) AS count
      FROM customer_invoices
      GROUP BY status_pelunasan`,
      { type: QueryTypes.SELECT }
    );

    const totalBilling = toNumber(summary?.total_billing);
    const totalCollected = toNumber(summary?.total_collected);

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalBilling,
          totalCollected,
          totalOutstanding: toNumber(summary?.total_outstanding),
          cei: totalBilling > 0 ? (totalCollected / totalBilling) * 100 : 0,
        },
        topDebtors: topDebtors.map((item) => ({
          namaPerusahaan: item.nama_perusahaan,
          totalOutstanding: toNumber(item.total_outstanding),
        })),
        riskDistribution: riskDistribution.map((item) => ({
          name: item.name,
          total: toNumber(item.total),
          count: toNumber(item.count),
        })),
        repaymentDistribution: repaymentDistribution.map((item) => ({
          name: item.name,
          total: toNumber(item.total),
          count: toNumber(item.count),
        })),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gagal memuat analytics piutang.';
    console.error('Piutang analytics failed:', error);
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
