const { Sequelize } = require('sequelize');
const config = require('../config/database');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

let sequelize;
if (process.env.DATABASE_URL) {
  const dbUrl = process.env.DATABASE_URL;
  const useSSL = !dbUrl.includes('sslmode=disable') && process.env.DB_SSL !== 'false';
  sequelize = new Sequelize(dbUrl, {
    dialect: 'postgres',
    logging: false,
    dialectOptions: useSSL ? { ssl: { require: true, rejectUnauthorized: false } } : {},
    pool: { max: 5, min: 1, acquire: 30000, idle: 10000 }
  });
} else {
  sequelize = new Sequelize(
    dbConfig.database,
    dbConfig.username,
    dbConfig.password,
    {
      host: dbConfig.host,
      port: dbConfig.port,
      dialect: dbConfig.dialect,
      logging: dbConfig.logging,
      pool: dbConfig.pool
    }
  );
}

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Import models
db.User = require('./User')(sequelize, Sequelize);
db.Member = require('./Member')(sequelize, Sequelize);
db.Payment = require('./Payment')(sequelize, Sequelize);
db.Content = require('./Content')(sequelize, Sequelize);
db.Notification = require('./Notification')(sequelize, Sequelize);
db.AuditLog = require('./AuditLog')(sequelize, Sequelize);
db.Event = require('./Event')(sequelize, Sequelize);
db.Volunteer = require('./Volunteer')(sequelize, Sequelize);
db.Document = require('./Document')(sequelize, Sequelize);
db.Note = require('./Note')(sequelize, Sequelize);
db.Service = require('./Service')(sequelize, Sequelize);
db.Referral = require('./Referral')(sequelize, Sequelize);
db.Newsletter = require('./Newsletter')(sequelize, Sequelize);
db.Backup = require('./Backup')(sequelize, Sequelize);
db.PaypalTransaction = require('./PaypalTransaction')(sequelize, Sequelize);
db.PaypalSubscription = require('./PaypalSubscription')(sequelize, Sequelize);

// Associations
// User -> AuditLog
db.User.hasMany(db.AuditLog, { foreignKey: 'userId' });
db.AuditLog.belongsTo(db.User, { foreignKey: 'userId' });

// User -> Member (a user can be linked to a member profile)
db.User.hasOne(db.Member, { foreignKey: 'userId' });
db.Member.belongsTo(db.User, { foreignKey: 'userId' });

// Member -> Payment
db.Member.hasMany(db.Payment, { foreignKey: 'memberId' });
db.Payment.belongsTo(db.Member, { foreignKey: 'memberId' });

// Member -> Document
db.Member.hasMany(db.Document, { foreignKey: 'memberId' });
db.Document.belongsTo(db.Member, { foreignKey: 'memberId' });

// Member -> Note
db.Member.hasMany(db.Note, { foreignKey: 'memberId' });
db.Note.belongsTo(db.Member, { foreignKey: 'memberId' });

// Member -> Referral
db.Member.hasMany(db.Referral, { foreignKey: 'memberId' });
db.Referral.belongsTo(db.Member, { foreignKey: 'memberId' });

// User -> Content
db.User.hasMany(db.Content, { foreignKey: 'authorId' });
db.Content.belongsTo(db.User, { foreignKey: 'authorId', as: 'author' });

// User -> Notification
db.User.hasMany(db.Notification, { foreignKey: 'userId' });
db.Notification.belongsTo(db.User, { foreignKey: 'userId' });

// Event -> Volunteer (many-to-many through a join)
db.Event.hasMany(db.Volunteer, { foreignKey: 'eventId' });
db.Volunteer.belongsTo(db.Event, { foreignKey: 'eventId' });

// Member -> Service
db.Member.hasMany(db.Service, { foreignKey: 'memberId' });
db.Service.belongsTo(db.Member, { foreignKey: 'memberId' });

// PaypalTransaction associations
db.PaypalTransaction.belongsTo(db.Payment, { foreignKey: 'paymentId' });
db.Payment.hasMany(db.PaypalTransaction, { foreignKey: 'paymentId' });
db.PaypalTransaction.belongsTo(db.Member, { foreignKey: 'memberId' });
db.PaypalTransaction.belongsTo(db.User, { foreignKey: 'userId' });

// PaypalSubscription associations
db.PaypalSubscription.belongsTo(db.Member, { foreignKey: 'memberId' });
db.Member.hasMany(db.PaypalSubscription, { foreignKey: 'memberId' });
db.PaypalSubscription.belongsTo(db.User, { foreignKey: 'userId' });

module.exports = db;
