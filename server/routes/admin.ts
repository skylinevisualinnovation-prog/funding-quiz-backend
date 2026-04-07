import { Router } from "express";
import { db } from "../db";
import { quizSubmissions } from "../db/schema";
import { eq } from "drizzle-orm";

const router = Router();

/* ============================
   AUTH MIDDLEWARE
============================ */
const checkAdminAuth = (req: any, res: any) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || authHeader !== `Bearer ${process.env.ADMIN_SECRET}`) {
    res.status(401).json({ error: "Unauthorized" });
    return false;
  }

  return true;
};

/* ============================
   GET ALL SUBMISSIONS
============================ */
router.get("/submissions", async (req, res) => {
  if (!checkAdminAuth(req, res)) return;

  try {
    const submissions = await db
      .select()
      .from(quizSubmissions)
      .orderBy(quizSubmissions.createdAt);

    res.json(submissions);
  } catch (err) {
    console.error("Fetch error:", err);
    res.status(500).json({ error: "Failed to fetch submissions" });
  }
});

/* ============================
   DELETE SUBMISSION
============================ */
router.delete("/submissions/:id", async (req, res) => {
  if (!checkAdminAuth(req, res)) return;

  try {
    const id = Number(req.params.id);

    if (!id || isNaN(id)) {
      return res.status(400).json({ error: "Invalid ID" });
    }

    await db
      .delete(quizSubmissions)
      .where(eq(quizSubmissions.id, id));

    res.json({ success: true });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ error: "Failed to delete submission" });
  }
});

export default router;