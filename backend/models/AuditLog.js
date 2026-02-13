module.exports = (sequelize, DataTypes) => {
  const AuditLog = sequelize.define('AuditLog', {
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
    action: {
      type: DataTypes.STRING,
      allowNull: false
    },
    entity: {
      type: DataTypes.STRING,
      allowNull: true
    },
    entityId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    oldValues: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    newValues: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    ipAddress: {
      type: DataTypes.STRING,
      allowNull: true
    },
    userAgent: {
      type: DataTypes.STRING,
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true
    }
  }, {
    tableName: 'audit_logs',
    timestamps: true,
    updatedAt: false
  });

  return AuditLog;
};
