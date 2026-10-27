const mongoose = require('mongoose');
let memory;
async function connectDB() {
  let uri = process.env.MONGO_URI;
  if (!uri) {
    if (process.env.NODE_ENV === 'production')
      throw new Error('MONGO_URI is required in production.');
    const { MongoMemoryServer } = require('mongodb-memory-server');
    memory = await MongoMemoryServer.create();
    uri = memory.getUri();
    console.log('Temporary local database: data resets when the server stops.');
  }
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
}
async function closeDB() {
  await mongoose.disconnect();
  if (memory) await memory.stop();
}
module.exports = { connectDB, closeDB };
