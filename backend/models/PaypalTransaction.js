module.exports = (sequelize, DataTypes) => {
  const PaypalTransaction = sequelize.define('PaypalTransaction', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    paypalOrderId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    paypalCaptureId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    paypalRefundId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    paymentId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'payments', key: 'id' }
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
    type: {
      type: DataTypes.ENUM('order', 'capture', 'refund', 'subscription_payment', 'webhook_event'),
      defaultValue: 'order'
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'CREATED'
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'EUR'
    },
    payerEmail: {
      type: DataTypes.STRING,
      allowNull: true
    },
    payerName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true
    },
    rawPayload: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    errorPayload: {
      type: DataTypes.JSONB,
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
    webhookEventId: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true
    },
    webhookEventType: {
      type: DataTypes.STRING,
      allowNull: true
    },
    ipAddress: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    tableName: 'paypal_transactions',
    timestamps: true,
    indexes: [
      { fields: ['paypalOrderId'] },
      { fields: ['paypalCaptureId'] },
      { fields: ['paymentId'] },
      { fields: ['webhookEventId'] },
      { fields: ['status'] },
      { fields: ['createdAt'] }
    ]
  });

  return PaypalTransaction;
};
