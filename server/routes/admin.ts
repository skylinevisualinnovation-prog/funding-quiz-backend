import { Router } from "express";
import { db } from "../db";
import { quizSubmissions } from "../db/schema";

const router = Router();

router.get("/submissions", async (req, res) => {
  try {
    const submissions = await db
      .select()
      .from(quizSubmissions)
      .orderBy(quizSubmissions.createdAt);

    res.json(submissions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch submissions" });
  }
});

export default router;