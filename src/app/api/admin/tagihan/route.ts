import { NextRequest, NextResponse } from 'next/server';
import User from '@/models/User';
import Tagihan, { ensureTagihanSchema } from '@/models/Tagihan';
import { errorResponse, validationError } from '@/lib/apiError';
import { requireAdmin } from '@/lib/session';
import { deleteUploadThingByUrl, uploadOneToUploadThing } from '@/lib/uploadthing';

const VALID_STATUSES = ['MENUNGGU_EVALUASI', 'DISETUJUI', 'PERLU_REVISI', 'DITOLAK', 'SELESAI'];
const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024;

function applyAssociations() {
  if (!Tagihan.associations.creator) {
    Tagihan.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
  }
  if (!Tagihan.associations.evaluator) {
    Tagihan.belongsTo(User, { foreignKey: 'evaluatedBy', as: 'evaluator' });
  }
}

function readRequired(formData: FormData, key: string, label: string) {
  const value = String(formData.get(key) || '').trim();
  if (!value) return validationError(`${label} wajib diisi.`, key);
  return value;
}

function parseNominal(value: FormDataEntryValue | null) {
  const parsed = Number(value || 0);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return validationError('Nominal wajib berupa angka yang valid.', 'nominal');
  }
  return parsed;
}

function validateUploadSize(file: File | null, field: string, label: string) {
  if (!file || file.size <= MAX_UPLOAD_SIZE_BYTES) return null;
  return validationError(`${label} maksimal 5 MB.`, field);
}

export async function GET(req: NextRequest) {
  try {
    const { response } = await requireAdmin(req);
    if (response) return response;

    await ensureTagihanSchema();
    applyAssociations();

    const data = await Tagihan.findAll({
      order: [['createdAt', 'DESC'], ['id', 'DESC']],
      include: [
        { model: User, as: 'creator', attributes: ['id', 'nama', 'email'], required: false },
        { model: User, as: 'evaluator', attributes: ['id', 'nama', 'email'], required: false },
      ],
    });

    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    console.error('Gagal memuat tagihan:', error);
    return errorResponse(error, 'Gagal memuat data tagihan.');
  }
}

export async function POST(req: NextRequest) {
  try {
    const { auth, response } = await requireAdmin(req);
    if (response || !auth) return response;

    await ensureTagihanSchema();

    const formData = await req.formData();
    const nomorInvoice = readRequired(formData, 'nomorInvoice', 'Nomor invoice');
    if (nomorInvoice instanceof NextResponse) return nomorInvoice;
    const vendor = readRequired(formData, 'vendor', 'Vendor');
    if (vendor instanceof NextResponse) return vendor;
    const kategori = readRequired(formData, 'kategori', 'Kategori');
    if (kategori instanceof NextResponse) return kategori;
    const tanggalInvoice = readRequired(formData, 'tanggalInvoice', 'Tanggal invoice');
    if (tanggalInvoice instanceof NextResponse) return tanggalInvoice;
    const tanggalDiterima = readRequired(formData, 'tanggalDiterima', 'Tanggal diterima');
    if (tanggalDiterima instanceof NextResponse) return tanggalDiterima;
    const nominal = parseNominal(formData.get('nominal'));
    if (nominal instanceof NextResponse) return nominal;

    const invoiceFile = formData.get('invoiceFile') as File | null;
    if (!invoiceFile || invoiceFile.size === 0) {
      return validationError('File invoice wajib diupload.', 'invoiceFile');
    }

    const invoiceSizeError = validateUploadSize(invoiceFile, 'invoiceFile', 'File invoice');
    if (invoiceSizeError) return invoiceSizeError;

    const invoiceFileUrl = await uploadOneToUploadThing(invoiceFile);

    const data = await Tagihan.create({
      nomorInvoice,
      vendor,
      kategori,
      tanggalInvoice,
      tanggalDiterima,
      tanggalJatuhTempo: String(formData.get('tanggalJatuhTempo') || '').trim() || null,
      nominal,
      keterangan: String(formData.get('keterangan') || '').trim() || null,
      invoiceFileUrl,
      invoiceFileName: invoiceFile.name,
      createdBy: auth.user.id,
      status: 'MENUNGGU_EVALUASI',
    });

    return NextResponse.json({ success: true, data, message: 'Tagihan berhasil ditambahkan.' });
  } catch (error: unknown) {
    console.error('Gagal menambah tagihan:', error);
    return errorResponse(error, 'Gagal menambah tagihan.');
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { auth, response } = await requireAdmin(req);
    if (response || !auth) return response;

    await ensureTagihanSchema();

    const formData = await req.formData();
    const id = Number(formData.get('id'));
    const action = String(formData.get('action') || '').trim();

    if (!Number.isInteger(id) || id <= 0) {
      return validationError('ID tagihan tidak valid.', 'id');
    }

    const tagihan = await Tagihan.findByPk(id);
    if (!tagihan) {
      return NextResponse.json({ success: false, message: 'Tagihan tidak ditemukan.' }, { status: 404 });
    }

    if (action === 'evaluate') {
      const status = String(formData.get('status') || '').trim();
      if (!VALID_STATUSES.includes(status) || status === 'SELESAI') {
        return validationError('Status evaluasi tidak valid.', 'status');
      }

      const notes = String(formData.get('evaluationNotes') || '').trim();
      if ((status === 'PERLU_REVISI' || status === 'DITOLAK') && !notes) {
        return validationError('Catatan wajib diisi untuk revisi atau penolakan.', 'evaluationNotes');
      }

      await tagihan.update({
        status,
        evaluationNotes: notes || null,
        evaluatedBy: auth.user.id,
        evaluatedAt: new Date(),
      });

      return NextResponse.json({ success: true, message: 'Evaluasi tagihan berhasil disimpan.' });
    }

    if (action === 'payment') {
      const tanggalPembayaran = String(formData.get('tanggalPembayaran') || '').trim();
      if (!tanggalPembayaran) {
        return validationError('Tanggal pembayaran wajib diisi.', 'tanggalPembayaran');
      }

      const paymentProof = formData.get('paymentProof') as File | null;
      let paymentProofUrl = tagihan.get('paymentProofUrl') as string | null;
      let paymentProofName = tagihan.get('paymentProofName') as string | null;

      if (paymentProof && paymentProof.size > 0) {
        const proofSizeError = validateUploadSize(paymentProof, 'paymentProof', 'Bukti pembayaran');
        if (proofSizeError) return proofSizeError;

        await deleteUploadThingByUrl(paymentProofUrl);
        paymentProofUrl = await uploadOneToUploadThing(paymentProof);
        paymentProofName = paymentProof.name;
      }

      await tagihan.update({
        status: 'SELESAI',
        tanggalPembayaran,
        paymentProofUrl,
        paymentProofName,
        paymentNotes: String(formData.get('paymentNotes') || '').trim() || null,
      });

      return NextResponse.json({ success: true, message: 'Tagihan berhasil ditandai selesai.' });
    }

    return validationError('Action tidak valid.', 'action');
  } catch (error: unknown) {
    console.error('Gagal memperbarui tagihan:', error);
    return errorResponse(error, 'Gagal memperbarui tagihan.');
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { response } = await requireAdmin(req);
    if (response) return response;

    await ensureTagihanSchema();

    const id = Number(req.nextUrl.searchParams.get('id'));
    if (!Number.isInteger(id) || id <= 0) {
      return validationError('ID tagihan tidak valid.', 'id');
    }

    const tagihan = await Tagihan.findByPk(id);
    if (!tagihan) {
      return NextResponse.json({ success: false, message: 'Tagihan tidak ditemukan.' }, { status: 404 });
    }

    await deleteUploadThingByUrl(tagihan.get('invoiceFileUrl') as string | null);
    await deleteUploadThingByUrl(tagihan.get('paymentProofUrl') as string | null);
    await tagihan.destroy();

    return NextResponse.json({ success: true, message: 'Tagihan berhasil dihapus.' });
  } catch (error: unknown) {
    console.error('Gagal menghapus tagihan:', error);
    return errorResponse(error, 'Gagal menghapus tagihan.');
  }
}
