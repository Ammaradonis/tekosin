module.exports = (sequelize, DataTypes) => {
  const Payment = sequelize.define('Payment', {
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
    paypalOrderId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    paypalSubscriptionId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'EUR'
    },
    type: {
      type: DataTypes.ENUM('one_time', 'recurring', 'subscription', 'refund'),
      defaultValue: 'one_time'
    },
    status: {
      type: DataTypes.ENUM('pending', 'completed', 'failed', 'refunded', 'cancelled'),
      defaultValue: 'pending'
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true
    },
    payerEmail: {
      type: DataTypes.STRING,
      allowNull: true
    },
    payerName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    ipnData: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    refundReason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    refundedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    retryCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    lastError: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true
    }
  }, {
    tableName: 'payments',
    timestamps: true
  });

  return Payment;
};
