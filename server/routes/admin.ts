import { Router } from "express";
import mysql from "mysql2/promise";

const router = Router();

// ==============================
// DATABASE CONNECTION
// ==============================
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
});

// ==============================
// AUTH MIDDLEWARE
// ==============================
function checkAdminAuth(req: any, res: any) {
  const authHeader = req.headers.authorization;

  if (!authHeader || authHeader !== `Bearer ${process.env.ADMIN_SECRET}`) {
    res.status(401).json({ error: "Unauthorized" });
    return false;
  }

  return true;
}

// ==============================
// GET ALL SUBMISSIONS
// ==============================
router.get("/submissions", async (req, res) => {
  if (!checkAdminAuth(req, res)) return;

  try {
    const [rows] = await pool.query<any[]>(
      `
      SELECT
        id,
        name,
        email,
        phone,
        score,
        readinessLevel,
        status,
        notes,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM quiz_submissions
      ORDER BY created_at DESC
      `
    );

    // Ensure date fields are serialized correctly
    const formatted = rows.map((row) => ({
      ...row,
      createdAt: row.createdAt
        ? new Date(row.createdAt).toISOString()
        : null,
      updatedAt: row.updatedAt
        ? new Date(row.updatedAt).toISOString()
        : null,
    }));

    res.json(formatted);
  } catch (err) {
    console.error("Fetch error:", err);
    res.status(500).json({ error: "Failed to fetch submissions" });
  }
});

// ==============================
// DELETE SUBMISSION
// ==============================
router.delete("/submissions/:id", async (req, res) => {
  if (!checkAdminAuth(req, res)) return;

  try {
    const id = Number(req.params.id);

    if (!id || isNaN(id)) {
      return res.status(400).json({ error: "Invalid ID" });
    }

    await pool.query("DELETE FROM quiz_submissions WHERE id = ?", [id]);

    res.json({ success: true });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ error: "Failed to delete submission" });
  }
});

export default router;