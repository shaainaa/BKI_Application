import { NextRequest, NextResponse } from 'next/server';
import { QueryTypes } from 'sequelize';
import sequelize from '@/lib/db';
import { requireAdmin } from '@/lib/session';
import { ensurePiutangSchema } from '@/models/Piutang';
import { errorResponse } from '@/lib/apiError';

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

type InvoiceRow = {
  nama_perusahaan: string;
  nama_objek: string;
  invoice_number: string;
  document_date: string | null;
  posting_date: string | null;
  nominal_tagihan: string | number;
  nominal_angsuran: string | number;
  saldo_piutang: string | number;
  aging_days: string | number;
  risk_category: string;
  status_pelunasan: string;
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
        risk_category AS name,
        COALESCE(SUM(nominal_tagihan), 0) AS total,
        COUNT(*) AS count
      FROM (
        SELECT
          nominal_tagihan,
          CASE
            WHEN saldo_piutang = 0 THEN 'Lunas'
            WHEN posting_date IS NULL THEN '0-30 Hari (Lancar)'
            WHEN GREATEST(DATEDIFF(CURRENT_DATE, posting_date), 0) <= 30 THEN '0-30 Hari (Lancar)'
            WHEN GREATEST(DATEDIFF(CURRENT_DATE, posting_date), 0) <= 90 THEN '31-90 Hari (Kurang Lancar)'
            WHEN GREATEST(DATEDIFF(CURRENT_DATE, posting_date), 0) <= 365 THEN '91-365 Hari (Diragukan)'
            ELSE '>365 Hari (Macet/Bad Debt)'
          END AS risk_category
        FROM customer_invoices
      ) risk_rows
      GROUP BY risk_category`,
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

    const invoiceRows = await sequelize.query<InvoiceRow>(
      `SELECT
        c.nama_perusahaan,
        o.nama_objek,
        i.invoice_number,
        i.document_date,
        i.posting_date,
        i.nominal_tagihan,
        i.nominal_angsuran,
        i.saldo_piutang,
        CASE
          WHEN i.saldo_piutang = 0 OR i.posting_date IS NULL THEN 0
          ELSE GREATEST(DATEDIFF(CURRENT_DATE, i.posting_date), 0)
        END AS aging_days,
        CASE
          WHEN i.saldo_piutang = 0 THEN 'Lunas'
          WHEN i.posting_date IS NULL THEN '0-30 Hari (Lancar)'
          WHEN GREATEST(DATEDIFF(CURRENT_DATE, i.posting_date), 0) <= 30 THEN '0-30 Hari (Lancar)'
          WHEN GREATEST(DATEDIFF(CURRENT_DATE, i.posting_date), 0) <= 90 THEN '31-90 Hari (Kurang Lancar)'
          WHEN GREATEST(DATEDIFF(CURRENT_DATE, i.posting_date), 0) <= 365 THEN '91-365 Hari (Diragukan)'
          ELSE '>365 Hari (Macet/Bad Debt)'
        END AS risk_category,
        i.status_pelunasan
      FROM customer_invoices i
      INNER JOIN customer_objects o ON o.object_id = i.object_id
      INNER JOIN customers c ON c.customer_number = o.customer_number
      ORDER BY
        CASE
          WHEN i.saldo_piutang = 0 THEN 0
          WHEN i.posting_date IS NULL THEN 1
          WHEN GREATEST(DATEDIFF(CURRENT_DATE, i.posting_date), 0) <= 30 THEN 1
          WHEN GREATEST(DATEDIFF(CURRENT_DATE, i.posting_date), 0) <= 90 THEN 2
          WHEN GREATEST(DATEDIFF(CURRENT_DATE, i.posting_date), 0) <= 365 THEN 3
          ELSE 4
        END DESC,
        i.saldo_piutang DESC,
        c.nama_perusahaan ASC`,
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
        invoiceRows: invoiceRows.map((item) => ({
          namaPerusahaan: item.nama_perusahaan,
          namaObjek: item.nama_objek,
          invoiceNumber: item.invoice_number,
          documentDate: item.document_date,
          postingDate: item.posting_date,
          nominalTagihan: toNumber(item.nominal_tagihan),
          nominalAngsuran: toNumber(item.nominal_angsuran),
          saldoPiutang: toNumber(item.saldo_piutang),
          agingDays: toNumber(item.aging_days),
          riskCategory: item.risk_category,
          statusPelunasan: item.status_pelunasan,
        })),
      },
    });
  } catch (error) {
    console.error('Piutang analytics failed:', error);
    return errorResponse(error, 'Gagal memuat analytics piutang.');
  }
}
