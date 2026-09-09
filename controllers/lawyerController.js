import db from "../config/db.js";
import { AppError } from "../utils/AppError.js";


function calculateMinPrice(prices, consultationTypes) {
  if (!prices || !consultationTypes || consultationTypes.length === 0) {
    return null;
  }

  let minPrice = null;

  for (const type of consultationTypes) {
    const price = Number(prices[type]);

    if (!price) continue; 

    if (minPrice === null || price < minPrice) {
      minPrice = price;
    }
  }

  return minPrice;
}


function attachMinPrice(lawyer) {
  return {
    ...lawyer,
    min_price: calculateMinPrice(lawyer.prices, lawyer.consultation_types),
  };
}

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

const PUBLIC_LAWYER_FIELDS = `
  l.id, l.user_id, u.name, u.city, u.email,
  l.specialty, l.specialties, l.experience, l.bio, l.image,
  l.response_time, l.prices, l.consultation_types,
  l.available, l.verified, l.rating_avg, l.reviews_count,
  l.cases_count, l.created_at
`;

export async function getAllLawyers(req, res) {
  const { search, specialization, city, sortBy, availableOnly } = req.query;

  const conditions = ["u.status = 'active'", "l.verified = TRUE"];
  const values = [];

  if (search) {
    values.push(`%${search}%`);
    const placeholder = `$${values.length}`;

    conditions.push(`
      (u.name ILIKE ${placeholder}
        OR l.specialty ILIKE ${placeholder}
        OR EXISTS (
          SELECT 1 FROM unnest(l.specialties) AS s
          WHERE s ILIKE ${placeholder}
        ))
    `);
  }

  if (specialization) {
    values.push(specialization);
    conditions.push(`l.specialty = $${values.length}`);
  }

  if (city) {
    values.push(city);
    conditions.push(`u.city = $${values.length}`);
  }

  if (availableOnly === "true") {
    conditions.push("l.available = TRUE");
  }

  const query = `
    SELECT ${PUBLIC_LAWYER_FIELDS}
    FROM lawyers l
    JOIN users u ON l.user_id = u.id
    WHERE ${conditions.join(" AND ")}
    ORDER BY l.rating_avg DESC
  `;

  const result = await db.query(query, values);


  let lawyers = result.rows.map(attachMinPrice);

  if (sortBy === "price_asc") {
    lawyers.sort((a, b) => (a.min_price ?? Infinity) - (b.min_price ?? Infinity));
  }

  if (sortBy === "price_desc") {
    lawyers.sort((a, b) => (b.min_price ?? -Infinity) - (a.min_price ?? -Infinity));
  }

  res.json(lawyers);
}

export async function getLawyerById(req, res) {
  const result = await db.query(
    `
    SELECT ${PUBLIC_LAWYER_FIELDS}
    FROM lawyers l
    JOIN users u ON l.user_id = u.id
    WHERE l.id = $1 AND u.status = 'active' AND l.verified = TRUE
    `,
    [req.params.id]
  );

  if (result.rows.length === 0) {
    throw new AppError("المحامي غير موجود", 404);
  }

  res.json(attachMinPrice(result.rows[0]));
}


export async function getMyLawyerProfile(req, res) {
  const result = await db.query(
    `
    SELECT ${PUBLIC_LAWYER_FIELDS}, u.phone, l.bar_number, l.document_url
    FROM lawyers l
    JOIN users u ON l.user_id = u.id
    WHERE l.user_id = $1
    `,
    [req.user.id]
  );

  if (result.rows.length === 0) {
    throw new AppError("لم يتم العثور على ملف المحامي", 404);
  }

  res.json(attachMinPrice(result.rows[0]));
}


export async function updateMyLawyerProfile(req, res) {
  const {
    name, city, specialty, experience, bio,
    prices, specialties, consultationTypes,
    available, image, responseTime,
  } = req.body;

  if (Array.isArray(consultationTypes) && prices) {
    for (const type of consultationTypes) {
      if (!(Number(prices[type]) > 0)) {
        throw new AppError("يجب تحديد سعر لكل نوع استشارة مفعّل", 400);
      }
    }
  }

  const current = await db.query(
    `SELECT u.name, u.city, l.specialty, l.experience, l.bio, l.prices,
            l.specialties, l.consultation_types, l.available, l.image, l.response_time
     FROM lawyers l
     JOIN users u ON l.user_id = u.id
     WHERE l.user_id = $1`,
    [req.user.id]
  );

  if (current.rows.length === 0) {
    throw new AppError("لم يتم العثور على ملف المحامي", 404);
  }

  const existing = current.rows[0];

  
  const updatedName = name ?? existing.name;
  const updatedCity = city ?? existing.city;
  const updatedSpecialty = specialty ?? existing.specialty;
  const updatedExperience = experience !== undefined ? Number(experience) : existing.experience;
  const updatedBio = bio ?? existing.bio;
  const updatedPrices = prices ?? existing.prices;
  const updatedSpecialties = specialties ?? existing.specialties;
  const updatedConsultationTypes = consultationTypes ?? existing.consultation_types;
  const updatedAvailable = available ?? existing.available;
  const updatedImage = image ?? existing.image;
  const updatedResponseTime = responseTime ?? existing.response_time;

  await db.query(
    "UPDATE users SET name = $1, city = $2 WHERE id = $3",
    [updatedName, updatedCity, req.user.id]
  );

  await db.query(
    `UPDATE lawyers SET
       specialty = $1,
       experience = $2,
       bio = $3,
       prices = $4,
       specialties = $5,
       consultation_types = $6,
       available = $7,
       image = $8,
       response_time = $9
     WHERE user_id = $10`,
    [
      updatedSpecialty,
      updatedExperience,
      updatedBio,
      JSON.stringify(updatedPrices),
      updatedSpecialties,
      updatedConsultationTypes,
      updatedAvailable,
      updatedImage,
      updatedResponseTime,
      req.user.id,
    ]
  );

  return getMyLawyerProfile(req, res);
}


export async function getMyLawyerStats(req, res) {
  const lawyerId = await getLawyerIdOf(req.user.id);

  const lawyerInfo = await db.query(
    "SELECT cases_count, rating_avg FROM lawyers WHERE id = $1",
    [lawyerId]
  );

  const monthConsultations = await db.query(
    `SELECT COUNT(*)::int AS count FROM consultations
     WHERE lawyer_id = $1 AND created_at >= date_trunc('month', NOW())`,
    [lawyerId]
  );

  const monthEarnings = await db.query(
    `SELECT COALESCE(SUM(price), 0)::int AS total FROM consultations
     WHERE lawyer_id = $1 AND status = 'completed'
       AND created_at >= date_trunc('month', NOW())`,
    [lawyerId]
  );

  const pendingOrders = await db.query(
    "SELECT COUNT(*)::int AS count FROM consultations WHERE lawyer_id = $1 AND status = 'pending'",
    [lawyerId]
  );

  res.json({
    cases_count: lawyerInfo.rows[0].cases_count,
    rating_avg: lawyerInfo.rows[0].rating_avg,
    month_consultations: monthConsultations.rows[0].count,
    month_earnings: monthEarnings.rows[0].total,
    pending_orders: pendingOrders.rows[0].count,
  });
}


export async function getAllLawyersAdmin(req, res) {
  const result = await db.query(
    `SELECT l.id, l.user_id, u.name, u.email, u.city, u.status,
            l.specialty, l.bar_number, l.document_url, l.verified, l.created_at
     FROM lawyers l
     JOIN users u ON l.user_id = u.id
     ORDER BY l.created_at DESC`
  );

  res.json(result.rows);
}

async function getLawyerUserIdOrFail(lawyerId) {
  const result = await db.query(
    "SELECT user_id FROM lawyers WHERE id = $1",
    [lawyerId]
  );

  if (result.rows.length === 0) {
    throw new AppError("المحامي غير موجود", 404);
  }

  return result.rows[0].user_id;
}


export async function verifyLawyer(req, res) {
  const result = await db.query(
    "UPDATE lawyers SET verified = TRUE WHERE id = $1 RETURNING id, user_id, verified",
    [req.params.id]
  );

  if (result.rows.length === 0) {
    throw new AppError("المحامي غير موجود", 404);
  }

  await db.query("UPDATE users SET status = 'active' WHERE id = $1", [
    result.rows[0].user_id,
  ]);

  res.json({ ...result.rows[0], message: "تم اعتماد حساب المحامي" });
}


export async function suspendLawyer(req, res) {
  const userId = await getLawyerUserIdOrFail(req.params.id);

  await db.query("UPDATE users SET status = 'suspended' WHERE id = $1", [userId]);

  res.json({
    id: Number(req.params.id),
    status: "suspended",
    message: "تم تعليق حساب المحامي",
  });
}


export async function activateLawyer(req, res) {
  const userId = await getLawyerUserIdOrFail(req.params.id);

  await db.query("UPDATE users SET status = 'active' WHERE id = $1", [userId]);

  res.json({
    id: Number(req.params.id),
    status: "active",
    message: "تم تفعيل حساب المحامي",
  });
}


export async function deleteLawyer(req, res) {
  const userId = await getLawyerUserIdOrFail(req.params.id);

  await db.query("DELETE FROM users WHERE id = $1", [userId]);

  res.json({
    deleted: { id: Number(req.params.id) },
    message: "تم حذف حساب المحامي",
  });
}
export async function getLawyersCount(req, res) {
  const result = await db.query(
    `SELECT COUNT(*) 
     FROM lawyers l
     JOIN users u ON l.user_id = u.id
     WHERE u.status = 'active'
     AND l.verified = TRUE`
  );

  res.json({
    count: result.rows[0].count
  });
}
export { getLawyerIdOf };