module.exports = (sequelize, DataTypes) => {
  const Newsletter = sequelize.define('Newsletter', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    subject: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: { de: '', en: '', tr: '', ar: '', fa: '', es: '' }
    },
    body: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: { de: '', en: '', tr: '', ar: '', fa: '', es: '' }
    },
    status: {
      type: DataTypes.ENUM('draft', 'scheduled', 'sent', 'cancelled'),
      defaultValue: 'draft'
    },
    recipientCount: { type: DataTypes.INTEGER, defaultValue: 0 },
    sentAt: { type: DataTypes.DATE, allowNull: true },
    scheduledFor: { type: DataTypes.DATE, allowNull: true },
    template: { type: DataTypes.STRING, allowNull: true },
    metadata: { type: DataTypes.JSONB, allowNull: true }
  }, {
    tableName: 'newsletters',
    timestamps: true
  });
  return Newsletter;
};
