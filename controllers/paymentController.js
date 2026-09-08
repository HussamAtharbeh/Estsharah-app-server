import db from "../config/db.js";
import { AppError } from "../utils/AppError.js";


export async function createPayment(req, res) {
  const { consultationId, method } = req.body;

  if (!consultationId) {
    throw new AppError("رقم الاستشارة مطلوب", 400);
  }

  const consultation = await db.query(
    "SELECT price FROM consultations WHERE id = $1 AND client_id = $2",
    [consultationId, req.user.id]
  );

  if (consultation.rows.length === 0) {
    throw new AppError("الاستشارة غير موجودة", 404);
  }

  const existing = await db.query(
    "SELECT id FROM payments WHERE consultation_id = $1",
    [consultationId]
  );

  if (existing.rows.length > 0) {
    throw new AppError("تم دفع هذه الاستشارة مسبقاً", 400);
  }

  const result = await db.query(
    `INSERT INTO payments (consultation_id, amount, method)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [consultationId, consultation.rows[0].price, method || "card"]
  );

  res.status(201).json(result.rows[0]);
}

export async function getMyPayments(req, res) {
  const result = await db.query(
    `SELECT p.id, p.amount, p.method, p.status, p.created_at,
            c.id    AS consultation_id,
            c.title AS consultation_title,
            u.name  AS lawyer_name
     FROM payments p
     JOIN consultations c ON p.consultation_id = c.id
     JOIN lawyers l       ON c.lawyer_id = l.id
     JOIN users   u       ON l.user_id   = u.id
     WHERE c.client_id = $1
     ORDER BY p.created_at DESC`,
    [req.user.id]
  );

  res.json(result.rows);
}

export async function refundPayment(req, res) {
  const result = await db.query(
    `UPDATE payments SET status = 'refunded'
     WHERE id = $1 AND status = 'paid'
     RETURNING *`,
    [req.params.id]
  );

  if (result.rows.length === 0) {
    throw new AppError("عملية الدفع غير موجودة أو مسترجعة مسبقاً", 404);
  }

  res.json(result.rows[0]);
}
