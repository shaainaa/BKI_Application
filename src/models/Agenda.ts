import { DataTypes } from 'sequelize';
import sequelize from '../lib/db';
import User from './User';

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
    type: DataTypes.ENUM('RAPAT', 'DINAS', 'URGENT', 'EVENT', 'LAINNYA'),
    defaultValue: 'RAPAT'
  },
  color: { type: DataTypes.STRING, defaultValue: '#0A8E9A' },
  fileUrl: {
    type: DataTypes.STRING,
    allowNull: true, // Opsional jika agenda tidak pakai lampiran
  },
  namaFile: {
    type: DataTypes.STRING,
    allowNull: true,
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

export default Agenda;