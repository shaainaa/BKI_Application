import { NextResponse } from 'next/server';

type ErrorPayload = {
  success: false;
  error: string;
  message: string;
  field?: string;
};

const FIELD_LABELS: Record<string, string> = {
  id: 'ID',
  userId: 'Pengguna',
  nama: 'Nama',
  email: 'Email',
  username: 'Username',
  password: 'Password',
  noTelp: 'Nomor telepon',
  noRekening: 'Nomor rekening',
  jenisBank: 'Jenis bank',
  jabatanSurveyor: 'Jabatan surveyor',
  permohonan: 'Jenis permohonan',
  lokasi: 'Lokasi',
  keperluan: 'Keperluan',
  noAgenda: 'Nomor agenda',
  tglBerangkat: 'Tanggal berangkat',
  jamBerangkat: 'Jam berangkat',
  tglKembali: 'Tanggal kembali',
  jamKembali: 'Jam kembali',
  visitKe: 'Visit Ke',
  keteranganVisit: 'Keterangan visit',
  ttdDigitalUrl: 'Tanda tangan digital',
  status: 'Status',
  nominalPDS: 'Nominal PDS',
  nominal: 'Nominal',
  so: 'Nomor SO',
  nomorPdsTrans: 'Nomor PDS/Transport',
  statusPembayaran: 'Status pembayaran',
  tanggalPembayaran: 'Tanggal pembayaran',
  title: 'Judul',
  description: 'Deskripsi',
  start: 'Tanggal mulai',
  end: 'Tanggal selesai',
  category: 'Kategori',
  fileSurat: 'File surat',
  pdsId: 'PDS',
  kategori: 'Kategori bukti',
  file: 'File',
};

const TECHNICAL_PATTERNS = [
  /sequelize/i,
  /\bsql\b/i,
  /truncated/i,
  /incorrect .* value/i,
  /cannot be null/i,
  /duplicate entry/i,
  /foreign key/i,
  /constraint/i,
  /unknown column/i,
  /data too long/i,
  /out of range/i,
  /econnrefused/i,
  /etimedout/i,
  /getaddrinfo/i,
  /access denied/i,
  /unknown database/i,
  /server does not support secure connection/i,
];

function labelFor(field?: string | null) {
  if (!field) return 'Data';
  return FIELD_LABELS[field] || field;
}

function getErrorName(error: unknown) {
  return typeof error === 'object' && error && 'name' in error
    ? String((error as { name?: unknown }).name || '')
    : '';
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error || '');
}

function getNestedMessage(error: unknown) {
  if (typeof error !== 'object' || !error) return '';

  const candidate = error as {
    parent?: { sqlMessage?: string; message?: string; code?: string };
    original?: { sqlMessage?: string; message?: string; code?: string };
  };

  return (
    candidate.parent?.sqlMessage ||
    candidate.original?.sqlMessage ||
    candidate.parent?.message ||
    candidate.original?.message ||
    ''
  );
}

function getFirstSequelizeValidation(error: unknown) {
  if (typeof error !== 'object' || !error || !('errors' in error)) return null;

  const errors = (error as { errors?: Array<{ path?: string; message?: string; validatorKey?: string }> }).errors;
  if (!Array.isArray(errors) || errors.length === 0) return null;

  const first = errors[0];
  return {
    field: first.path,
    label: labelFor(first.path),
    validatorKey: first.validatorKey,
    message: first.message || '',
  };
}

function looksLikeSafeUserMessage(message: string) {
  const trimmed = message.trim();
  if (!trimmed) return false;
  if (TECHNICAL_PATTERNS.some((pattern) => pattern.test(trimmed))) return false;
  return /[A-Za-z]/.test(trimmed) && trimmed.length <= 220;
}

export function getFriendlyErrorMessage(
  error: unknown,
  fallback = 'Terjadi kesalahan server. Silakan coba lagi.'
) {
  const name = getErrorName(error);
  const rawMessage = getErrorMessage(error);
  const nestedMessage = getNestedMessage(error);
  const combined = `${rawMessage}\n${nestedMessage}`.trim();

  const validation = getFirstSequelizeValidation(error);
  if (name === 'SequelizeValidationError' && validation) {
    if (validation.validatorKey === 'not_null') {
      return `${validation.label} wajib diisi.`;
    }
    return validation.message && looksLikeSafeUserMessage(validation.message)
      ? validation.message
      : `${validation.label} tidak valid.`;
  }

  if (name === 'SequelizeUniqueConstraintError') {
    const field = validation?.field;
    return `${labelFor(field)} sudah digunakan.`;
  }

  const cannotBeNull = combined.match(/Column '([^']+)' cannot be null/i);
  if (cannotBeNull) {
    return `${labelFor(cannotBeNull[1])} wajib diisi.`;
  }

  const integerColumn = combined.match(/(?:Incorrect integer value|Truncated incorrect INTEGER value).*column '([^']+)'/i);
  if (integerColumn) {
    return `${labelFor(integerColumn[1])} wajib diisi dengan angka yang valid.`;
  }

  if (/Incorrect integer value|Truncated incorrect INTEGER value/i.test(combined)) {
    return 'Ada field angka yang masih kosong atau tidak valid. Periksa kembali data angka seperti Visit Ke.';
  }

  const enumColumn = combined.match(/Data truncated for column '([^']+)'/i);
  if (enumColumn) {
    return `${labelFor(enumColumn[1])} tidak valid. Pilih nilai dari opsi yang tersedia.`;
  }

  const duplicateEntry = combined.match(/Duplicate entry '([^']+)'/i);
  if (duplicateEntry) {
    return `Data "${duplicateEntry[1]}" sudah ada. Gunakan nilai lain.`;
  }

  const dataTooLong = combined.match(/Data too long for column '([^']+)'/i);
  if (dataTooLong) {
    return `${labelFor(dataTooLong[1])} terlalu panjang.`;
  }

  const outOfRange = combined.match(/Out of range value for column '([^']+)'/i);
  if (outOfRange) {
    return `${labelFor(outOfRange[1])} terlalu besar.`;
  }

  if (/foreign key constraint/i.test(combined)) {
    return 'Data terkait tidak ditemukan atau sudah berubah. Muat ulang halaman lalu coba lagi.';
  }

  if (/server does not support secure connection|ssl connection error|wrong version number/i.test(combined)) {
    return 'Koneksi ke database sedang bermasalah. Silakan hubungi admin aplikasi.';
  }

  if (/connect etimedout|econnrefused|getaddrinfo enotfound|access denied for user|unknown database/i.test(combined)) {
    return 'Koneksi ke layanan sedang bermasalah. Coba lagi beberapa saat.';
  }

  if (/uploadthing|upload file|gagal upload/i.test(combined)) {
    return 'File belum berhasil diunggah. Periksa ukuran atau format file, lalu coba lagi.';
  }

  if (/Unexpected end of JSON input|invalid json/i.test(combined)) {
    return 'Data yang dikirim tidak valid. Muat ulang halaman lalu coba lagi.';
  }

  if (/Data wajib kosong pada baris (\d+)/i.test(combined)) {
    const row = combined.match(/Data wajib kosong pada baris (\d+)/i)?.[1];
    return `Data wajib belum lengkap pada baris ${row}.`;
  }

  if (looksLikeSafeUserMessage(rawMessage)) {
    return rawMessage;
  }

  return fallback;
}

export function errorResponse(
  error: unknown,
  fallback = 'Terjadi kesalahan server. Silakan coba lagi.',
  status = 500
) {
  const message = getFriendlyErrorMessage(error, fallback);
  const payload: ErrorPayload = {
    success: false,
    error: message,
    message,
  };

  return NextResponse.json(payload, { status });
}

export function validationError(message: string, field?: string, status = 400) {
  const payload: ErrorPayload = {
    success: false,
    error: message,
    message,
    ...(field ? { field } : {}),
  };

  return NextResponse.json(payload, { status });
}
