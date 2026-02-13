module.exports = (sequelize, DataTypes) => {
  const Document = sequelize.define('Document', {
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
      type: DataTypes.ENUM('id_document', 'asylum_paper', 'medical', 'legal', 'other'),
      defaultValue: 'other'
    },
    name: { type: DataTypes.STRING, allowNull: false },
    filePath: { type: DataTypes.STRING, allowNull: true },
    mimeType: { type: DataTypes.STRING, allowNull: true },
    size: { type: DataTypes.INTEGER, allowNull: true },
    isEncrypted: { type: DataTypes.BOOLEAN, defaultValue: true },
    expiryDate: { type: DataTypes.DATEONLY, allowNull: true },
    status: {
      type: DataTypes.ENUM('valid', 'expired', 'pending_review', 'archived'),
      defaultValue: 'valid'
    },
    metadata: { type: DataTypes.JSONB, allowNull: true }
  }, {
    tableName: 'documents',
    timestamps: true,
    paranoid: true
  });
  return Document;
};
