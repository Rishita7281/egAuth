const DEFAULT_AMQP_URL = 'amqp://localhost';
const EXCHANGE_KEY = 'key_exchange';
const RECONNECT_DELAY_MS = 5000;

function resolveAmqpUrl() {
  return (
    process.env.LAVINMQ_URL ||
    process.env.AMQP_URL ||
    process.env.RABBITMQ_URL ||
    DEFAULT_AMQP_URL
  );
}

function getBrokerName() {
  if (process.env.LAVINMQ_URL) {
    return 'LavinMQ';
  }

  if (process.env.AMQP_URL) {
    return 'AMQP broker';
  }

  if (process.env.RABBITMQ_URL) {
    return 'AMQP broker';
  }

  return 'local AMQP broker';
}

module.exports = {
  DEFAULT_AMQP_URL,
  EXCHANGE_KEY,
  RECONNECT_DELAY_MS,
  resolveAmqpUrl,
  getBrokerName,
};
