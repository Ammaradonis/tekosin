module.exports = (sequelize, DataTypes) => {
  const Member = sequelize.define('Member', {
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
    firstName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: { isEmail: true }
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true
    },
    dateOfBirth: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    gender: {
      type: DataTypes.STRING,
      allowNull: true
    },
    pronouns: {
      type: DataTypes.STRING,
      allowNull: true
    },
    nationality: {
      type: DataTypes.STRING,
      allowNull: true
    },
    countryOfOrigin: {
      type: DataTypes.STRING,
      allowNull: true
    },
    languages: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    city: {
      type: DataTypes.STRING,
      defaultValue: 'Wien'
    },
    postalCode: {
      type: DataTypes.STRING,
      allowNull: true
    },
    asylumStatus: {
      type: DataTypes.ENUM('pending', 'subsidiary_protection', 'asylum_granted', 'rejected', 'appeal', 'humanitarian_stay', 'other'),
      allowNull: true
    },
    asylumApplicationDate: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    membershipStatus: {
      type: DataTypes.ENUM('active', 'pending', 'inactive', 'suspended', 'archived'),
      defaultValue: 'pending'
    },
    membershipDate: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    membershipType: {
      type: DataTypes.ENUM('regular', 'supporting', 'honorary'),
      defaultValue: 'regular'
    },
    emergencyContactName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    emergencyContactPhone: {
      type: DataTypes.STRING,
      allowNull: true
    },
    emergencyContactRelation: {
      type: DataTypes.STRING,
      allowNull: true
    },
    healthNotes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    specialNeeds: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    interests: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    },
    skills: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    isConfidential: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    gdprConsent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    gdprConsentDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    photoConsent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    dataRetentionExpiry: {
      type: DataTypes.DATE,
      allowNull: true
    },
    encryptedData: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'members',
    timestamps: true,
    paranoid: true
  });

  return Member;
};
