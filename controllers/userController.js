import db from "../config/db.js";
import { AppError } from "../utils/AppError.js";

export async function getMyProfile(req, res) {
  const result = await db.query(
    `SELECT id, name, email, phone, city, role, status, created_at
     FROM users WHERE id = $1`,
    [req.user.id]
  );

  if (result.rows.length === 0) {
    throw new AppError("المستخدم غير موجود", 404);
  }

  res.json(result.rows[0]);
}


export async function updateMyProfile(req, res) {
  const { name, phone, city } = req.body;

  const result = await db.query(
    `UPDATE users SET
       name  = COALESCE($1, name),
       phone = COALESCE($2, phone),
       city  = COALESCE($3, city)
     WHERE id = $4
     RETURNING id, name, email, phone, city, role, status, created_at`,
    [name ?? null, phone ?? null, city ?? null, req.user.id]
  );

  if (result.rows.length === 0) {
    throw new AppError("المستخدم غير موجود", 404);
  }

  res.json(result.rows[0]);
}

export async function getAllClientsAdmin(req, res) {
  const result = await db.query(
    `SELECT u.id, u.name, u.email, u.phone, u.city, u.status, u.created_at,
            COUNT(c.id)::int AS consultations_count
     FROM users u
     LEFT JOIN consultations c ON c.client_id = u.id
     WHERE u.role = 'client'
     GROUP BY u.id
     ORDER BY u.created_at DESC`
  );

  res.json(result.rows);
}

export async function suspendUser(req, res) {
  const result = await db.query(
    `UPDATE users SET status = 'suspended'
     WHERE id = $1 AND role <> 'admin'
     RETURNING id, name, email, role, status`,
    [req.params.id]
  );

  if (result.rows.length === 0) {
    throw new AppError("المستخدم غير موجود أو لا يمكن تعليقه", 404);
  }

  res.json(result.rows[0]);
}

export async function activateUser(req, res) {
  const result = await db.query(
    `UPDATE users SET status = 'active'
     WHERE id = $1
     RETURNING id, name, email, role, status`,
    [req.params.id]
  );

  if (result.rows.length === 0) {
    throw new AppError("المستخدم غير موجود", 404);
  }

  res.json(result.rows[0]);
}

export async function deleteUser(req, res) {
  if (Number(req.params.id) === req.user.id) {
    throw new AppError("لا يمكنك حذف حسابك الخاص", 400);
  }

  const result = await db.query(
    "DELETE FROM users WHERE id = $1 AND role <> 'admin' RETURNING id",
    [req.params.id]
  );

  if (result.rows.length === 0) {
    throw new AppError("المستخدم غير موجود أو لا يمكن حذفه", 404);
  }

  res.json({ deleted: result.rows[0] });
}
