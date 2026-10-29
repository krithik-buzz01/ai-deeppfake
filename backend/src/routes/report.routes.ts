import { Router } from "express";
import { ReportController } from "../controllers/report.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireAnalystOrAdmin } from "../middleware/rbac.middleware.js";

const router = Router();

router.post("/generate", requireAuth, ReportController.generateReport);
router.get("/:reportId/pdf", requireAuth, ReportController.downloadPdf);
router.post("/:reportId/approve", requireAuth, requireAnalystOrAdmin, ReportController.approveReport);
router.post("/:reportId/share", requireAuth, ReportController.shareReport);
router.get("/:reportId/tamper-chain", requireAuth, ReportController.getTamperChain);

export default router;
