import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { setupVite, serveStatic } from "./vite";
import adminRouter from "../routes/admin";

async function startServer() {
  const app = express();
  const server = createServer(app);

  // ==============================
  // Body Parsers
  // ==============================
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // ==============================
  // Health Check (Railway)
  // ==============================
  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  // ==============================
  // ADMIN ROUTES (MUST COME BEFORE FRONTEND)
  // ==============================
  app.use("/admin", adminRouter);

  // ==============================
  // OAuth Routes
  // ==============================
  registerOAuthRoutes(app);

  // ==============================
  // tRPC API
  // ==============================
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  // ==============================
  // Frontend Handling (MUST BE LAST)
  // ==============================
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

// ==============================
// Start Server
// ==============================
const PORT = Number(process.env.PORT) || 3000;

server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("❌ Server failed to start:", err);
  process.exit(1);
});