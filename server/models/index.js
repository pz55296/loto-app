const { Sequelize, DataTypes } = require('sequelize');

const needSSL = process.env.DATABASE_URL.includes('render.com') || process.env.RENDER === 'true';


const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: needSSL ? { ssl: { require: true } } : {}
});

const Round = sequelize.define('Round', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  active: { type: DataTypes.BOOLEAN, defaultValue: true },
  drawn_numbers: { type: DataTypes.ARRAY(DataTypes.INTEGER) },
  closedAt: { type: DataTypes.DATE, allowNull: true }
}, {
  timestamps: true
});

const Ticket = sequelize.define('Ticket', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  personal_id: { type: DataTypes.STRING(20), allowNull: false },
  numbers: { type: DataTypes.ARRAY(DataTypes.INTEGER), allowNull: false }
}, {
  timestamps: true
});

Round.hasMany(Ticket, { foreignKey: 'roundId' });
Ticket.belongsTo(Round, { foreignKey: 'roundId' });

module.exports = { sequelize, Round, Ticket };
