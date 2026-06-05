import { DataTypes } from 'sequelize';
import sequelize from '@/lib/db';

const Session = sequelize.define('Session', {
  id: {
    type: DataTypes.STRING(64),
    primaryKey: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  lastSeenAt: {
    type: DataTypes.DATE,
    allowNull: false,
  },
}, {
  tableName: 'sessions',
  timestamps: true,
});

export default Session;
