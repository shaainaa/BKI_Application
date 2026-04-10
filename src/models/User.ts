// src/models/User.ts
import { DataTypes } from 'sequelize';
import sequelize from '../lib/db';

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  nama: { type: DataTypes.STRING, allowNull: false },
  username: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  jabatanSurveyor: { type: DataTypes.STRING },
  noTelp: { type: DataTypes.STRING },
  noRekening: { type: DataTypes.STRING },
  jenisBank: { type: DataTypes.STRING },
  role: { 
    type: DataTypes.ENUM('SURVEYOR', 'ADMIN'),
    defaultValue: 'SURVEYOR' 
  }
}, {
  tableName: 'user', // Sesuai nama tabel di phpMyAdmin
  timestamps: false
});

export default User;