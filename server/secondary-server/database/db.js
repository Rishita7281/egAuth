const { connectToMongo } = require('../../shared/database/connectMongo');

connectToMongo().catch((error) => {
  console.error('Error connecting to MongoDB:', error.message);
});
