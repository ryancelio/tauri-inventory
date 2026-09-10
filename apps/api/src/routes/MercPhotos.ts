import path from "path";
import fs from "fs";
import multer from "multer";
import { Router } from "express";
import {
  deleteKeyPhoto,
  deleteMercPhoto,
  getKeyPhotoList,
  getMercPhotoList,
  persistKeyPhoto,
  persistMercPhoto,
} from "../controllers/MercPhotos";
import { requiredRole, requiresAuth } from "../middlewares/auth";

const router = Router();
const multerInstance = multer();

router.post(
  "/:id",
  multerInstance.array("images"),
  requiresAuth,
  persistMercPhoto,
);

router.post(
  "/key/:key",
  multerInstance.array("images"),
  requiresAuth,
  persistKeyPhoto,
);

router.get("/:mercId", getMercPhotoList);
router.get("/key/:key", getKeyPhotoList);
router.delete(
  "/:id",
  requiresAuth,
  requiredRole(["gerente", "admin"]),
  deleteMercPhoto,
);
router.delete(
  "/key/:id",
  requiresAuth,
  requiredRole(["gerente", "admin"]),
  deleteKeyPhoto,
);

export default router;
