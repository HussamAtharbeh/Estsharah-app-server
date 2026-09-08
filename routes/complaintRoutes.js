import express from "express";
import {
  createComplaint,
  getAllComplaints,
  resolveComplaint,
  archiveComplaint,
} from "../controllers/complaintController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/", roleMiddleware("client", "lawyer"), asyncHandler(createComplaint));


router.get("/", roleMiddleware("admin"), asyncHandler(getAllComplaints));
router.put("/:id/resolve", roleMiddleware("admin"), asyncHandler(resolveComplaint));
router.delete("/:id", roleMiddleware("admin"), asyncHandler(archiveComplaint));

export default router;
