import { DataTypes } from 'sequelize';
import sequelize from '../lib/db';

const AgendaLampiran = sequelize.define('AgendaLampiran', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  agendaId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  namaFile: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  urlFile: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  tableName: 'agenda_lampiran',
  timestamps: true,
});

export default AgendaLampiran;