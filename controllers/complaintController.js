import db from "../config/db.js";
import { AppError } from "../utils/AppError.js";


export async function createComplaint(req, res) {
  const { consultationId, type, details } = req.body;

  if (!consultationId || !type || !details) {
    throw new AppError("رقم الاستشارة ونوع الشكوى والتفاصيل مطلوبة", 400);
  }

  const consultation = await db.query(
    `SELECT c.client_id, l.user_id AS lawyer_user_id
     FROM consultations c
     JOIN lawyers l ON c.lawyer_id = l.id
     WHERE c.id = $1`,
    [consultationId]
  );

  if (consultation.rows.length === 0) {
    throw new AppError("الاستشارة غير موجودة", 404);
  }

  const { client_id, lawyer_user_id } = consultation.rows[0];

  if (req.user.id !== client_id && req.user.id !== lawyer_user_id) {
    throw new AppError("أنت لست طرفاً في هذه الاستشارة", 403);
  }

  const accusedId = req.user.id === client_id ? lawyer_user_id : client_id;

  const result = await db.query(
    `INSERT INTO complaints (consultation_id, complainant_id, accused_id, type, details)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [consultationId, req.user.id, accusedId, type, details]
  );

  res.status(201).json(result.rows[0]);
}

export async function getAllComplaints(req, res) {
  const result = await db.query(
    `SELECT cm.*,
            c.title AS consultation_title,
            complainant.name AS complainant_name, complainant.role AS complainant_role,
            accused.name     AS accused_name,     accused.role     AS accused_role
     FROM complaints cm
     JOIN users complainant ON cm.complainant_id = complainant.id
     JOIN users accused     ON cm.accused_id     = accused.id
     LEFT JOIN consultations c ON cm.consultation_id = c.id
     ORDER BY cm.created_at DESC`
  );

  res.json(result.rows);
}

export async function resolveComplaint(req, res) {
  const result = await db.query(
    "UPDATE complaints SET status = 'resolved' WHERE id = $1 RETURNING *",
    [req.params.id]
  );

  if (result.rows.length === 0) {
    throw new AppError("الشكوى غير موجودة", 404);
  }

  res.json(result.rows[0]);
}

export async function archiveComplaint(req, res) {
  const result = await db.query(
    "DELETE FROM complaints WHERE id = $1 RETURNING id",
    [req.params.id]
  );

  if (result.rows.length === 0) {
    throw new AppError("الشكوى غير موجودة", 404);
  }

  res.json({ archived: result.rows[0] });
}
