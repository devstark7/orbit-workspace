require('./config/runtime');
const { connectDB, closeDB } = require('./config/db');
async function start() {
  await connectDB();
  const app = require('./app');
  const server = app.listen(process.env.PORT || 5000, process.env.HOST || '127.0.0.1', () =>
    console.log('Orbit API: http://127.0.0.1:' + (process.env.PORT || 5000)),
  );
  for (const signal of ['SIGINT', 'SIGTERM'])
    process.once(signal, () => {
      server.close(async () => {
        await closeDB();
        process.exit(0);
      });
      setTimeout(() => process.exit(1), 10000).unref();
    });
}
start().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
