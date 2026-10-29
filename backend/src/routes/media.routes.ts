import { Router } from "express";
import multer from "multer";
import { MediaController } from "../controllers/media.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { uploadRateLimiter } from "../middleware/rateLimiter.middleware.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 104857600 } // 100 MB max
});

const router = Router();

router.post("/upload", requireAuth, uploadRateLimiter, upload.single("file"), MediaController.uploadMedia);
router.get("/duplicates/:assetId", requireAuth, MediaController.searchFingerprintDuplicates);
router.get("/signed-file", MediaController.getSignedFile);

export default router;
