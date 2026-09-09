import express from "express";
import { createPayment, getMyPayments, refundPayment } from "../controllers/paymentController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/", roleMiddleware("client"), asyncHandler(createPayment));
router.get("/me", roleMiddleware("client"), asyncHandler(getMyPayments));
router.put("/:id/refund", roleMiddleware("admin"), asyncHandler(refundPayment));

export default router;
