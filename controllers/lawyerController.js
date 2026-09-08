import db from "../config/db.js";
import { AppError } from "../utils/AppError.js";

const PUBLIC_LAWYER_FIELDS = `
  l.id,
  l.user_id,
  u.name,
  u.city,
  u.email,
  l.specialty,
  l.specialties,
  l.experience,
  l.bio,
  l.image,
  l.response_time,
  l.prices,
  l.consultation_types,
  l.available,
  l.verified,
  l.rating_avg,
  l.reviews_count,
  l.cases_count,
  l.created_at,
  (
    SELECT MIN(p.value::int)
    FROM jsonb_each_text(l.prices) AS p
    WHERE p.key = ANY(l.consultation_types)
  ) AS min_price
`;

async function getLawyerIdOf(userId) {
  const result = await db.query(
    "SELECT id FROM lawyers WHERE user_id = $1",
    [userId]
  );

  if (result.rows.length === 0) {
    throw new AppError("لم يتم العثور على ملف المحامي", 404);
  }

  return result.rows[0].id;
}

export async function getAllLawyers(req, res) {
  const { search, specialization, city, sortBy, availableOnly } = req.query;

  let query = `
    SELECT ${PUBLIC_LAWYER_FIELDS}
    FROM lawyers l
    JOIN users u ON l.user_id = u.id
    WHERE u.status = 'active'
      AND l.verified = TRUE
  `;

  const values = [];

  if (search) {
    values.push(`%${search}%`);

    query += `
      AND (
        u.name ILIKE $${values.length}
        OR l.specialty ILIKE $${values.length}
        OR EXISTS (
          SELECT 1
          FROM unnest(l.specialties) AS s
          WHERE s ILIKE $${values.length}
        )
      )
    `;
  }

  if (specialization) {
    values.push(specialization);
    query += ` AND l.specialty = $${values.length}`;
  }

  if (city) {
    values.push(city);
    query += ` AND u.city = $${values.length}`;
  }

  if (availableOnly === "true") {
    query += " AND l.available = TRUE";
  }

  let orderBy = "l.rating_avg DESC";

  if (sortBy === "price_asc") {
    orderBy = "min_price ASC NULLS LAST";
  }

  if (sortBy === "price_desc") {
    orderBy = "min_price DESC NULLS LAST";
  }

  query += ` ORDER BY ${orderBy}`;

  const result = await db.query(query, values);

  res.json(result.rows);
}

export async function getLawyerById(req, res) {
  const result = await db.query(
    `
    SELECT ${PUBLIC_LAWYER_FIELDS}
    FROM lawyers l
    JOIN users u ON l.user_id = u.id
    WHERE l.id = $1
      AND u.status = 'active'
      AND l.verified = TRUE
    `,
    [req.params.id]
  );

  if (result.rows.length === 0) {
    throw new AppError("المحامي غير موجود", 404);
  }

  res.json(result.rows[0]);
}

export async function getMyLawyerProfile(req, res) {
  const result = await db.query(
    `
    SELECT
      ${PUBLIC_LAWYER_FIELDS},
      u.phone,
      l.bar_number,
      l.document_url
    FROM lawyers l
    JOIN users u ON l.user_id = u.id
    WHERE l.user_id = $1
    `,
    [req.user.id]
  );

  if (result.rows.length === 0) {
    throw new AppError("لم يتم العثور على ملف المحامي", 404);
  }

  res.json(result.rows[0]);
}

export async function updateMyLawyerProfile(req, res) {
  const {
    name,
    city,
    specialty,
    experience,
    bio,
    prices,
    specialties,
    consultationTypes,
    available,
    image,
    responseTime
  } = req.body;

  if (Array.isArray(consultationTypes) && prices) {
    const missing = consultationTypes.filter(
      type => !(Number(prices[type]) > 0)
    );

    if (missing.length > 0) {
      throw new AppError(
        "يجب تحديد سعر لكل نوع استشارة مفعّل",
        400
      );
    }
  }

  await db.query(
    `
    UPDATE users
    SET
      name = COALESCE($1, name),
      city = COALESCE($2, city)
    WHERE id = $3
    `,
    [
      name ?? null,
      city ?? null,
      req.user.id
    ]
  );

  const result = await db.query(
    `
    UPDATE lawyers
    SET
      specialty = COALESCE($1, specialty),
      experience = COALESCE($2, experience),
      bio = COALESCE($3, bio),
      prices = COALESCE($4::jsonb, prices),
      specialties = COALESCE($5::text[], specialties),
      consultation_types = COALESCE($6::text[], consultation_types),
      available = COALESCE($7, available),
      image = COALESCE($8, image),
      response_time = COALESCE($9, response_time)
    WHERE user_id = $10
    RETURNING id
    `,
    [
      specialty ?? null,
      experience === undefined ? null : Number(experience),
      bio ?? null,
      prices ? JSON.stringify(prices) : null,
      specialties ?? null,
      consultationTypes ?? null,
      available ?? null,
      image ?? null,
      responseTime ?? null,
      req.user.id
    ]
  );

  if (result.rows.length === 0) {
    throw new AppError("لم يتم العثور على ملف المحامي", 404);
  }

  return getMyLawyerProfile(req, res);
}

export async function getMyLawyerStats(req, res) {
  const lawyerId = await getLawyerIdOf(req.user.id);

  const result = await db.query(
    `
    SELECT
      l.cases_count,
      l.rating_avg,

      (
        SELECT COUNT(*)::int
        FROM consultations c
        WHERE c.lawyer_id = l.id
          AND c.created_at >= date_trunc('month', NOW())
      ) AS month_consultations,

      (
        SELECT COALESCE(SUM(c.price), 0)::int
        FROM consultations c
        WHERE c.lawyer_id = l.id
          AND c.status = 'completed'
          AND c.created_at >= date_trunc('month', NOW())
      ) AS month_earnings,

      (
        SELECT COUNT(*)::int
        FROM consultations c
        WHERE c.lawyer_id = l.id
          AND c.status = 'pending'
      ) AS pending_orders

    FROM lawyers l
    WHERE l.id = $1
    `,
    [lawyerId]
  );

  res.json(result.rows[0]);
}

export async function getAllLawyersAdmin(req, res) {
  const result = await db.query(
    `
    SELECT
      l.id,
      l.user_id,
      u.name,
      u.email,
      u.city,
      u.status,
      l.specialty,
      l.bar_number,
      l.document_url,
      l.verified,
      l.created_at
    FROM lawyers l
    JOIN users u ON l.user_id = u.id
    ORDER BY l.created_at DESC
    `
  );

  res.json(result.rows);
}

export async function verifyLawyer(req, res) {
  const result = await db.query(
    `
    UPDATE lawyers
    SET verified = TRUE
    WHERE id = $1
    RETURNING id, user_id, verified
    `,
    [req.params.id]
  );

  if (result.rows.length === 0) {
    throw new AppError("المحامي غير موجود", 404);
  }

  await db.query(
    "UPDATE users SET status = 'active' WHERE id = $1",
    [result.rows[0].user_id]
  );

  res.json({
    ...result.rows[0],
    message: "تم اعتماد حساب المحامي"
  });
}

export async function suspendLawyer(req, res) {
  const result = await db.query(
    "SELECT user_id FROM lawyers WHERE id = $1",
    [req.params.id]
  );

  if (result.rows.length === 0) {
    throw new AppError("المحامي غير موجود", 404);
  }

  await db.query(
    "UPDATE users SET status = 'suspended' WHERE id = $1",
    [result.rows[0].user_id]
  );

  res.json({
    id: Number(req.params.id),
    status: "suspended",
    message: "تم تعليق حساب المحامي"
  });
}

export async function activateLawyer(req, res) {
  const result = await db.query(
    "SELECT user_id FROM lawyers WHERE id = $1",
    [req.params.id]
  );

  if (result.rows.length === 0) {
    throw new AppError("المحامي غير موجود", 404);
  }

  await db.query(
    "UPDATE users SET status = 'active' WHERE id = $1",
    [result.rows[0].user_id]
  );

  res.json({
    id: Number(req.params.id),
    status: "active",
    message: "تم تفعيل حساب المحامي"
  });
}

export async function deleteLawyer(req, res) {
  const result = await db.query(
    "SELECT user_id FROM lawyers WHERE id = $1",
    [req.params.id]
  );

  if (result.rows.length === 0) {
    throw new AppError("المحامي غير موجود", 404);
  }

  await db.query(
    "DELETE FROM users WHERE id = $1",
    [result.rows[0].user_id]
  );

  res.json({
    deleted: {
      id: Number(req.params.id)
    },
    message: "تم حذف حساب المحامي"
  });
}

export { getLawyerIdOf };