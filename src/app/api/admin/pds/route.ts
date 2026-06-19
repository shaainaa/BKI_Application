import { NextRequest, NextResponse } from 'next/server';
import Pds from '@/models/Pds';
import User from '@/models/User';
import BuktiPds from '@/models/BuktiPDS';
import { deleteUploadThingByUrl } from '@/lib/uploadthing';
import { requireAdmin } from '@/lib/session';
import { syncPdsToGoogleSheetQuietly } from '@/lib/pdsGoogleSheet';
import { errorResponse, validationError } from '@/lib/apiError';

type UpdateValue = unknown;

type BuktiUpdate = {
  id?: number;
  verificationStatus?: string;
  verifiedBy?: string | null;
};

// --- SOLUSI AMPUH: PAKSA RELASI SETIAP KALI API DIPANGGIL ---
function applyAssociations() {
  if (!Pds.associations.user) {
    Pds.belongsTo(User, { foreignKey: 'userId', as: 'user' });
  }
  if (!Pds.associations.bukti) {
    Pds.hasMany(BuktiPds, { foreignKey: 'pdsId', as: 'bukti' });
  }
}

function parseOptionalDecimal(value: unknown, label: string, field: string) {
  if (value === null || typeof value === 'undefined' || value === '') return null;

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return validationError(`${label} wajib berupa angka yang valid.`, field);
  }

  return parsed;
}

function parseRequiredInteger(value: unknown, label: string, field: string) {
  const parsed = Number(value);
  if (value === null || typeof value === 'undefined' || value === '' || !Number.isInteger(parsed) || parsed <= 0) {
    return validationError(`${label} wajib diisi dengan angka lebih dari 0.`, field);
  }

  return parsed;
}

export async function GET(req: NextRequest) {
  try {
    const { response } = await requireAdmin(req);
    if (response) return response;

    // Panggil fungsi relasi dulu
    applyAssociations();

    const allPds = await Pds.findAll({
      order: [['tglBerangkat', 'DESC'], ['tanggalPengajuan', 'DESC'], ['id', 'DESC']],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'nama', 'email'],
          required: false,
        },
        {
          model: BuktiPds,
          as: 'bukti',
          required: false,
        }
      ]
    });

    return NextResponse.json({ success: true, data: allPds });
  } catch (error: unknown) {
    console.error("Error Get Admin PDS:", error);
    return errorResponse(error, 'Gagal memuat data PDS.');
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { response } = await requireAdmin(req);
    if (response) return response;

    const body = await req.json() as Record<string, unknown>;
    const {
      id,
      status,
      nominal,
      so,
      nomorPdsTrans,
      statusPembayaran,
      tanggalPembayaran,
      noAgenda,
      lokasi,
      keperluan,
      tglBerangkat,
      jamBerangkat,
      tglKembali,
      jamKembali,
      visitKe,
      keteranganVisit,
      permohonan,
      reviewNotes,
      buktiUpdates,
    } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID PDS wajib diisi' }, { status: 400 });
    }

    const updatePayload: Record<string, UpdateValue> = {};

    if (typeof status !== 'undefined') updatePayload.status = status;
    if (typeof nominal !== 'undefined') {
      const parsedNominal = parseOptionalDecimal(nominal, 'Nominal PDS', 'nominal');
      if (parsedNominal instanceof NextResponse) return parsedNominal;
      updatePayload.nominalPDS = parsedNominal;
    }
    if (typeof so !== 'undefined') updatePayload.so = so;
    if (typeof nomorPdsTrans !== 'undefined') updatePayload.nomorPdsTrans = nomorPdsTrans;
    if (typeof statusPembayaran !== 'undefined') updatePayload.statusPembayaran = statusPembayaran;
    if (typeof tanggalPembayaran !== 'undefined') updatePayload.tanggalPembayaran = tanggalPembayaran;
    if (typeof noAgenda !== 'undefined') updatePayload.noAgenda = noAgenda;
    if (typeof lokasi !== 'undefined') updatePayload.lokasi = lokasi;
    if (typeof keperluan !== 'undefined') updatePayload.keperluan = keperluan;
    if (typeof tglBerangkat !== 'undefined') updatePayload.tglBerangkat = tglBerangkat;
    if (typeof jamBerangkat !== 'undefined') updatePayload.jamBerangkat = jamBerangkat;
    if (typeof tglKembali !== 'undefined') updatePayload.tglKembali = tglKembali;
    if (typeof jamKembali !== 'undefined') updatePayload.jamKembali = jamKembali;
    if (typeof visitKe !== 'undefined') {
      const parsedVisitKe = parseRequiredInteger(visitKe, 'Visit Ke', 'visitKe');
      if (parsedVisitKe instanceof NextResponse) return parsedVisitKe;
      updatePayload.visitKe = parsedVisitKe;
    }
    if (typeof keteranganVisit !== 'undefined') updatePayload.keteranganVisit = keteranganVisit;
    if (typeof permohonan !== 'undefined') updatePayload.permohonan = permohonan;

    const hasBuktiUpdates = Array.isArray(buktiUpdates) && buktiUpdates.length > 0;

    if (Object.keys(updatePayload).length === 0 && !hasBuktiUpdates) {
      return NextResponse.json({ success: false, error: 'Tidak ada data yang diubah' }, { status: 400 });
    }

    if (Object.keys(updatePayload).length > 0) {
      await Pds.update(updatePayload, { where: { id } });
    }

    if (hasBuktiUpdates) {
      const currentBukti = await BuktiPds.findAll({ where: { pdsId: id } });
      const currentStatuses = currentBukti.map((item) => item.get('verificationStatus'));
      const acceptedLocked =
        currentStatuses.length > 0 && currentStatuses.every((status) => status === 'DITERIMA');

      const updates = buktiUpdates as BuktiUpdate[];
      const wantsReject = updates.some((bukti) => bukti?.verificationStatus === 'DIREJECT');
      if (acceptedLocked && wantsReject) {
        return NextResponse.json(
          { success: false, error: 'Bukti yang sudah DITERIMA tidak bisa diubah menjadi DIREJECT' },
          { status: 400 }
        );
      }

      for (const bukti of updates) {
        if (!bukti?.id) continue;

        const payload: Record<string, UpdateValue> = {};
        if (typeof bukti.verificationStatus !== 'undefined') {
          payload.verificationStatus = bukti.verificationStatus;
          payload.verifiedAt = bukti.verificationStatus === 'PENDING' ? null : new Date();
        }
        if (typeof reviewNotes !== 'undefined') {
          payload.verificationNotes = reviewNotes || null;
        }
        if (typeof bukti.verifiedBy !== 'undefined') {
          payload.verifiedBy = bukti.verifiedBy || null;
        }

        if (Object.keys(payload).length > 0) {
          await BuktiPds.update(payload, {
            where: {
              id: bukti.id,
              pdsId: id,
            },
          });
        }
      }
    }

    await syncPdsToGoogleSheetQuietly('admin-pds-patch');

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Gagal memperbarui PDS:', error);
    return errorResponse(error, 'Gagal memperbarui data PDS.');
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { response } = await requireAdmin(req);
    if (response) return response;

    const idRaw = req.nextUrl.searchParams.get('id');
    const id = Number(idRaw);

    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json({ success: false, error: 'ID PDS tidak valid' }, { status: 400 });
    }

    applyAssociations();

    const pds = await Pds.findByPk(id);
    if (!pds) {
      return NextResponse.json({ success: false, error: 'PDS tidak ditemukan' }, { status: 404 });
    }

    const buktiList = await BuktiPds.findAll({ where: { pdsId: id } });
    for (const bukti of buktiList) {
      const fileUrl = bukti.get('fileUrl') as string | null;
      if (fileUrl) {
        await deleteUploadThingByUrl(fileUrl);
      }
    }

    const ttdUrl = pds.get('ttdDigitalUrl') as string | null;
    if (ttdUrl) {
      await deleteUploadThingByUrl(ttdUrl);
    }

    if (buktiList.length > 0) {
      await BuktiPds.destroy({ where: { pdsId: id } });
    }

    await pds.destroy();

    await syncPdsToGoogleSheetQuietly('admin-pds-delete');

    return NextResponse.json({ success: true, message: 'PDS berhasil dihapus' });
  } catch (error: unknown) {
    console.error('Gagal menghapus PDS:', error);
    return errorResponse(error, 'Gagal menghapus PDS.');
  }
}
