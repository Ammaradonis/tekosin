module.exports = (sequelize, DataTypes) => {
  const Volunteer = sequelize.define('Volunteer', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    eventId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'events', key: 'id' }
    },
    firstName: { type: DataTypes.STRING, allowNull: false },
    lastName: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: true },
    phone: { type: DataTypes.STRING, allowNull: true },
    skills: { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },
    availability: { type: DataTypes.JSONB, allowNull: true },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'pending'),
      defaultValue: 'pending'
    },
    hoursLogged: { type: DataTypes.DECIMAL(8, 2), defaultValue: 0 },
    notes: { type: DataTypes.TEXT, allowNull: true }
  }, {
    tableName: 'volunteers',
    timestamps: true
  });
  return Volunteer;
};
