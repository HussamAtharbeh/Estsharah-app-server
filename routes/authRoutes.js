import express from "express";
import { signupClient, signupLawyer, login } from "../controllers/authController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const router = express.Router();

router.post("/signup/client", asyncHandler(signupClient));

router.post("/signup/lawyer", asyncHandler(signupLawyer));

router.post("/login", asyncHandler(login));

export default router;
