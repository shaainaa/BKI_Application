import { createSign } from 'crypto';
import Pds from '@/models/Pds';
import User from '@/models/User';

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_SHEETS_API = 'https://sheets.googleapis.com/v4/spreadsheets';
const SHEET_NAME = process.env.GOOGLE_SHEETS_PDS_SHEET_NAME || 'Riwayat PDS';

const HEADERS = [
  'No. Transportasi',
  'No. PDS',
  'Bulan',
  'Tahun',
  'Tanggal Berangkat',
  'Tanggal Kembali',
  'Lokasi',
  'Nama',
  'Keperluan',
  'Nominal',
  'No. Agenda',
  'SO',
  'Visit Ke',
  'Status PDS',
  'Status Pembayaran',
  'Tanggal Pembayaran',
];

type PlainPds = {
  id?: number;
  permohonan?: string;
  tanggalPengajuan?: string | Date;
  tglBerangkat?: string | Date;
  tglKembali?: string | Date;
  lokasi?: string;
  user?: { nama?: string; name?: string };
  keperluan?: string;
  nominalPDS?: string | number | null;
  noAgenda?: string;
  so?: string | null;
  visitKe?: string | number | null;
  nomorPdsTrans?: string | null;
  status?: string;
  statusPembayaran?: string;
  tanggalPembayaran?: string | Date | null;
};

function base64Url(value: string | Buffer) {
  return Buffer.from(value)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function getRequiredEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} belum diisi.`);
  }
  return value;
}

function normalizePrivateKey(value: string) {
  return value.replace(/\\n/g, '\n');
}

function buildJwt() {
  const clientEmail = getRequiredEnv('GOOGLE_SERVICE_ACCOUNT_EMAIL');
  const privateKey = normalizePrivateKey(getRequiredEnv('GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY'));
  const now = Math.floor(Date.now() / 1000);

  const header = {
    alg: 'RS256',
    typ: 'JWT',
  };
  const claim = {
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: GOOGLE_TOKEN_URL,
    iat: now,
    exp: now + 3600,
  };

  const unsignedJwt = `${base64Url(JSON.stringify(header))}.${base64Url(JSON.stringify(claim))}`;
  const signature = createSign('RSA-SHA256').update(unsignedJwt).sign(privateKey);
  return `${unsignedJwt}.${base64Url(signature)}`;
}

async function getAccessToken() {
  const body = new URLSearchParams({
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    assertion: buildJwt(),
  });

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  const data = await response.json();
  if (!response.ok || !data.access_token) {
    throw new Error(data.error_description || data.error || 'Gagal meminta access token Google.');
  }

  return data.access_token as string;
}

async function googleSheetsRequest(path: string, init: RequestInit = {}) {
  const spreadsheetId = getRequiredEnv('GOOGLE_SHEETS_PDS_SPREADSHEET_ID');
  const accessToken = await getAccessToken();
  const response = await fetch(`${GOOGLE_SHEETS_API}/${spreadsheetId}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    throw new Error(data?.error?.message || 'Request Google Sheets gagal.');
  }

  return data;
}

function applyAssociations() {
  if (!Pds.associations.user) {
    Pds.belongsTo(User, { foreignKey: 'userId', as: 'user' });
  }
}

function formatDate(value?: string | Date | null) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('id-ID');
}

function getDayOnly(value?: string | Date | null) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return String(date.getDate()).padStart(2, '0');
}

function getMonthAndYear(value?: string | Date | null) {
  if (!value) return { month: '-', year: '-' };
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { month: '-', year: '-' };

  return {
    month: date.toLocaleDateString('id-ID', { month: 'long' }),
    year: date.getFullYear(),
  };
}

function toSheetRow(item: PlainPds) {
  const jenis = (item.permohonan || '').toUpperCase();
  const nomorPdsTrans = item.nomorPdsTrans || '-';
  const { month, year } = getMonthAndYear(item.tanggalPengajuan);

  return [
    jenis === 'TRANSPORTASI' ? nomorPdsTrans : '-',
    jenis !== 'TRANSPORTASI' ? nomorPdsTrans : '-',
    month,
    year,
    getDayOnly(item.tglBerangkat),
    getDayOnly(item.tglKembali),
    item.lokasi || '-',
    item.user?.nama || item.user?.name || '-',
    item.keperluan || '-',
    item.nominalPDS ? Number(item.nominalPDS) : '',
    item.noAgenda || '-',
    item.so || '-',
    item.visitKe || '-',
    item.status || '-',
    item.statusPembayaran === 'SUDAH_DIBAYAR' ? 'Sudah Dibayar' : 'Belum Dibayar',
    formatDate(item.tanggalPembayaran),
  ];
}

async function ensureSheetExists() {
  const metadata = await googleSheetsRequest('?fields=sheets.properties');
  const sheets = (metadata?.sheets || []) as Array<{ properties?: { sheetId?: number; title?: string } }>;
  const existingSheet = sheets.find((sheet) => sheet.properties?.title === SHEET_NAME);

  if (typeof existingSheet?.properties?.sheetId === 'number') {
    return existingSheet.properties.sheetId;
  }

  const response = await googleSheetsRequest(':batchUpdate', {
    method: 'POST',
    body: JSON.stringify({
      requests: [
        {
          addSheet: {
            properties: {
              title: SHEET_NAME,
            },
          },
        },
      ],
    }),
  });

  const sheetId = response?.replies?.[0]?.addSheet?.properties?.sheetId;
  if (typeof sheetId !== 'number') {
    throw new Error(`Gagal membuat tab Google Sheet "${SHEET_NAME}".`);
  }

  return sheetId;
}

async function formatSheet(rowCount: number, sheetId: number) {
  await googleSheetsRequest(':batchUpdate', {
    method: 'POST',
    body: JSON.stringify({
      requests: [
        {
          updateSheetProperties: {
            properties: {
              sheetId,
              gridProperties: {
                frozenRowCount: 1,
              },
            },
            fields: 'gridProperties.frozenRowCount',
          },
        },
        {
          repeatCell: {
            range: {
              sheetId,
              startRowIndex: 0,
              endRowIndex: 1,
            },
            cell: {
              userEnteredFormat: {
                backgroundColor: { red: 0.294, green: 0.333, blue: 0.388 },
                textFormat: {
                  bold: true,
                  foregroundColor: { red: 1, green: 1, blue: 1 },
                },
                horizontalAlignment: 'CENTER',
              },
            },
            fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)',
          },
        },
        {
          setBasicFilter: {
            filter: {
              range: {
                sheetId,
                startRowIndex: 0,
                endRowIndex: Math.max(rowCount, 1),
                startColumnIndex: 0,
                endColumnIndex: HEADERS.length,
              },
            },
          },
        },
        {
          autoResizeDimensions: {
            dimensions: {
              sheetId,
              dimension: 'COLUMNS',
              startIndex: 0,
              endIndex: HEADERS.length,
            },
          },
        },
      ],
    }),
  });
}

export function isPdsGoogleSheetConfigured() {
  return Boolean(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
      process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY &&
      process.env.GOOGLE_SHEETS_PDS_SPREADSHEET_ID
  );
}

export async function syncPdsToGoogleSheet() {
  if (!isPdsGoogleSheetConfigured()) {
    return { skipped: true, reason: 'Google Sheets sync belum dikonfigurasi.' };
  }

  applyAssociations();

  const allPds = await Pds.findAll({
    order: [['tglBerangkat', 'ASC'], ['tanggalPengajuan', 'ASC'], ['id', 'ASC']],
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'nama', 'email'],
        required: false,
      },
    ],
  });

  const rows = allPds.map((item) => toSheetRow(item.get({ plain: true }) as PlainPds));
  const values = [HEADERS, ...rows];

  const sheetId = await ensureSheetExists();
  await googleSheetsRequest(`/values/${encodeURIComponent(`'${SHEET_NAME}'!A:Z`)}:clear`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
  await googleSheetsRequest(`/values/${encodeURIComponent(`'${SHEET_NAME}'!A1`)}?valueInputOption=USER_ENTERED`, {
    method: 'PUT',
    body: JSON.stringify({ values }),
  });
  await formatSheet(values.length, sheetId);

  return {
    skipped: false,
    rows: rows.length,
    spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${process.env.GOOGLE_SHEETS_PDS_SPREADSHEET_ID}`,
  };
}

export async function syncPdsToGoogleSheetQuietly(context: string) {
  try {
    return await syncPdsToGoogleSheet();
  } catch (error) {
    console.error(`Sinkronisasi Google Sheet PDS gagal (${context}):`, error);
    return { skipped: true, reason: error instanceof Error ? error.message : 'Sinkronisasi gagal.' };
  }
}
