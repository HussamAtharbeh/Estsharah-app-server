export function errorHandler(err, req, res, next) {
  if (err.code === "23505") {
    return res.status(409).json({
      message: "هذا الموعد محجوز مسبقاً، اختر وقتاً آخر."
    });
  }

  if (err.code === "23503") {
    return res.status(400).json({
      message: "البيانات المرسلة تشير إلى سجل غير موجود."
    });
  }

  const statusCode = err.statusCode || 500;
  const message = err.isOperational
    ? err.message
    : "حدث خطأ في الخادم";

  if (!err.isOperational) {
    console.error(err);
  }

  res.status(statusCode).json({ message });
}