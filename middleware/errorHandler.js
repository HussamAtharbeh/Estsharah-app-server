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

  if (err.isOperational) {
    return res.status(err.statusCode || 500).json({
      message: err.message
    });
  }

  console.error(err);

  res.status(500).json({
    message: "حدث خطأ في الخادم"
  });
}