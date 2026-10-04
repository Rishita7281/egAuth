const amqp = require('amqplib');
const {
  EXCHANGE_KEY,
  RECONNECT_DELAY_MS,
  getBrokerName,
  resolveAmqpUrl,
} = require('../../shared/messaging/amqpConfig');

let connection;
let keyChannel;
let reconnectTimer;

function scheduleReconnect() {
  if (reconnectTimer) {
    return;
  }

  reconnectTimer = setTimeout(async () => {
    reconnectTimer = null;
    await setupLavinMQConnection();
  }, RECONNECT_DELAY_MS);
}

async function setupKeyChannel() {
  if (!connection) {
    return null;
  }

  if (keyChannel) {
    return keyChannel;
  }

  try {
    keyChannel = await connection.createChannel();
    await keyChannel.assertExchange(EXCHANGE_KEY, 'fanout', { durable: true });
    console.log(`Key channel setup complete for exchange: ${EXCHANGE_KEY}`);

    keyChannel.on('error', (err) => {
      console.error('Key channel error:', err.message);
      keyChannel = null;
      scheduleReconnect();
    });

    keyChannel.on('close', () => {
      keyChannel = null;
    });

    return keyChannel;
  } catch (err) {
    console.error('Error setting up key channel:', err.message);
    keyChannel = null;
    scheduleReconnect();
    return null;
  }
}

async function setupLavinMQConnection() {
  if (connection) {
    return connection;
  }

  const brokerName = getBrokerName();

  try {
    connection = await amqp.connect(resolveAmqpUrl());
    console.log(`${brokerName} connection established.`);

    connection.on('error', (err) => {
      console.error(`${brokerName} connection error:`, err.message);
      connection = null;
      keyChannel = null;
      scheduleReconnect();
    });

    connection.on('close', () => {
      console.error(`${brokerName} connection closed. Reconnecting...`);
      connection = null;
      keyChannel = null;
      scheduleReconnect();
    });

    await setupKeyChannel();
    return connection;
  } catch (err) {
    console.error(`Error setting up ${brokerName} connection:`, err.message);
    connection = null;
    keyChannel = null;
    scheduleReconnect();
    return null;
  }
}

module.exports = {
  setupLavinMQConnection,
  getKeyChannel: () => keyChannel,
  EXCHANGE_KEY,
};
