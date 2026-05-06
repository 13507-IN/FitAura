import express from "express";
import multer from "multer";
import { analyzeLookController, regenerateLookController, analyzeMultiPhotoController } from "../controllers/analyzeController.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});

const uploadMultiple = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024
  }
}).array("images", 3);

router.post("/analyze", upload.single("image"), analyzeLookController);
router.post("/analyze-multi", uploadMultiple, analyzeMultiPhotoController);
router.post("/regenerate", regenerateLookController);

export default router;
