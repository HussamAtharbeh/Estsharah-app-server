import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import db from "../config/db.js";
import { AppError } from "../utils/AppError.js";

const SALT_ROUNDS = 10;

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

async function emailIsTaken(email) {
  const existing = await db.query("SELECT id FROM users WHERE email = $1", [email]);
  return existing.rows.length > 0;
}


export async function signupClient(req, res) {
  const { name, email, phone, password, city } = req.body;

  if (!name || !email || !password) {
    throw new AppError("الاسم والبريد الإلكتروني وكلمة المرور مطلوبة", 400);
  }

  if (password.length < 6) {
    throw new AppError("كلمة المرور يجب أن تكون 6 أحرف على الأقل", 400);
  }

  if (await emailIsTaken(email)) {
    throw new AppError("يوجد حساب مسجل بهذا البريد الإلكتروني", 400);
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  const result = await db.query(
    `INSERT INTO users (name, email, phone, city, password, role)
     VALUES ($1, $2, $3, $4, $5, 'client')
     RETURNING id, name, email, phone, city, role, status, created_at`,
    [name, email, phone || null, city || null, hashedPassword]
  );

  const user = result.rows[0];

  res.status(201).json({ user, token: generateToken(user) });
}


export async function signupLawyer(req, res) {
  const {
    fullName,
    email,
    password,
    phone,
    barNumber,
    specialization,
    experience,
    city,
  } = req.body;

  if (
    !fullName ||
    !email ||
    !password ||
    !barNumber ||
    !specialization ||
    !city
  ) {
    throw new AppError("جميع الحقول مطلوبة", 400);
  }

  if (!password || password.length < 6) {
    throw new AppError(
      "كلمة المرور يجب أن تكون 6 أحرف على الأقل",
      400
    );
  }

  if (await emailIsTaken(email)) {
    throw new AppError(
      "يوجد حساب مسجل بهذا البريد الإلكتروني",
      400
    );
  }

  if (!req.file) {
    throw new AppError(
      "يرجى رفع صورة الهوية أو بطاقة النقابة",
      400
    );
  }

  const hashedPassword = await bcrypt.hash(
    password,
    SALT_ROUNDS
  );

  const userResult = await db.query(
    `INSERT INTO users
      (name, email, phone, city, password, role)
     VALUES
      ($1, $2, $3, $4, $5, 'lawyer')
     RETURNING id, name, email, phone, city, role, status, created_at`,
    [
      fullName,
      email,
      phone || null,
      city,
      hashedPassword,
    ]
  );

  const user = userResult.rows[0];

  const documentUrl = `/uploads/lawyers/${req.file.filename}`;

  const lawyerResult = await db.query(
    `INSERT INTO lawyers
      (user_id, specialty, experience, bar_number, document_url, verified)
     VALUES
      ($1, $2, $3, $4, $5, FALSE)
     RETURNING *`,
    [
      user.id,
      specialization,
      Number(experience) || 0,
      barNumber,
      documentUrl,
    ]
  );

  res.status(201).json({
    user,
    lawyer: lawyerResult.rows[0],
    token: generateToken(user),
    message:
      "تم إرسال طلب التسجيل. سيتم مراجعة الوثائق من الإدارة قبل ظهور ملفك للعملاء.",
  });
}

export async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError("البريد الإلكتروني وكلمة المرور مطلوبان", 400);
  }

  const result = await db.query("SELECT * FROM users WHERE email = $1", [email]);
  const user = result.rows[0];

  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new AppError("البريد الإلكتروني أو كلمة المرور غير صحيحة", 401);
  }

  if (user.status === "suspended") {
    throw new AppError("هذا الحساب معلّق حالياً. تواصل مع الإدارة.", 403);
  }

  delete user.password;

  res.json({ user, token: generateToken(user) });
}
