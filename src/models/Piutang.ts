import { DataTypes } from 'sequelize';
import sequelize from '@/lib/db';

export const Customer = sequelize.define('Customer', {
  customer_number: {
    type: DataTypes.STRING(64),
    primaryKey: true,
    allowNull: false,
  },
  nama_perusahaan: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
}, {
  tableName: 'customers',
  timestamps: false,
});

export const CustomerObject = sequelize.define('CustomerObject', {
  object_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  customer_number: {
    type: DataTypes.STRING(64),
    allowNull: false,
  },
  nama_objek: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
}, {
  tableName: 'customer_objects',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['customer_number', 'nama_objek'],
      name: 'customer_objects_customer_object_unique',
    },
  ],
});

export const CustomerInvoice = sequelize.define('CustomerInvoice', {
  invoice_number: {
    type: DataTypes.STRING(128),
    primaryKey: true,
    allowNull: false,
  },
  object_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  document_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  posting_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  nominal_tagihan: {
    type: DataTypes.DECIMAL(18, 2),
    allowNull: false,
    defaultValue: 0,
  },
  nominal_angsuran: {
    type: DataTypes.DECIMAL(18, 2),
    allowNull: false,
    defaultValue: 0,
  },
  saldo_piutang: {
    type: DataTypes.DECIMAL(18, 2),
    allowNull: false,
    defaultValue: 0,
  },
  umur_piutang_hari: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  kategori_risiko: {
    type: DataTypes.STRING(64),
    allowNull: false,
  },
  status_pelunasan: {
    type: DataTypes.STRING(64),
    allowNull: false,
  },
}, {
  tableName: 'customer_invoices',
  timestamps: false,
});

Customer.hasMany(CustomerObject, { foreignKey: 'customer_number', as: 'objects' });
CustomerObject.belongsTo(Customer, { foreignKey: 'customer_number', as: 'customer' });
CustomerObject.hasMany(CustomerInvoice, { foreignKey: 'object_id', as: 'invoices' });
CustomerInvoice.belongsTo(CustomerObject, { foreignKey: 'object_id', as: 'object' });

let piutangSchemaReady: Promise<void> | null = null;

export async function ensurePiutangSchema() {
  piutangSchemaReady ??= (async () => {
    await Customer.sync();
    await CustomerObject.sync();
    await CustomerInvoice.sync();
  })();

  return piutangSchemaReady;
}
