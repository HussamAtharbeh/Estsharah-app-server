import express from "express";
import {
  createConsultation,
  getMyConsultationsAsClient,
  cancelConsultation,
  getLawyerPendingOrders,
  getLawyerConsultations,
  acceptConsultation,
  rejectConsultation,
  completeConsultation,
  sendMeetingLink,
  sendOfficeLocation,
  rateConsultation,
} from "../controllers/consultationController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

const clientOnly = roleMiddleware("client");
const lawyerOnly = roleMiddleware("lawyer");

router.get("/lawyer/orders", lawyerOnly, asyncHandler(getLawyerPendingOrders));
router.get("/lawyer/me", lawyerOnly, asyncHandler(getLawyerConsultations));

router.post("/", clientOnly, asyncHandler(createConsultation));
router.get("/me", clientOnly, asyncHandler(getMyConsultationsAsClient));
router.put("/:id/cancel", clientOnly, asyncHandler(cancelConsultation));
router.post("/:id/rating", clientOnly, asyncHandler(rateConsultation));

router.put("/:id/accept", lawyerOnly, asyncHandler(acceptConsultation));
router.put("/:id/reject", lawyerOnly, asyncHandler(rejectConsultation));
router.put("/:id/complete", lawyerOnly, asyncHandler(completeConsultation));
router.put("/:id/meeting-link", lawyerOnly, asyncHandler(sendMeetingLink));
router.put("/:id/office-location", lawyerOnly, asyncHandler(sendOfficeLocation));

export default router;
