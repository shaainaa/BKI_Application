import { NextRequest, NextResponse } from 'next/server';
import Pds from '@/models/Pds';
import User from '@/models/User';
import BuktiPds from '@/models/BuktiPDS';

// --- SOLUSI AMPUH: PAKSA RELASI SETIAP KALI API DIPANGGIL ---
function applyAssociations() {
  if (!Pds.associations.user) {
    Pds.belongsTo(User, { foreignKey: 'userId', as: 'user' });
  }
  if (!Pds.associations.bukti) {
    Pds.hasMany(BuktiPds, { foreignKey: 'pdsId', as: 'bukti' });
  }
}

export async function GET() {
  try {
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
  } catch (error: any) {
    console.error("Error Get Admin PDS:", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
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

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID PDS wajib diisi' }, { status: 400 });
    }

    const updatePayload: Record<string, any> = {};

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
      await Pds.update(updatePayload, { where: { id } });
    }

    if (hasBuktiUpdates) {
      const currentBukti = await BuktiPds.findAll({ where: { pdsId: id } });
      const currentStatuses = currentBukti.map((item) => item.get('verificationStatus'));
      const acceptedLocked =
        currentStatuses.length > 0 && currentStatuses.every((status) => status === 'DITERIMA');

      const wantsReject = buktiUpdates.some((bukti: any) => bukti?.verificationStatus === 'DIREJECT');
      if (acceptedLocked && wantsReject) {
        return NextResponse.json(
          { success: false, error: 'Bukti yang sudah DITERIMA tidak bisa diubah menjadi DIREJECT' },
          { status: 400 }
        );
      }

      for (const bukti of buktiUpdates) {
        if (!bukti?.id) continue;

        const payload: Record<string, any> = {};
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

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}