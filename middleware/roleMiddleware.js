import { AppError } from "../utils/AppError.js";


export const roleMiddleware = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    throw new AppError("يجب تسجيل الدخول أولاً", 401);
  }

  if (!allowedRoles.includes(req.user.role)) {
    throw new AppError("لا تملك صلاحية تنفيذ هذا الإجراء", 403);
  }

  next();
};
