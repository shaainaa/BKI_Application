import { DataTypes } from 'sequelize';
import sequelize from '../lib/db';
import User from './User';
import AgendaLampiran from './AgendaLampiran';

const Agenda = sequelize.define('Agenda', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  title: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT },
  start: { type: DataTypes.DATE, allowNull: false },
  end: { type: DataTypes.DATE, allowNull: false },
  category: {
    type: DataTypes.ENUM('RAPAT', 'DINAS', 'Familiarisasi Dokumen Teknik', 'URGENT', 'EVENT', 'LAINNYA'),
    defaultValue: 'RAPAT'
  },
  suratFileUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  suratNamaFile: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  lampiranFiles: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  fileUrl: {
    type: DataTypes.STRING,
    allowNull: true, // Opsional jika agenda tidak pakai lampiran
  },
  createdBy: { type: DataTypes.INTEGER }
}, {
  tableName: 'agendas',
  timestamps: true
});

// Relasi
if (!Agenda.associations.user) {
  Agenda.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
}

if (!Agenda.associations.lampiranList) {
  Agenda.hasMany(AgendaLampiran, { foreignKey: 'agendaId', as: 'lampiranList' });
}

export default Agenda;