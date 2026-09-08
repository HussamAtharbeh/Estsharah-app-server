import express from "express";
import {
  getAllLawyers,
  getLawyerById,
  getMyLawyerProfile,
  updateMyLawyerProfile,
  getMyLawyerStats,
  getAllLawyersAdmin,
  verifyLawyer,
  suspendLawyer,
  activateLawyer,
  deleteLawyer,
} from "../controllers/lawyerController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";

const router = express.Router();


// Lawyer own profile 
router.get("/me", authMiddleware, roleMiddleware("lawyer"), asyncHandler(getMyLawyerProfile));
router.put("/me", authMiddleware, roleMiddleware("lawyer"), asyncHandler(updateMyLawyerProfile));
router.get("/me/stats", authMiddleware, roleMiddleware("lawyer"), asyncHandler(getMyLawyerStats));

// Admin management 
router.get("/admin/all", authMiddleware, roleMiddleware("admin"), asyncHandler(getAllLawyersAdmin));
router.put("/:id/verify", authMiddleware, roleMiddleware("admin"), asyncHandler(verifyLawyer));
router.put("/:id/suspend", authMiddleware, roleMiddleware("admin"), asyncHandler(suspendLawyer));
router.put("/:id/activate", authMiddleware, roleMiddleware("admin"), asyncHandler(activateLawyer));
router.delete("/:id", authMiddleware, roleMiddleware("admin"), asyncHandler(deleteLawyer));

router.get("/", asyncHandler(getAllLawyers));
router.get("/:id", asyncHandler(getLawyerById));

export default router;
