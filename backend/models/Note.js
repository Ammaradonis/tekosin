module.exports = (sequelize, DataTypes) => {
  const Note = sequelize.define('Note', {
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
    authorId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    type: {
      type: DataTypes.ENUM('general', 'confidential', 'medical', 'legal', 'emergency'),
      defaultValue: 'general'
    },
    title: { type: DataTypes.STRING, allowNull: false },
    content: { type: DataTypes.TEXT, allowNull: false },
    isConfidential: { type: DataTypes.BOOLEAN, defaultValue: false },
    isEncrypted: { type: DataTypes.BOOLEAN, defaultValue: false },
    metadata: { type: DataTypes.JSONB, allowNull: true }
  }, {
    tableName: 'notes',
    timestamps: true,
    paranoid: true
  });
  return Note;
};
