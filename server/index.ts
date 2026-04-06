import adminRoutes from "./routes/admin";
import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import adminRoutes from "./routes/admin";
// import quizRoutes from "./routes/quiz"; // if you have this

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = createServer(app);

  // -----------------------------
  // Middleware
  // -----------------------------
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // -----------------------------
  // API Routes (REGISTER FIRST)
  // -----------------------------

  app.use("/admin", adminRoutes);

  // If you have quiz routes:
  // app.use("/api/quiz", quizRoutes);

  // Health check route (optional but smart)
  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // -----------------------------
  // Static Frontend Serving
  // -----------------------------

  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  app.use(express.static(staticPath));

  // -----------------------------
  // Catch-All (MUST BE LAST)
  // -----------------------------

  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  // -----------------------------
  // Start Server
  // -----------------------------

  const port = process.env.PORT || 8080;

  server.listen(port, "0.0.0.0", () => {
    console.log(`🚀 Server running on port ${port}`);
  });
}

startServer().catch((err) => {
  console.error("❌ Server failed to start:", err);
});