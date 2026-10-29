import { Router } from "express";
import { AdminController } from "../controllers/admin.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireAdmin } from "../middleware/rbac.middleware.js";

const router = Router();

// All routes here strictly require verified Admin authorization
router.use(requireAuth, requireAdmin);

router.get("/stats", AdminController.getDashboardStats);
router.get("/users", AdminController.listUsers);
router.patch("/users/:userId/role", AdminController.updateUserRole);
router.get("/providers/health", AdminController.getProviderHealth);
router.get("/models/registry", AdminController.getModelRegistry);
router.get("/audit/logs", AdminController.getAuditLogs);
router.get("/jobs", AdminController.getJobs);

export default router;
