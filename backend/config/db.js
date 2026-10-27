const mongoose = require('mongoose');
// Propagate the active transaction through shared authorization and audit helpers.
mongoose.set('transactionAsyncLocalStorage', true);
let memory;
async function connectDB() {
  let uri = process.env.MONGO_URI;
  if (!uri) {
    if (process.env.NODE_ENV === 'production')
      throw new Error('MONGO_URI is required in production.');
    const { MongoMemoryReplSet } = require('mongodb-memory-server');
    memory = await MongoMemoryReplSet.create({
      replSet: { count: 1, storageEngine: 'wiredTiger' },
    });
    uri = memory.getUri();
    console.log('Temporary local database: data resets when the server stops.');
  }
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  const hello = await mongoose.connection.db.admin().command({ hello: 1 });
  if (!hello.setName && hello.msg !== 'isdbgrid') {
    await closeDB();
    throw new Error(
      'Orbit requires a MongoDB replica set (or Atlas) for atomic writes. See README.',
    );
  }
  // Initialize collections and unique indexes before the first transaction.
  await Promise.all(
    ['User', 'Project', 'Task', 'Activity'].map((name) => require('../models/' + name).init()),
  );
}
async function closeDB() {
  await mongoose.disconnect();
  if (memory) await memory.stop();
}
module.exports = { connectDB, closeDB };
