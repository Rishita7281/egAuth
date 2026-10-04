const crypto = require('crypto');
const { setupLavinMQ, getKeyChannel, EXCHANGE_KEY } = require('./lavinMQ');
const { encryptWithRSA } = require('./rsaEncode');
const { getRedisClient } = require('./redis');

const rsakey = process.env.RSAPUBLIC;
let latestEncryptedKeyBundle = null;

if (!rsakey) {
  console.error('RSA Public Key not found in environment variables.');
  process.exit(1);
}

// Function to generate AES-256 Key
function generateAES256Key() {
  const key = crypto.randomBytes(32).toString('hex'); // 32 bytes (256 bits)
  return key;
}

// Function to generate IV (Initialization Vector)
function generateIV() {
  const iv = crypto.randomBytes(16).toString('hex'); // 16 bytes (128 bits)
  return iv;
}


async function generateAndPublishKey() {
  try {
    const keyId = crypto.randomUUID();
    const key = encryptWithRSA(generateAES256Key());
    const iv = encryptWithRSA(generateIV());
    const timestamp = new Date().toISOString();
    const payload = JSON.stringify({ keyId, key, iv, timestamp });

    latestEncryptedKeyBundle = { keyId, key, iv, timestamp };

    const channel = getKeyChannel();
    if (!channel) {
      console.error('LavinMQ channel is not initialized.');
      return;
    }

    channel.publish(EXCHANGE_KEY, '', Buffer.from(payload, 'utf-8')); // Ensure utf-8 encoding
    console.log('Published Key and IV update');

    const redis = getRedisClient();
    if (redis) {
      try {
        await redis.setEx('egauth:keybundle', 600, payload);
      } catch (err) {
        console.error('Error saving key bundle to Redis:', err.message);
      }
    }
  } catch (error) {
    console.error('Error publishing key:', error.message);
  }
}

const setupKeyChannel = async () => {
  try {
    await generateAndPublishKey(); // First execution
    setInterval(async () => {
      await generateAndPublishKey(); // Repeat every 5 minutes
    }, 5 * 60 * 1000);
  } catch (err) {
    console.error('Error during setup:', err.message);
    process.exit(1);
  } 
};

const getLatestEncryptedKeyBundle = () => latestEncryptedKeyBundle;

module.exports = { setupLavinMQ, setupKeyChannel, getLatestEncryptedKeyBundle };
