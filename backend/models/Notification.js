module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define('Notification', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'users', key: 'id' }
    },
    type: {
      type: DataTypes.ENUM('info', 'warning', 'error', 'success', 'urgent'),
      defaultValue: 'info'
    },
    channel: {
      type: DataTypes.ENUM('in_app', 'email', 'sms'),
      defaultValue: 'in_app'
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    readAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    actionUrl: {
      type: DataTypes.STRING,
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    scheduledFor: {
      type: DataTypes.DATE,
      allowNull: true
    },
    sentAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'notifications',
    timestamps: true
  });

  return Notification;
};
