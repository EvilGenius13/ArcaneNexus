import { Router } from "express";

const router = Router();

// Temp Test Route
router.get("/admin", (req, res) => {
  res.send("Admin page");
});

export default router;