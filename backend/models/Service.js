module.exports = (sequelize, DataTypes) => {
  const Service = sequelize.define('Service', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    memberId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'members', key: 'id' }
    },
    type: {
      type: DataTypes.ENUM('counseling', 'language_course', 'social_activity', 'health_referral', 'peer_support', 'other'),
      defaultValue: 'other'
    },
    name: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    status: {
      type: DataTypes.ENUM('active', 'completed', 'pending', 'cancelled'),
      defaultValue: 'pending'
    },
    startDate: { type: DataTypes.DATEONLY, allowNull: true },
    endDate: { type: DataTypes.DATEONLY, allowNull: true },
    provider: { type: DataTypes.STRING, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    metadata: { type: DataTypes.JSONB, allowNull: true }
  }, {
    tableName: 'services',
    timestamps: true
  });
  return Service;
};
