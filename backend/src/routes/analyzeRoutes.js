import express from "express";
import multer from "multer";
import { analyzeLookController, regenerateLookController } from "../controllers/analyzeController.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});

router.post("/analyze", upload.single("image"), analyzeLookController);
router.post("/regenerate", regenerateLookController);

export default router;
