import "dotenv/config";
import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";

import adminRouter from "./routes/admin";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = createServer(app);

  // ==============================
  // Middleware
  // ==============================
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // ==============================
  // Health Check
  // ==============================
  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  // ==============================
  // Admin Routes
  // ==============================
  app.use("/admin", adminRouter);

  // ==============================
  // Serve Frontend (Production)
  // ==============================
  const publicPath = path.join(__dirname, "../dist/public");
  app.use(express.static(publicPath));

  app.get("*", (_req, res) => {
    res.sendFile(path.join(publicPath, "index.html"));
  });

  // ==============================
  // Start Server
  // ==============================
  const PORT = Number(process.env.PORT) || 3000;

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("❌ Server failed to start:", err);
  process.exit(1);
});