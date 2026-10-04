const { createClient } = require('redis');

let client = null;

const getRedisClient = () => {
  if (client) return client;
  const url = process.env.REDIS_URL;
  if (!url) return null;
  client = createClient({ url });
  client.on('error', (err) => console.error('Redis error:', err.message));
  client.connect().catch((err) => console.error('Redis connect error:', err.message));
  return client;
};

module.exports = { getRedisClient };
