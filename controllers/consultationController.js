import db from "../config/db.js";
import { AppError } from "../utils/AppError.js";
import { getLawyerIdOf } from "./lawyerController.js";

export async function createConsultation(req, res) {
  const { lawyerId, type, title, description, scheduledDate, scheduledTime, clientPhone } = req.body;

  if (!lawyerId || !type || !title || !description || !scheduledDate || !scheduledTime) {
    throw new AppError("جميع بيانات الحجز مطلوبة", 400);
  }

  const lawyer = await db.query(
    `SELECT l.prices, l.consultation_types, l.available
     FROM lawyers l
     JOIN users u ON l.user_id = u.id
     WHERE l.id = $1 AND u.status = 'active' AND l.verified = TRUE`,
    [lawyerId]
  );

  if (lawyer.rows.length === 0) {
    throw new AppError("المحامي غير موجود أو غير معتمد", 404);
  }

  const { prices, consultation_types, available } = lawyer.rows[0];

  if (!available) {
    throw new AppError("هذا المحامي غير متاح للاستشارات حالياً", 400);
  }

  if (!consultation_types.includes(type)) {
    throw new AppError("هذا النوع من الاستشارات غير متاح لدى هذا المحامي", 400);
  }

  
  const price = Number(prices?.[type]);

  if (!price) {
    throw new AppError("لم يتم تحديد سعر لهذا النوع من الاستشارات", 400);
  }

  if (type === "phone" && !clientPhone) {
    throw new AppError("رقم الهاتف مطلوب للاستشارة الهاتفية", 400);
  }

  const result = await db.query(
    `INSERT INTO consultations
       (client_id, lawyer_id, type, title, description,
        scheduled_date, scheduled_time, price, client_phone)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [
      req.user.id, lawyerId, type, title, description,
      scheduledDate, scheduledTime, price, clientPhone || null,
    ]
  );

  res.status(201).json(result.rows[0]);
}

export async function getMyConsultationsAsClient(req, res) {
  const result = await db.query(
    `SELECT c.*,
            u.name AS lawyer_name,
            EXISTS (SELECT 1 FROM ratings r WHERE r.consultation_id = c.id) AS rated
     FROM consultations c
     JOIN lawyers l ON c.lawyer_id = l.id
     JOIN users   u ON l.user_id   = u.id
     WHERE c.client_id = $1
     ORDER BY c.scheduled_date DESC, c.created_at DESC`,
    [req.user.id]
  );

  res.json(result.rows);
}

export async function cancelConsultation(req, res) {
  const result = await db.query(
    `UPDATE consultations SET status = 'cancelled'
     WHERE id = $1 AND client_id = $2 AND status IN ('pending', 'confirmed')
     RETURNING *`,
    [req.params.id, req.user.id]
  );

  if (result.rows.length === 0) {
    throw new AppError("الاستشارة غير موجودة أو لا يمكن إلغاؤها", 404);
  }

  await db.query(
    "UPDATE payments SET status = 'refunded' WHERE consultation_id = $1",
    [req.params.id]
  );

  res.json(result.rows[0]);
}


export async function getLawyerPendingOrders(req, res) {
  const lawyerId = await getLawyerIdOf(req.user.id);

  const result = await db.query(
    `SELECT c.*, u.name AS client_name, u.phone AS client_account_phone
     FROM consultations c
     JOIN users u ON c.client_id = u.id
     WHERE c.lawyer_id = $1 AND c.status = 'pending'
     ORDER BY c.created_at ASC`,
    [lawyerId]
  );

  res.json(result.rows);
}


export async function getLawyerConsultations(req, res) {
  const lawyerId = await getLawyerIdOf(req.user.id);
  const dbStatus = req.query.status === "completed" ? "completed" : "confirmed";

  const result = await db.query(
    `SELECT c.*, u.name AS client_name, u.phone AS client_account_phone
     FROM consultations c
     JOIN users u ON c.client_id = u.id
     WHERE c.lawyer_id = $1 AND c.status = $2
     ORDER BY c.scheduled_date ASC`,
    [lawyerId, dbStatus]
  );

  res.json(result.rows);
}

async function changeStatus(req, from, to) {
  const lawyerId = await getLawyerIdOf(req.user.id);

  const result = await db.query(
    `UPDATE consultations SET status = $1
     WHERE id = $2 AND lawyer_id = $3 AND status = $4
     RETURNING *`,
    [to, req.params.id, lawyerId, from]
  );

  if (result.rows.length === 0) {
    throw new AppError("الاستشارة غير موجودة أو تمت معالجتها مسبقاً", 404);
  }

  return { consultation: result.rows[0], lawyerId };
}

export async function acceptConsultation(req, res) {
  const { consultation } = await changeStatus(req, "pending", "confirmed");
  res.json(consultation);
}

export async function rejectConsultation(req, res) {
  const { consultation } = await changeStatus(req, "pending", "cancelled");

  await db.query(
    "UPDATE payments SET status = 'refunded' WHERE consultation_id = $1",
    [consultation.id]
  );

  res.json(consultation);
}

export async function completeConsultation(req, res) {
  const { consultation, lawyerId } = await changeStatus(req, "confirmed", "completed");

  await db.query("UPDATE lawyers SET cases_count = cases_count + 1 WHERE id = $1", [lawyerId]);

  res.json(consultation);
}

async function setConsultationField(req, column, value, expectedType) {
  const lawyerId = await getLawyerIdOf(req.user.id);

  const result = await db.query(
    `UPDATE consultations SET ${column} = $1
     WHERE id = $2 AND lawyer_id = $3 AND type = $4 AND status = 'confirmed'
     RETURNING *`,
    [value, req.params.id, lawyerId, expectedType]
  );

  if (result.rows.length === 0) {
    throw new AppError("الاستشارة غير موجودة أو نوعها لا يسمح بهذا الإجراء", 404);
  }

  return result.rows[0];
}

export async function sendMeetingLink(req, res) {
  const { link } = req.body;

  if (!link) {
    throw new AppError("رابط الاجتماع مطلوب", 400);
  }

  res.json(await setConsultationField(req, "meeting_link", link, "video"));
}

export async function sendOfficeLocation(req, res) {
  const { location } = req.body;

  if (!location) {
    throw new AppError("موقع المكتب مطلوب", 400);
  }

  res.json(await setConsultationField(req, "office_location", location, "office"));
}

export async function rateConsultation(req, res) {
  const { rating, comment } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    throw new AppError("التقييم يجب أن يكون بين 1 و 5", 400);
  }

  const consultation = await db.query(
    `SELECT lawyer_id FROM consultations
     WHERE id = $1 AND client_id = $2 AND status = 'completed'`,
    [req.params.id, req.user.id]
  );

  if (consultation.rows.length === 0) {
    throw new AppError("لا توجد استشارة مكتملة بهذا الرقم لحسابك", 404);
  }

  const { lawyer_id } = consultation.rows[0];

  const already = await db.query("SELECT id FROM ratings WHERE consultation_id = $1", [req.params.id]);

  if (already.rows.length > 0) {
    throw new AppError("تم تقييم هذه الاستشارة مسبقاً", 400);
  }

  const result = await db.query(
    `INSERT INTO ratings (consultation_id, client_id, lawyer_id, rating, comment)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [req.params.id, req.user.id, lawyer_id, rating, comment || null]
  );

  await db.query(
    `UPDATE lawyers SET
       rating_avg    = (SELECT ROUND(AVG(rating), 2) FROM ratings WHERE lawyer_id = $1),
       reviews_count = (SELECT COUNT(*)          FROM ratings WHERE lawyer_id = $1)
     WHERE id = $1`,
    [lawyer_id]
  );

  res.status(201).json(result.rows[0]);
}
