import express from "express";
import {
  getMyProfile,
  updateMyProfile,
  getAllClientsAdmin,
  suspendUser,
  activateUser,
  deleteUser,
} from "../controllers/userController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";

const router = express.Router();

// Every route below needs a logged-in user
router.use(authMiddleware);

// Own profile
router.get("/me", asyncHandler(getMyProfile));
router.put("/me", asyncHandler(updateMyProfile));

// Admin to manage clients
router.get("/admin/clients", roleMiddleware("admin"), asyncHandler(getAllClientsAdmin));
router.put("/:id/suspend", roleMiddleware("admin"), asyncHandler(suspendUser));
router.put("/:id/activate", roleMiddleware("admin"), asyncHandler(activateUser));
router.delete("/:id", roleMiddleware("admin"), asyncHandler(deleteUser));

export default router;
