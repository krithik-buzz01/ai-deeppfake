import { Router } from "express";
import authRoutes from "./auth.routes.js";
import mediaRoutes from "./media.routes.js";
import analysisRoutes from "./analysis.routes.js";
import caseRoutes from "./case.routes.js";
import reportRoutes from "./report.routes.js";
import claimRoutes from "./claim.routes.js";
import adminRoutes from "./admin.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/media", mediaRoutes);
router.use("/analysis", analysisRoutes);
router.use("/cases", caseRoutes);
router.use("/reports", reportRoutes);
router.use("/claims", claimRoutes);
router.use("/admin", adminRoutes);

// Health check endpoint
router.get("/health", (req, res) => {
  res.status(200).json({ status: "healthy", service: "VERIFAI API Gateway", version: "1.0.0" });
});

export default router;
