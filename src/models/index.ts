// src/models/index.ts (Sangat disarankan buat file ini)
import User from './User';
import Pds from './Pds';
import Session from './Session';

User.hasMany(Pds, { foreignKey: 'userId' });
Pds.belongsTo(User, { foreignKey: 'userId', as: 'User' });
User.hasMany(Session, { foreignKey: 'userId' });
Session.belongsTo(User, { foreignKey: 'userId', as: 'user' });

export { User, Pds, Session };
