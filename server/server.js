import http from "http";
import app from "./app.js";
import { connectDB, getDB } from "./config/db.js";
import { createIndexes } from "./database/indexes.js";
import "./config/env.js";

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    const db = getDB();

    app.locals.db = db;

    await createIndexes(db);

    const server = http.createServer(app);

    server.listen(PORT, () => {
      console.log(
        `🚀 Server running on port ${PORT} (${process.env.NODE_ENV})`
      );
    });

    process.on("SIGINT", async () => {
      console.log("🛑 Shutting down server...");
      process.exit(0);
    });
  } catch (error) {
    console.error("❌ Server start failed:", error);
    process.exit(1);
  }
};

startServer();
