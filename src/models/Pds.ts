// src/models/Pds.ts
import { DataTypes } from 'sequelize';
import sequelize from '../lib/db';

const Pds = sequelize.define('Pds', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  permohonan: {
    type: DataTypes.ENUM('PDS', 'LEMBUR', 'TRANSPORTASI'),
    allowNull: false
  },
  tanggalPengajuan: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  lokasi: { type: DataTypes.STRING, allowNull: false },
  keperluan: { type: DataTypes.STRING, allowNull: false },
  noAgenda: { type: DataTypes.STRING, allowNull: false },
  tglBerangkat: { type: DataTypes.DATE, allowNull: false },
  jamBerangkat: { type: DataTypes.STRING },
  tglKembali: { type: DataTypes.DATE, allowNull: false },
  jamKembali: { type: DataTypes.STRING },
  visitKe: { type: DataTypes.INTEGER, allowNull: false },
  keteranganVisit: {
    type: DataTypes.ENUM('PROGRESS', 'FINAL'),
    allowNull: false
  },
  ttdDigitalUrl: { type: DataTypes.STRING, allowNull: false },
  status: {
    type: DataTypes.ENUM('PENDING', 'APPROVED', 'SUBMITTED', 'COMPLETED'),
    defaultValue: 'PENDING'
  },
  buktiSubmittedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  nominalPDS: { 
    type: DataTypes.DECIMAL(15, 2), 
    allowNull: true 
  },
  so: { 
    type: DataTypes.STRING, 
    allowNull: true 
  },
  sps: { 
    type: DataTypes.STRING, 
    allowNull: true 
  },
  nomorPdsTrans: { 
    type: DataTypes.STRING, 
    allowNull: true 
  },
  statusPembayaran: {
    type: DataTypes.ENUM('BELUM_DIBAYAR', 'SUDAH_DIBAYAR'),
    allowNull: false,
    defaultValue: 'BELUM_DIBAYAR'
  },
  tanggalPembayaran: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'pds',
  timestamps: false
});

export default Pds;