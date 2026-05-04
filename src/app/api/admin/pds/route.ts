import { NextRequest, NextResponse } from 'next/server';
import Pds from '@/models/Pds';
import User from '@/models/User';
import BuktiPds from '@/models/BuktiPDS';
import { getSessionFromRequest } from '@/lib/auth-session';

const ALLOWED_BUKTI_STATUS = new Set(['PENDING', 'DITERIMA', 'DIREJECT']);
type BuktiUpdatePayload = {
  id?: number | string;
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

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    // Panggil fungsi relasi dulu
    applyAssociations();

    const allPds = await Pds.findAll({
      order: [['id', 'DESC']], // Gunakan ID dulu untuk tes
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
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan server.';
    console.error("Error Get Admin PDS:", message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const {
      id,
      status,
      nominal,
      sps,
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

    const pdsId = Number(id);
    if (!Number.isFinite(pdsId) || pdsId <= 0) {
      return NextResponse.json({ success: false, error: 'ID PDS wajib diisi' }, { status: 400 });
    }

    const updatePayload: Record<string, unknown> = {};

    if (typeof status !== 'undefined') updatePayload.status = status;
    if (typeof nominal !== 'undefined') updatePayload.nominalPDS = nominal;
    if (typeof sps !== 'undefined') updatePayload.sps = sps;
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
    if (typeof visitKe !== 'undefined') updatePayload.visitKe = visitKe;
    if (typeof keteranganVisit !== 'undefined') updatePayload.keteranganVisit = keteranganVisit;
    if (typeof permohonan !== 'undefined') updatePayload.permohonan = permohonan;

    const hasBuktiUpdates = Array.isArray(buktiUpdates) && buktiUpdates.length > 0;

    if (Object.keys(updatePayload).length === 0 && !hasBuktiUpdates) {
      return NextResponse.json({ success: false, error: 'Tidak ada data yang diubah' }, { status: 400 });
    }

    if (Object.keys(updatePayload).length > 0) {
      await Pds.update(updatePayload, { where: { id: pdsId } });
    }

    if (hasBuktiUpdates) {
      const currentBukti = await BuktiPds.findAll({ where: { pdsId } });
      const currentStatuses = currentBukti.map((item) => String(item.get('verificationStatus') || ''));
      const acceptedLocked =
        currentStatuses.length > 0 && currentStatuses.every((status) => status === 'DITERIMA');

      const wantsReject = (buktiUpdates as BuktiUpdatePayload[]).some((bukti) => bukti?.verificationStatus === 'DIREJECT');
      if (acceptedLocked && wantsReject) {
        return NextResponse.json(
          { success: false, error: 'Bukti yang sudah DITERIMA tidak bisa diubah menjadi DIREJECT' },
          { status: 400 }
        );
      }

      for (const bukti of buktiUpdates as BuktiUpdatePayload[]) {
        const buktiId = Number(bukti?.id);
        if (!Number.isFinite(buktiId) || buktiId <= 0) continue;

        const payload: Record<string, unknown> = {};
        if (typeof bukti.verificationStatus !== 'undefined') {
          if (!ALLOWED_BUKTI_STATUS.has(String(bukti.verificationStatus))) {
            return NextResponse.json(
              { success: false, error: `Status bukti tidak valid: ${String(bukti.verificationStatus)}` },
              { status: 400 }
            );
          }
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
              id: buktiId,
              pdsId,
            },
          });
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan server.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}