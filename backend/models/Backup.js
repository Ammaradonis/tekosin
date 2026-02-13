module.exports = (sequelize, DataTypes) => {
  const Backup = sequelize.define('Backup', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: { type: DataTypes.STRING, allowNull: false },
    type: {
      type: DataTypes.ENUM('full', 'incremental', 'manual'),
      defaultValue: 'manual'
    },
    status: {
      type: DataTypes.ENUM('pending', 'completed', 'failed'),
      defaultValue: 'pending'
    },
    size: { type: DataTypes.BIGINT, allowNull: true },
    filePath: { type: DataTypes.STRING, allowNull: true },
    completedAt: { type: DataTypes.DATE, allowNull: true },
    metadata: { type: DataTypes.JSONB, allowNull: true }
  }, {
    tableName: 'backups',
    timestamps: true
  });
  return Backup;
};
