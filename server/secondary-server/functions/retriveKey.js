const { setupLavinMQConnection, getKeyChannel, EXCHANGE_KEY } = require('./lavinMQ');
const { decryptWithRSA } = require('./rsaDecode');
const EventEmitter = require('events');
const { getRedisClient } = require('./redis');
const { RECONNECT_DELAY_MS } = require('../../shared/messaging/amqpConfig');
const { getInternalProxySecret } = require('../../shared/proxy/auth');

const KEY_TTL_MS = 5 * 60 * 1000;
const DEFAULT_MAIN_SERVER_URL = `http://localhost:${Number(process.env.MAIN_SERVER_PORT || process.env.PORT) || 8000}`;

let key = null;
let iv = null;
let keyId = null;
let keyTimestamp = null;
let prevKey = null;
let prevIv = null;
let prevKeyId = null;
let prevKeyTimestamp = null;
const keyEvents = new EventEmitter();
let consumerChannel = null;
let consumerRetryTimer = null;

const isKeyBundleReady = () => Boolean(key && iv && keyId);

const setKeyBundle = ({ key: nextKey, iv: nextIv, keyId: nextKeyId, timestamp }) => {
  if (key && iv) {
    prevKey = key;
    prevIv = iv;
    prevKeyId = keyId;
    prevKeyTimestamp = keyTimestamp;
  }

  key = nextKey;
  iv = nextIv;
  keyId = nextKeyId;
  keyTimestamp = timestamp;
};

const applyEncryptedKeyBundle = (payload) => {
  if (!payload?.key || !payload?.iv || !payload?.keyId) {
    return false;
  }

  if (!process.env.RSAPRIVATE) {
    console.error('RSA Private Key not found in environment variables.');
    return false;
  }

  const decryptedKey = decryptWithRSA(payload.key);
  const decryptedIv = decryptWithRSA(payload.iv);

  setKeyBundle({
    key: decryptedKey,
    iv: decryptedIv,
    keyId: payload.keyId,
    timestamp: payload.timestamp || new Date().toISOString(),
  });

  keyEvents.emit('updated', { key, iv, keyId, timestamp: keyTimestamp });
  return true;
};

const loadKeyBundleFromRedis = async () => {
  const client = getRedisClient();
  if (!client) return;
  try {
    const payload = await client.get('egauth:keybundle');
    if (!payload) return;
    const parsed = JSON.parse(payload);
    applyEncryptedKeyBundle(parsed);
  } catch (err) {
    console.error('Error loading key bundle from Redis:', err.message);
  }
};

const resolveMainServerUrl = () => {
  const rawUrl = process.env.MAIN_SERVER_URL || process.env.TARGET_MAIN_URL || DEFAULT_MAIN_SERVER_URL;
  return rawUrl.replace(/\/+$/, '');
};

const loadKeyBundleFromMainServer = async () => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);

  try {
    const response = await fetch(`${resolveMainServerUrl()}/internal/key-bundle`, {
      headers: {
        Accept: 'application/json',
        'x-egauth-proxy-secret': getInternalProxySecret(),
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      return;
    }

    const payload = await response.json();
    applyEncryptedKeyBundle(payload);
  } catch (err) {
    const message = err?.name === 'AbortError' ? 'Request timed out' : err.message;
    console.error('Error loading key bundle from main server:', message);
  } finally {
    clearTimeout(timeout);
  }
};

const waitForKeyBundle = (timeoutMs = 2500) => new Promise((resolve) => {
  if (isKeyBundleReady()) {
    resolve(true);
    return;
  }

  const onUpdated = () => {
    clearTimeout(timer);
    resolve(true);
  };

  const timer = setTimeout(() => {
    keyEvents.off('updated', onUpdated);
    resolve(isKeyBundleReady());
  }, timeoutMs);

  keyEvents.once('updated', onUpdated);
});

const ensureKeyBundleReady = async (timeoutMs = 2500) => {
  if (isKeyBundleReady()) {
    return true;
  }

  await loadKeyBundleFromRedis();
  if (isKeyBundleReady()) {
    return true;
  }

  await loadKeyBundleFromMainServer();
  if (isKeyBundleReady()) {
    return true;
  }

  return waitForKeyBundle(timeoutMs);
};

const scheduleConsumerRetry = () => {
  if (consumerRetryTimer) {
    return;
  }

  consumerRetryTimer = setTimeout(async () => {
    consumerRetryTimer = null;
    await setupConsumer();
  }, RECONNECT_DELAY_MS);
};

async function setupConsumer() {
  try {
    const keyChannel = getKeyChannel();
    if (!keyChannel) {
      console.error("LavinMQ channel not initialized.");
      scheduleConsumerRetry();
      return;
    }

    if (consumerChannel === keyChannel) {
      return;
    }

    consumerChannel = keyChannel;
    consumerChannel.once('close', () => {
      if (consumerChannel === keyChannel) {
        consumerChannel = null;
        scheduleConsumerRetry();
      }
    });

    const { queue } = await keyChannel.assertQueue('', { exclusive: true });

    // Bind the queue to the exchange
    await keyChannel.bindQueue(queue, EXCHANGE_KEY, '');
    console.log(`Consumer bound to exchange: ${EXCHANGE_KEY}`);

    // Consume messages as they arrive
    keyChannel.consume(
      queue,
      (msg) => {
        if (msg) {
          try {
            let messageContent = JSON.parse(msg.content.toString('utf-8')); // Convert buffer to string before parsing JSON
            console.log('Received key update message');
            applyEncryptedKeyBundle(messageContent);

            // Acknowledge the message
            keyChannel.ack(msg);
          } catch (error) {
            console.error("Error processing message:", error.message);
          }
        }
      },
      { noAck: false } // Require manual acknowledgment
    );

    console.log('Consumer is waiting for messages...');

    if (!key || !iv) {
      await loadKeyBundleFromRedis();
    }

    if (!key || !iv) {
      await loadKeyBundleFromMainServer();
    }
  } catch (err) {
    console.error('Error setting up consumer:', err.message);
    consumerChannel = null;
    scheduleConsumerRetry();
  }
}

const getKey = () => key;
const getIV = () => iv;
const getKeyId = () => keyId;
const getKeyTimestamp = () => keyTimestamp;
const getKeyBundle = () => {
  const bundles = [];
  if (key && iv && keyId) {
    bundles.push({ key, iv, keyId, timestamp: keyTimestamp });
  }
  if (prevKey && prevIv && prevKeyId) {
    const age = Date.now() - new Date(prevKeyTimestamp || 0).getTime();
    if (age <= KEY_TTL_MS) {
      bundles.push({ key: prevKey, iv: prevIv, keyId: prevKeyId, timestamp: prevKeyTimestamp });
    }
  }
  return bundles;
};

module.exports = {
  setupLavinMQConnection,
  setupConsumer,
  ensureKeyBundleReady,
  getKey,
  getIV,
  getKeyId,
  getKeyTimestamp,
  getKeyBundle,
  keyEvents,
};
