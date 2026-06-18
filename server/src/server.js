const app = require("./app");
const env = require("./config/env");
const connectDB = require("./config/db");

async function startServer() {
  await connectDB();

  app.listen(env.port, function onListen() {
    console.log(`Umusare backend API running on port ${env.port} in ${env.nodeEnv} mode`);
  });
}

startServer().catch(function onStartError(error) {
  console.error("Failed to start Umusare backend API:", error);
  process.exit(1);
});
