import { DataTypes } from 'sequelize';
import sequelize from '@/lib/db';

const Tagihan = sequelize.define('Tagihan', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  nomorInvoice: {
    type: DataTypes.STRING(128),
    allowNull: false,
  },
  vendor: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  kategori: {
    type: DataTypes.STRING(128),
    allowNull: false,
  },
  tanggalInvoice: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  tanggalDiterima: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  tanggalJatuhTempo: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  nominal: {
    type: DataTypes.DECIMAL(18, 2),
    allowNull: false,
    defaultValue: 0,
  },
  keterangan: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  invoiceFileUrl: {
    type: DataTypes.STRING(512),
    allowNull: false,
  },
  invoiceFileName: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('MENUNGGU_EVALUASI', 'DISETUJUI', 'PERLU_REVISI', 'DITOLAK', 'SELESAI'),
    allowNull: false,
    defaultValue: 'MENUNGGU_EVALUASI',
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  evaluatedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  evaluatedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  evaluationNotes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  tanggalPembayaran: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  paymentProofUrl: {
    type: DataTypes.STRING(512),
    allowNull: true,
  },
  paymentProofName: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  paymentNotes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'tagihan_masuk',
  timestamps: true,
});

let tagihanSchemaReady: Promise<void> | null = null;

export async function ensureTagihanSchema() {
  tagihanSchemaReady ??= Tagihan.sync().then(() => undefined);
  return tagihanSchemaReady;
}

export default Tagihan;
