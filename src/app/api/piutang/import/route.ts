import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx-js-style';
import { Op } from 'sequelize';
import sequelize from '@/lib/db';
import { requireAdmin } from '@/lib/session';
import { Customer, CustomerInvoice, CustomerObject, ensurePiutangSchema } from '@/models/Piutang';
import { errorResponse } from '@/lib/apiError';

export const runtime = 'nodejs';

const REQUIRED_COLUMNS = [
  'Customer Number',
  'Nama Perusahaan',
  'Object Name',
  'Invoice Cetak',
  'Document Date',
  'Posting Date',
  'Tagihan',
  'Angsuran',
  'Saldo',
] as const;

const DAY_MS = 24 * 60 * 60 * 1000;
const BATCH_SIZE = 500;

type RequiredColumn = typeof REQUIRED_COLUMNS[number];
type RawPostagRow = Record<RequiredColumn, unknown>;
type NormalizedPostagRow = {
  customerNumber: string;
  namaPerusahaan: string;
  namaObjek: string;
  invoiceNumber: string;
  documentDate: string | null;
  postingDate: string | null;
  tagihan: number;
  angsuran: number;
  saldo: number;
  agingDays: number;
  kategoriRisiko: string;
  statusPelunasan: string;
};

function sanitizeText(value: unknown) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function parseMoney(value: unknown) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;

  const cleaned = sanitizeText(value)
    .replace(/[^\d,.-]/g, '')
    .replace(/\.(?=\d{3}(\D|$))/g, '')
    .replace(',', '.');

  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toDateOnly(value: unknown) {
  if (!value) return null;

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }

  if (typeof value === 'number') {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (!parsed) return null;
    const date = new Date(Date.UTC(parsed.y, parsed.m - 1, parsed.d));
    return date.toISOString().slice(0, 10);
  }

  const text = sanitizeText(value);
  if (!text) return null;

  const normalized = text.includes('/')
    ? text.replace(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, '$3-$2-$1')
    : text;
  const date = new Date(normalized);

  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}

function getTodayCutOffDate() {
  const today = new Date();
  return new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
}

function getAgingDays(postingDate: string | null, saldo: number, cutOffDate: Date) {
  if (saldo === 0 || !postingDate) return 0;

  const posting = new Date(`${postingDate}T00:00:00.000Z`);
  if (Number.isNaN(posting.getTime())) return 0;

  return Math.max(0, Math.floor((cutOffDate.getTime() - posting.getTime()) / DAY_MS));
}

function getRiskCategory(saldo: number, agingDays: number) {
  if (saldo === 0) return 'Lunas';
  if (agingDays <= 30) return '0-30 Hari (Lancar)';
  if (agingDays <= 90) return '31-90 Hari (Kurang Lancar)';
  if (agingDays <= 365) return '91-365 Hari (Diragukan)';
  return '>365 Hari (Macet/Bad Debt)';
}

function getRepaymentStatus(tagihan: number, angsuran: number, saldo: number) {
  if (saldo === 0) return 'Lunas (100%)';
  if (tagihan > 0 && angsuran / tagihan >= 0.5) return 'Progres Baik (>=50%)';
  if (angsuran > 0) return 'Progres Rendah (<50%)';
  return 'Belum Ada Cicilan (0%)';
}

function validateColumns(row: Record<string, unknown> | undefined) {
  if (!row) return REQUIRED_COLUMNS;
  return REQUIRED_COLUMNS.filter((column) => !(column in row));
}

function chunk<T>(items: T[], size = BATCH_SIZE) {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

function getObjectKey(customerNumber: string, namaObjek: string) {
  return `${customerNumber}\u0000${namaObjek}`;
}

export async function POST(req: NextRequest) {
  try {
    const { response } = await requireAdmin(req);
    if (response) return response;

    await ensurePiutangSchema();

    const formData = await req.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, message: 'File POSTAG wajib diunggah.' }, { status: 400 });
    }

    if (!/\.(xlsx|xls)$/i.test(file.name)) {
      return NextResponse.json({ success: false, message: 'Format file harus .xlsx atau .xls.' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];

    if (!sheet) {
      return NextResponse.json({ success: false, message: 'Sheet pertama tidak ditemukan.' }, { status: 400 });
    }

    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '', raw: true });
    const missingColumns = validateColumns(rows[0]);

    if (missingColumns.length > 0) {
      return NextResponse.json(
        { success: false, message: `Struktur POSTAG tidak valid. Kolom hilang: ${missingColumns.join(', ')}` },
        { status: 400 }
      );
    }

    const cutOffDate = getTodayCutOffDate();
    const normalizedRows: NormalizedPostagRow[] = rows.map((rawRow, index) => {
      const row = rawRow as RawPostagRow;
      const customerNumber = sanitizeText(row['Customer Number']);
      const namaPerusahaan = sanitizeText(row['Nama Perusahaan']);
      const namaObjek = sanitizeText(row['Object Name']);
      const invoiceNumber = sanitizeText(row['Invoice Cetak']);

      if (!customerNumber || !namaPerusahaan || !namaObjek || !invoiceNumber) {
        throw new Error(`Data wajib kosong pada baris ${index + 2}.`);
      }

      const tagihan = parseMoney(row.Tagihan);
      const angsuran = parseMoney(row.Angsuran);
      const saldo = parseMoney(row.Saldo);
      const documentDate = toDateOnly(row['Document Date']);
      const postingDate = toDateOnly(row['Posting Date']);
      const agingDays = getAgingDays(postingDate, saldo, cutOffDate);

      return {
        customerNumber,
        namaPerusahaan,
        namaObjek,
        invoiceNumber,
        documentDate,
        postingDate,
        tagihan,
        angsuran,
        saldo,
        agingDays,
        kategoriRisiko: getRiskCategory(saldo, agingDays),
        statusPelunasan: getRepaymentStatus(tagihan, angsuran, saldo),
      };
    });

    const customers = Array.from(
      normalizedRows.reduce((map, row) => {
        map.set(row.customerNumber, {
          customer_number: row.customerNumber,
          nama_perusahaan: row.namaPerusahaan,
        });
        return map;
      }, new Map<string, { customer_number: string; nama_perusahaan: string }>())
        .values()
    );

    const objects = Array.from(
      normalizedRows.reduce((map, row) => {
        map.set(getObjectKey(row.customerNumber, row.namaObjek), {
          customer_number: row.customerNumber,
          nama_objek: row.namaObjek,
        });
        return map;
      }, new Map<string, { customer_number: string; nama_objek: string }>())
        .values()
    );

    await sequelize.transaction(async (transaction) => {
      for (const customerBatch of chunk(customers)) {
        await Customer.bulkCreate(customerBatch, {
          updateOnDuplicate: ['nama_perusahaan'],
          transaction,
        });
      }

      for (const objectBatch of chunk(objects)) {
        await CustomerObject.bulkCreate(objectBatch, {
          ignoreDuplicates: true,
          transaction,
        });
      }

      const objectIdByKey = new Map<string, number>();
      for (const objectBatch of chunk(objects)) {
        const foundObjects = await CustomerObject.findAll({
          where: {
            [Op.or]: objectBatch.map((item) => ({
              customer_number: item.customer_number,
              nama_objek: item.nama_objek,
            })),
          },
          transaction,
        });

        for (const item of foundObjects) {
          objectIdByKey.set(
            getObjectKey(
              String(item.getDataValue('customer_number')),
              String(item.getDataValue('nama_objek'))
            ),
            Number(item.getDataValue('object_id'))
          );
        }
      }

      const invoices = normalizedRows.map((row) => {
        const objectId = objectIdByKey.get(getObjectKey(row.customerNumber, row.namaObjek));
        if (!objectId) {
          throw new Error(`Objek pelanggan tidak ditemukan untuk invoice ${row.invoiceNumber}.`);
        }

        return {
          invoice_number: row.invoiceNumber,
          object_id: objectId,
          document_date: row.documentDate,
          posting_date: row.postingDate,
          nominal_tagihan: row.tagihan,
          nominal_angsuran: row.angsuran,
          saldo_piutang: row.saldo,
          umur_piutang_hari: row.agingDays,
          kategori_risiko: row.kategoriRisiko,
          status_pelunasan: row.statusPelunasan,
        };
      });

      for (const invoiceBatch of chunk(invoices)) {
        await CustomerInvoice.bulkCreate(invoiceBatch, {
          updateOnDuplicate: [
            'object_id',
            'document_date',
            'posting_date',
            'nominal_tagihan',
            'nominal_angsuran',
            'saldo_piutang',
            'umur_piutang_hari',
            'kategori_risiko',
            'status_pelunasan',
          ],
          transaction,
        });
      }
    });

    return NextResponse.json({ success: true, processed: normalizedRows.length });
  } catch (error) {
    console.error('POSTAG import failed:', error);
    return errorResponse(error, 'Gagal memproses file POSTAG.');
  }
}
