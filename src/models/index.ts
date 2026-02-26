// src/models/index.ts (Sangat disarankan buat file ini)
import User from './User';
import Pds from './Pds';

User.hasMany(Pds, { foreignKey: 'userId' });
Pds.belongsTo(User, { foreignKey: 'userId', as: 'User' });

export { User, Pds };