module.exports = (sequelize, DataTypes) => {
  const PaypalSubscription = sequelize.define('PaypalSubscription', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    paypalSubscriptionId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    paypalPlanId: {
      type: DataTypes.STRING,
      allowNull: false
    },
    memberId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'members', key: 'id' }
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'users', key: 'id' }
    },
    status: {
      type: DataTypes.ENUM('APPROVAL_PENDING', 'APPROVED', 'ACTIVE', 'SUSPENDED', 'CANCELLED', 'EXPIRED'),
      defaultValue: 'APPROVAL_PENDING'
    },
    planName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'EUR'
    },
    frequency: {
      type: DataTypes.ENUM('MONTHLY', 'YEARLY'),
      defaultValue: 'MONTHLY'
    },
    subscriberEmail: {
      type: DataTypes.STRING,
      allowNull: true
    },
    subscriberName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    nextBillingDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    cancelledAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    cancelReason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    approvalUrl: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    rawPayload: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    lastWebhookData: {
      type: DataTypes.JSONB,
      allowNull: true
    }
  }, {
    tableName: 'paypal_subscriptions',
    timestamps: true,
    indexes: [
      { fields: ['paypalSubscriptionId'] },
      { fields: ['paypalPlanId'] },
      { fields: ['memberId'] },
      { fields: ['status'] }
    ]
  });

  return PaypalSubscription;
};
