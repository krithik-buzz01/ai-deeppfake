import { Router } from "express";
import { CaseController } from "../controllers/case.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireAnalystOrAdmin } from "../middleware/rbac.middleware.js";

const router = Router();

// Analyst and Admin investigation routes
router.get("/", requireAuth, requireAnalystOrAdmin, CaseController.listCases);
router.post("/", requireAuth, requireAnalystOrAdmin, CaseController.createCase);
router.get("/:caseId", requireAuth, requireAnalystOrAdmin, CaseController.getCase);
router.post("/:caseId/annotations", requireAuth, requireAnalystOrAdmin, CaseController.addAnnotation);
router.patch("/:caseId/verdict", requireAuth, requireAnalystOrAdmin, CaseController.updateVerdict);

export default router;
