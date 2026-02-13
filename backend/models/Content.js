module.exports = (sequelize, DataTypes) => {
  const Content = sequelize.define('Content', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    authorId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'users', key: 'id' }
    },
    type: {
      type: DataTypes.ENUM('page', 'blog', 'document', 'media', 'announcement'),
      defaultValue: 'page'
    },
    title: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: { de: '', en: '', tr: '', ar: '', fa: '', es: '' }
    },
    slug: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false
    },
    body: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: { de: '', en: '', tr: '', ar: '', fa: '', es: '' }
    },
    excerpt: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: { de: '', en: '', tr: '', ar: '', fa: '', es: '' }
    },
    featuredImage: {
      type: DataTypes.STRING,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('draft', 'published', 'archived', 'review'),
      defaultValue: 'draft'
    },
    category: {
      type: DataTypes.STRING,
      allowNull: true
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    },
    version: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    publishedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true
    }
  }, {
    tableName: 'contents',
    timestamps: true,
    paranoid: true
  });

  return Content;
};
