module.exports = (sequelize, DataTypes) => {
  const Event = sequelize.define('Event', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    title: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: { de: '', en: '', tr: '', ar: '', fa: '', es: '' }
    },
    description: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: { de: '', en: '', tr: '', ar: '', fa: '', es: '' }
    },
    type: {
      type: DataTypes.ENUM('meeting', 'workshop', 'social', 'fundraiser', 'support_group', 'training', 'other'),
      defaultValue: 'meeting'
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    location: {
      type: DataTypes.STRING,
      allowNull: true
    },
    isOnline: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    onlineLink: {
      type: DataTypes.STRING,
      allowNull: true
    },
    maxParticipants: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    currentParticipants: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    status: {
      type: DataTypes.ENUM('planned', 'active', 'completed', 'cancelled'),
      defaultValue: 'planned'
    },
    isPublic: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true
    }
  }, {
    tableName: 'events',
    timestamps: true
  });

  return Event;
};
