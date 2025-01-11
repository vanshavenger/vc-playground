import express from "express";
import { createServer } from "http";

import { CONFIG } from "./constants";

const app = express();

app.get("/", (req, res) => {
  res.send("Hello World");
});

const server = createServer(app);

server.listen(CONFIG.PORT, () => {
  console.log(`Server is running on port ${CONFIG.PORT}`);
});

process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

function gracefulShutdown() {
  console.log("Received shutdown signal");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });

  setTimeout(() => {
    console.error(
      "Could not close connections in time, forcefully shutting down",
    );
    process.exit(1);
  }, CONFIG.SHUTDOWN_TIMEOUT);
}
