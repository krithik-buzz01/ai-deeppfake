import { Router } from "express";
import { AnalysisController } from "../controllers/analysis.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/submit/:assetId", requireAuth, AnalysisController.submitAnalysis);
router.get("/detail/:analysisId", requireAuth, AnalysisController.getAnalysis);
router.get("/my-analyses", requireAuth, AnalysisController.listUserAnalyses);

export default router;
