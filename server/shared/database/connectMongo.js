const mongoose = require('mongoose');

let listenersAttached = false;

const buildMongoUri = () => {
  const directUri = process.env.MONGODB_URI;
  if (directUri && directUri.trim()) {
    return directUri.trim();
  }

  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;

  if (!user || !password) {
    const err = new Error('Set MONGODB_URI or both DB_USER and DB_PASSWORD in server/.env');
    err.status = 500;
    throw err;
  }

  return `mongodb+srv://${encodeURIComponent(user)}:${encodeURIComponent(password)}@cluster0.dncvi.mongodb.net/eGAuth?retryWrites=true&w=majority`;
};

const attachConnectionListeners = () => {
  if (listenersAttached) {
    return;
  }

  listenersAttached = true;
  mongoose.set('bufferCommands', false);

  mongoose.connection.on('connected', () => {
    console.log('Successfully connected to MongoDB with Mongoose!');
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected.');
  });

  mongoose.connection.on('error', (error) => {
    console.error('MongoDB connection error:', error.message);
  });
};

const connectToMongo = async () => {
  attachConnectionListeners();
  const uri = buildMongoUri();
  return mongoose.connect(uri, {
    serverSelectionTimeoutMS: 5000,
  });
};

module.exports = {
  buildMongoUri,
  connectToMongo,
};
