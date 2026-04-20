// models/BuktiPds.js
import { DataTypes } from 'sequelize';// Sesuaikan dengan path koneksi DB-mu
import Pds from './Pds'; // Import model Pds-mu
import sequelize from '@/lib/db';

const BuktiPds = sequelize.define('BuktiPds', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  pdsId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Pds,
      key: 'id'
    }
  },
  kategori: {
    type: DataTypes.ENUM('SURVEY', 'FOTO', 'TRANSPORTASI', 'PENGINAPAN', 'LAINNYA'),
    allowNull: false,
  },
  fileUrl: {
    type: DataTypes.STRING,
    allowNull: false, // Untuk menyimpan path/URL file-nya
  },
  namaFile: {
    type: DataTypes.STRING, // Opsional: menyimpan nama asli file
  },
  verificationStatus: {
    type: DataTypes.ENUM('PENDING', 'DITERIMA', 'DIREJECT'),
    allowNull: false,
    defaultValue: 'PENDING'
  },
  verificationNotes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  verifiedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  verifiedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
  }
}, {
  tableName: 'bukti_pds',
  timestamps: true, // Otomatis bikin createdAt & updatedAt
});

// Setup Relasi (Bisa ditaruh di file index models jika kamu pakai asosiasi terpusat)
Pds.hasMany(BuktiPds, { foreignKey: 'pdsId', as: 'bukti' });
BuktiPds.belongsTo(Pds, { foreignKey: 'pdsId', as: 'pds' });

export default BuktiPds;