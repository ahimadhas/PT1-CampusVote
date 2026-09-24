const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongod = null;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect().catch(() => {});
  }

  const customUri = process.env.MONGO_URI;

  if (customUri && customUri.trim() !== '') {
    try {
      const conn = await mongoose.connect(customUri, {
        serverSelectionTimeoutMS: 2500,
      });
      console.log(`[Database] Connected to MongoDB at: ${conn.connection.host}/${conn.connection.name}`);
      return conn;
    } catch (err) {
      console.warn(`[Database] Could not connect to configured MONGO_URI (${err.message}). Initializing embedded development MongoDB...`);
    }
  }

  // Fallback to MongoMemoryServer for instant, frictionless local execution
  try {
    if (!mongod || mongod.state !== 'running') {
      mongod = await MongoMemoryServer.create({
        instance: {
          dbName: 'campus_vote_db',
        },
      });
    }
    const memoryUri = mongod.getUri();
    const conn = await mongoose.connect(memoryUri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[Database] Connected to Embedded MongoDB at: ${memoryUri}`);
    return conn;
  } catch (err) {
    console.warn(`[Database] Retrying fresh embedded MongoDB instance (${err.message})...`);
    try {
      if (mongod) {
        await mongod.stop().catch(() => {});
        mongod = null;
      }
      mongod = await MongoMemoryServer.create({
        instance: {
          dbName: 'campus_vote_db',
        },
      });
      const freshUri = mongod.getUri();
      const conn = await mongoose.connect(freshUri);
      console.log(`[Database] Connected to Embedded MongoDB at: ${freshUri}`);
      return conn;
    } catch (innerErr) {
      console.error(`[Database] Failed to connect to MongoDB:`, innerErr.message);
      process.exit(1);
    }
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (mongod) {
      await mongod.stop();
      mongod = null;
    }
  } catch (e) {
    // Ignore errors during clean disconnect
  }
};

module.exports = { connectDB, disconnectDB };
