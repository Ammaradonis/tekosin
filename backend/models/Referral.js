module.exports = (sequelize, DataTypes) => {
  const Referral = sequelize.define('Referral', {
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
    referredTo: { type: DataTypes.STRING, allowNull: false },
    organization: { type: DataTypes.STRING, allowNull: true },
    type: {
      type: DataTypes.ENUM('medical', 'legal', 'psychological', 'social', 'housing_info', 'other'),
      defaultValue: 'other'
    },
    status: {
      type: DataTypes.ENUM('pending', 'accepted', 'completed', 'declined'),
      defaultValue: 'pending'
    },
    reason: { type: DataTypes.TEXT, allowNull: true },
    outcome: { type: DataTypes.TEXT, allowNull: true },
    referralDate: { type: DataTypes.DATEONLY, allowNull: true },
    followUpDate: { type: DataTypes.DATEONLY, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    metadata: { type: DataTypes.JSONB, allowNull: true }
  }, {
    tableName: 'referrals',
    timestamps: true
  });
  return Referral;
};
