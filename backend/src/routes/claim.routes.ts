import { Router } from "express";
import { ClaimController } from "../controllers/claim.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/verify", requireAuth, ClaimController.verifyClaim);
router.get("/my-claims", requireAuth, ClaimController.listClaims);

export default router;
