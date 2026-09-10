# Estsharah-app-server
This is the **backend** for **ISTISHARA**, a legal consultation platform that connects clients with licensed lawyers.

The backend provides REST APIs for authentication, users, lawyers, consultations, payments, complaints, and legal news.

---

## 📝 Description

ISTISHARA is a legal consultation platform designed to connect:

- 👤 **Clients** with licensed lawyers
- ⚖️ **Lawyers** with clients requesting legal consultations
- 🛡️ **Administrators** with tools to manage the platform

The backend is responsible for:

- User authentication and authorization
- Lawyer registration and verification
- Lawyer profile management
- Consultation booking and management
- Payment management
- Complaints management
- Legal news retrieval
- PostgreSQL database operations
- Lawyer verification document uploads

---

## 🛠️ Tech Stack

- **Node.js**
- **Express.js**
- **PostgreSQL**
- **pg** — PostgreSQL client
- **JWT** — Authentication
- **bcrypt** — Password hashing
- **Multer** — File uploads
- **Axios** — External API requests
- **dotenv** — Environment variables
- **CORS** — Cross-origin requests
- **Morgan** — HTTP request logging

---

## 🚀 Getting Started

### 1. Clone the project

```bash
git clone <your-repository-url>
cd backend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create the environment file

Create a `.env` file in the backend root:

```env
PORT=5000

DATABASE_URL=postgresql://username:password@localhost:5432/database_name

JWT_SECRET=your_jwt_secret_here

CLIENT_URL=http://localhost:5173

GNEWS_API_KEY=YOUR_GNEWS_KEY
```

### 4. Set up PostgreSQL

Create a PostgreSQL database and configure `DATABASE_URL`.

Example:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/istishara
```

### 5. Start the server

```bash
node server.js
```

The API will run locally on:

```text
http://localhost:5000
```

---

# 📁 Project Structure

```text
backend/
│
├── config/
│   └── db.js
│
├── controllers/
│   ├── authController.js
│   ├── userController.js
│   ├── lawyerController.js
│   ├── consultationController.js
│   ├── paymentController.js
│   ├── complaintController.js
│   └── newsController.js
│
├── middleware/
│   ├── asyncHandler.js
│   ├── authMiddleware.js
│   ├── roleMiddleware.js
│   ├── uploadMiddleware.js
│   ├── notFound.js
│   └── errorHandler.js
│
├── routes/
│   ├── authRoutes.js
│   ├── userRoutes.js
│   ├── lawyerRoutes.js
│   ├── consultationRoutes.js
│   ├── paymentRoutes.js
│   ├── complaintRoutes.js
│   └── newsRoutes.js
│
├── utils/
│   └── AppError.js
│
├── uploads/
│   └── lawyers/
│
├── .env
├── .env.example
├── .gitignore
├── package.json
└── server.js
```

---

# 🧩 Architecture

The backend follows a **layered Express architecture**.

```text
Client / Frontend
        │
        ▼
      Routes
        │
        ▼
    Middleware
        │
        ▼
    Controllers
        │
        ├──────────────► PostgreSQL
        │
        └──────────────► External APIs
        │
        ▼
      Response
        │
        ▼
Client / Frontend
```

### Routes

Routes define the API endpoints and connect incoming requests to controllers.

### Middleware

Middleware handles:

- Authentication
- Role-based authorization
- File uploads
- Async errors
- 404 errors
- Global API errors

### Controllers

Controllers contain the main application logic and database operations.

### Database

PostgreSQL stores users, lawyers, consultations, payments, ratings, and complaints.

### External API

The news controller communicates with the GNews API to retrieve Arabic news related to Jordan.

---

# 🔌 API Endpoints

Base URL:

```text
http://localhost:5000/api
```

---

# 🔐 Auth Routes

Base URL:

```text
/api/auth
```

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/signup/client` | Register a new client |
| POST | `/signup/lawyer` | Register a lawyer with a verification document |
| POST | `/login` | Login an existing user |

---

### 🟠 POST `/api/auth/signup/client`

Registers a new client account.

**Authorization:** Not required.

**Request Body:**

> The exact fields accepted by `signupClient` depend on the controller implementation. Use the same field names required by your frontend signup form.

Example structure:

```json
{
  "name": "Ahmad Ali",
  "email": "ahmad@example.com",
  "password": "123456",
  "phone": "0790000000",
  "city": "Amman"
}
```

---

### 🟠 POST `/api/auth/signup/lawyer`

Registers a new lawyer account and uploads the lawyer verification document.

**Authorization:** Not required.

**Content-Type:**

```text
multipart/form-data
```

**File field:**

```text
document
```

The upload middleware accepts:

- JPEG
- PNG
- PDF
- DOC
- DOCX

Maximum file size:

```text
10 MB
```

**Example form fields:**

```text
name = Ahmad Ali
email = ahmad@example.com
password = 123456
phone = 0790000000
city = Amman
specialty = Criminal Law
experience = 5
bio = Experienced lawyer
barNumber = 12345
document = lawyer-document.pdf
```

> The exact non-file fields must match the `signupLawyer` controller/frontend implementation.

---

### 🟠 POST `/api/auth/login`

Logs in an existing user.

**Authorization:** Not required.

**Request Body:**

```json
{
  "email": "ahmad@example.com",
  "password": "123456"
}
```

---

# 👤 User Routes

Base URL:

```text
/api/users
```

All user routes require authentication.

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/me` | Authenticated | Get current user's profile |
| PUT | `/me` | Authenticated | Update current user's profile |
| GET | `/admin/clients` | Admin | Get all clients |
| PUT | `/:id/suspend` | Admin | Suspend a user |
| PUT | `/:id/activate` | Admin | Activate a user |
| DELETE | `/:id` | Admin | Delete a user |

---

### 🟠 GET `/api/users/me`

Returns the profile of the currently authenticated user.

**Authorization:**

```http
Authorization: Bearer <token>
```

**Request Body:**

No request body required.

**Response:**

```json
{
  "id": 1,
  "name": "Ahmad Ali",
  "email": "ahmad@example.com",
  "phone": "0790000000",
  "city": "Amman",
  "role": "client",
  "status": "active",
  "created_at": "2026-09-10T12:00:00.000Z"
}
```

---

### 🟠 PUT `/api/users/me`

Updates the current user's profile.

**Authorization:**

```http
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "name": "Ahmad Ali",
  "phone": "0790000000",
  "city": "Amman"
}
```

---

### 🟠 GET `/api/users/admin/clients`

Returns all client accounts for administrators.

**Authorization:**

```http
Authorization: Bearer <admin-token>
```

**Request Body:**

No request body required.

---

### 🟠 PUT `/api/users/:id/suspend`

Suspends a user account.

**Authorization:**

```http
Authorization: Bearer <admin-token>
```

**URL Parameter:**

```text
id = 15
```

**Request Body:**

No request body required.

---

### 🟠 PUT `/api/users/:id/activate`

Activates a user account.

**Authorization:**

```http
Authorization: Bearer <admin-token>
```

**URL Parameter:**

```text
id = 15
```

**Request Body:**

No request body required.

---

### 🟠 DELETE `/api/users/:id`

Deletes a user account.

**Authorization:**

```http
Authorization: Bearer <admin-token>
```

**URL Parameter:**

```text
id = 15
```

**Request Body:**

No request body required.

---

# ⚖️ Lawyer Routes

Base URL:

```text
/api/lawyers
```

## Public Lawyer Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/count` | Get number of active and verified lawyers |
| GET | `/` | Get all active and verified lawyers |
| GET | `/:id` | Get a lawyer by ID |

---

### 🟠 GET `/api/lawyers/count`

Returns the number of active and verified lawyers.

**Authorization:** Not required.

**Request Body:**

No request body required.

**Response:**

```json
{
  "count": 12
}
```

---

### 🟠 GET `/api/lawyers`

Returns active and verified lawyers.

**Authorization:** Not required.

**Query Parameters:**

```text
search
specialization
city
sortBy
availableOnly
```

Example:

```text
GET /api/lawyers?city=Amman&availableOnly=true
```

**Request Body:**

No request body required.

---

### 🟠 GET `/api/lawyers/:id`

Returns a specific active and verified lawyer.

**Authorization:** Not required.

**URL Parameter:**

```text
id = 5
```

**Request Body:**

No request body required.

---

## Lawyer Profile Routes

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/me` | Lawyer | Get own lawyer profile |
| PUT | `/me` | Lawyer | Update own lawyer profile |
| GET | `/me/stats` | Lawyer | Get lawyer statistics |

---

### 🟠 GET `/api/lawyers/me`

Returns the authenticated lawyer's profile.

**Authorization:**

```http
Authorization: Bearer <lawyer-token>
```

**Request Body:**

No request body required.

---

### 🟠 PUT `/api/lawyers/me`

Updates the authenticated lawyer's profile.

**Authorization:**

```http
Authorization: Bearer <lawyer-token>
```

**Request Body:**

The controller supports the following fields:

```json
{
  "name": "Ahmad Ali",
  "city": "Amman",
  "specialty": "Criminal Law",
  "experience": 5,
  "bio": "Experienced lawyer",
  "prices": {
    "phone": 20,
    "video": 30,
    "office": 40
  },
  "specialties": [
    "Criminal Law",
    "Civil Law"
  ],
  "consultationTypes": [
    "phone",
    "video",
    "office"
  ],
  "available": true,
  "image": "/uploads/lawyers/lawyer.jpg",
  "responseTime": "Within 1 hour"
}
```

Each enabled consultation type must have a valid positive price.

---

### 🟠 GET `/api/lawyers/me/stats`

Returns statistics for the authenticated lawyer.

**Authorization:**

```http
Authorization: Bearer <lawyer-token>
```

**Request Body:**

No request body required.

**Response:**

```json
{
  "cases_count": 10,
  "rating_avg": 4.8,
  "month_consultations": 7,
  "month_earnings": 250,
  "pending_orders": 2
}
```

---

# 🛡️ Admin Lawyer Management

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/admin/all` | Admin | Get all lawyers |
| PUT | `/:id/verify` | Admin | Verify a lawyer |
| PUT | `/:id/suspend` | Admin | Suspend a lawyer |
| PUT | `/:id/activate` | Admin | Activate a lawyer |
| DELETE | `/:id` | Admin | Delete a lawyer |

---

### 🟠 GET `/api/lawyers/admin/all`

Returns all lawyers for administrator management.

**Authorization:**

```http
Authorization: Bearer <admin-token>
```

**Request Body:**

No request body required.

---

### 🟠 PUT `/api/lawyers/:id/verify`

Verifies a lawyer account and activates the associated user.

**Authorization:**

```http
Authorization: Bearer <admin-token>
```

**URL Parameter:**

```text
id = 5
```

**Request Body:**

No request body required.

---

### 🟠 PUT `/api/lawyers/:id/suspend`

Suspends a lawyer account.

**Authorization:**

```http
Authorization: Bearer <admin-token>
```

**URL Parameter:**

```text
id = 5
```

**Request Body:**

No request body required.

---

### 🟠 PUT `/api/lawyers/:id/activate`

Activates a lawyer account.

**Authorization:**

```http
Authorization: Bearer <admin-token>
```

**URL Parameter:**

```text
id = 5
```

**Request Body:**

No request body required.

---

### 🟠 DELETE `/api/lawyers/:id`

Deletes a lawyer account.

**Authorization:**

```http
Authorization: Bearer <admin-token>
```

**URL Parameter:**

```text
id = 5
```

**Request Body:**

No request body required.

---

# 📅 Consultation Routes

Base URL:

```text
/api/consultations
```

### Consultation Status Flow

```text
Pending
   │
   ├── Accept ──► Confirmed ──► Completed
   │
   └── Reject ──► Cancelled

Client can also cancel:
Pending / Confirmed ──► Cancelled

Completed:
Client ──► Rating
```

---

## Public Consultation Route

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/count` | Get number of completed consultations |

---

### 🟠 GET `/api/consultations/count`

Returns the total number of completed consultations.

**Authorization:** Not required.

**Request Body:**

No request body required.

**Response:**

```json
{
  "count": 25
}
```

---

## Client Consultation Routes

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/` | Client | Create a consultation |
| GET | `/me` | Client | Get client's consultations |
| PUT | `/:id/cancel` | Client | Cancel a consultation |
| POST | `/:id/rating` | Client | Rate a completed consultation |

---

### 🟠 POST `/api/consultations`

Creates a new consultation request.

**Authorization:**

```http
Authorization: Bearer <client-token>
```

**Request Body:**

```json
{
  "lawyerId": 5,
  "type": "video",
  "title": "Legal Consultation",
  "description": "I need legal advice regarding my case.",
  "scheduledDate": "2026-09-15",
  "scheduledTime": "18:00",
  "clientPhone": "0790000000"
}
```

`clientPhone` is required for phone consultations.

The selected lawyer must:

- Exist
- Be active
- Be verified
- Be available
- Support the selected consultation type
- Have a valid price for that consultation type

---

### 🟠 GET `/api/consultations/me`

Returns consultations belonging to the authenticated client.

**Authorization:**

```http
Authorization: Bearer <client-token>
```

**Request Body:**

No request body required.

**Response example:**

```json
[
  {
    "id": 1,
    "lawyer_id": 5,
    "type": "video",
    "title": "Legal Consultation",
    "status": "confirmed",
    "price": 30,
    "lawyer_name": "Ahmad Ali",
    "rated": false
  }
]
```

---

### 🟠 PUT `/api/consultations/:id/cancel`

Cancels a pending or confirmed consultation.

**Authorization:**

```http
Authorization: Bearer <client-token>
```

**URL Parameter:**

```text
id = 15
```

**Request Body:**

No request body required.

---

### 🟠 POST `/api/consultations/:id/rating`

Rates a completed consultation.

**Authorization:**

```http
Authorization: Bearer <client-token>
```

**URL Parameter:**

```text
id = 15
```

**Request Body:**

```json
{
  "rating": 5,
  "comment": "Excellent legal consultation."
}
```

Rating must be between `1` and `5`.

A consultation can only be rated once.

---

# ⚖️ Lawyer Consultation Routes

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/lawyer/orders` | Lawyer | Get pending orders |
| GET | `/lawyer/me` | Lawyer | Get lawyer consultations |
| PUT | `/:id/accept` | Lawyer | Accept consultation |
| PUT | `/:id/reject` | Lawyer | Reject consultation |
| PUT | `/:id/complete` | Lawyer | Complete consultation |
| PUT | `/:id/meeting-link` | Lawyer | Send video meeting link |
| PUT | `/:id/office-location` | Lawyer | Send office location |

---

### 🟠 GET `/api/consultations/lawyer/orders`

Returns pending consultation orders assigned to the authenticated lawyer.

**Authorization:**

```http
Authorization: Bearer <lawyer-token>
```

**Request Body:**

No request body required.

---

### 🟠 GET `/api/consultations/lawyer/me`

Returns consultations for the authenticated lawyer.

**Authorization:**

```http
Authorization: Bearer <lawyer-token>
```

Optional query:

```text
?status=completed
```

Without `status=completed`, the controller returns confirmed consultations.

**Request Body:**

No request body required.

---

### 🟠 PUT `/api/consultations/:id/accept`

Accepts a pending consultation.

**Authorization:**

```http
Authorization: Bearer <lawyer-token>
```

**URL Parameter:**

```text
id = 15
```

**Request Body:**

No request body required.

---

### 🟠 PUT `/api/consultations/:id/reject`

Rejects a pending consultation and refunds its payment.

**Authorization:**

```http
Authorization: Bearer <lawyer-token>
```

**URL Parameter:**

```text
id = 15
```

**Request Body:**

No request body required.

---

### 🟠 PUT `/api/consultations/:id/complete`

Marks a confirmed consultation as completed.

**Authorization:**

```http
Authorization: Bearer <lawyer-token>
```

**URL Parameter:**

```text
id = 15
```

**Request Body:**

No request body required.

---

### 🟠 PUT `/api/consultations/:id/meeting-link`

Adds a video meeting link to a confirmed video consultation.

**Authorization:**

```http
Authorization: Bearer <lawyer-token>
```

**URL Parameter:**

```text
id = 15
```

**Request Body:**

```json
{
  "link": "https://meet.google.com/example"
}
```

---

### 🟠 PUT `/api/consultations/:id/office-location`

Adds an office location to a confirmed office consultation.

**Authorization:**

```http
Authorization: Bearer <lawyer-token>
```

**URL Parameter:**

```text
id = 15
```

**Request Body:**

```json
{
  "location": "Amman - Abdali"
}
```

---

# 💳 Payment Routes

Base URL:

```text
/api/payments
```

All payment routes require authentication.

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/` | Client | Create a payment |
| GET | `/me` | Client | Get client's payments |
| PUT | `/:id/refund` | Admin | Refund a payment |

---

### 🟠 POST `/api/payments`

Creates a payment for a consultation.

**Authorization:**

```http
Authorization: Bearer <client-token>
```

**Request Body:**

The exact request fields depend on the current `createPayment` controller implementation. Keep the request body synchronized with that controller and the frontend payment form.

---

### 🟠 GET `/api/payments/me`

Returns payments belonging to the authenticated client.

**Authorization:**

```http
Authorization: Bearer <client-token>
```

**Request Body:**

No request body required.

---

### 🟠 PUT `/api/payments/:id/refund`

Refunds a payment.

**Authorization:**

```http
Authorization: Bearer <admin-token>
```

**URL Parameter:**

```text
id = 20
```

**Request Body:**

No request body required unless required by the payment controller.

---

# 🚨 Complaint Routes

Base URL:

```text
/api/complaints
```

All complaint routes require authentication.

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/` | Client / Lawyer | Create a complaint |
| GET | `/` | Admin | Get all complaints |
| PUT | `/:id/resolve` | Admin | Resolve a complaint |
| DELETE | `/:id` | Admin | Archive a complaint |

---

### 🟠 POST `/api/complaints`

Creates a complaint.

**Authorization:**

```http
Authorization: Bearer <client-or-lawyer-token>
```

**Request Body:**

The exact fields depend on the current `createComplaint` controller implementation.

---

### 🟠 GET `/api/complaints`

Returns all complaints for administrators.

**Authorization:**

```http
Authorization: Bearer <admin-token>
```

**Request Body:**

No request body required.

---

### 🟠 PUT `/api/complaints/:id/resolve`

Resolves a complaint.

**Authorization:**

```http
Authorization: Bearer <admin-token>
```

**URL Parameter:**

```text
id = 10
```

**Request Body:**

The exact fields depend on the current `resolveComplaint` controller implementation.

---

### 🟠 DELETE `/api/complaints/:id`

Archives/deletes a complaint.

**Authorization:**

```http
Authorization: Bearer <admin-token>
```

**URL Parameter:**

```text
id = 10
```

**Request Body:**

No request body required unless required by the controller.

---

# 📰 News Routes

Base URL:

```text
/api/news
```

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/` | Public | Retrieve Arabic news |

---

### 🟠 GET `/api/news`

Retrieves Arabic news related to Jordan using the GNews API.

**Authorization:** Not required.

**Request Body:**

No request body required.

The backend sends parameters similar to:

```text
q=الأردن
lang=ar
country=jo
max=10
```

The GNews API key is stored in the backend environment:

```env
GNEWS_API_KEY=YOUR_GNEWS_KEY
```

---

# 🔐 Authentication

ISTISHARA uses **JSON Web Tokens (JWT)** for authentication.

Protected requests must include:

```http
Authorization: Bearer <token>
```

The authentication middleware:

1. Reads the `Authorization` header.
2. Checks for the `Bearer` scheme.
3. Verifies the JWT.
4. Stores the authenticated user information in `req.user`.
5. Allows the request to continue.

Invalid or expired tokens return:

```text
401 Unauthorized
```

---

# 👥 User Roles

The system supports three roles:

| Role | Responsibilities |
|------|------------------|
| `client` | Register, login, browse lawyers, book consultations, cancel consultations, make payments, and rate completed consultations |
| `lawyer` | Manage profile, receive consultation orders, accept/reject consultations, complete consultations, and provide meeting/location information |
| `admin` | Manage users, verify lawyers, manage lawyer accounts, manage complaints, and refund payments |

---

# 🛡️ Middleware

## `authMiddleware.js`

Protects routes that require a logged-in user.

```text
Authorization: Bearer <token>
```

---

## `roleMiddleware.js`

Controls access according to user role.

Examples:

```js
roleMiddleware("client")
```

```js
roleMiddleware("lawyer")
```

```js
roleMiddleware("admin")
```

Multiple roles are supported:

```js
roleMiddleware("client", "lawyer")
```

---

## `asyncHandler.js`

Provides centralized handling for asynchronous controller errors.

Controllers can throw errors without repeating a `try/catch` block around every database operation.

---

## `uploadMiddleware.js`

Handles lawyer verification document uploads using Multer.

Configuration includes:

- `10 MB` maximum file size
- JPEG
- PNG
- PDF
- DOC
- DOCX

Files are stored in:

```text
uploads/lawyers/
```

---

## `notFound.js`

Handles requests for API endpoints that do not exist.

---

## `errorHandler.js`

Provides centralized error responses.

Known PostgreSQL errors such as unique and foreign-key violations are converted into API responses.

Unexpected errors are logged on the server while a general message is returned to the client.

---

# ❌ Error Handling

The project uses a custom `AppError` class:

```js
export class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}
```

Example API error:

```json
{
  "message": "المحامي غير موجود"
}
```

Common status codes:

| Status | Meaning |
|--------|---------|
| `400` | Bad Request |
| `401` | Unauthorized |
| `404` | Not Found |
| `409` | Conflict |
| `500` | Internal Server Error |
| `502` | External service failure, when used by the news controller |

---

# 🗄️ Database

ISTISHARA uses **PostgreSQL** as its relational database.

The backend connects through the `pg` package.

Database configuration:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/database_name
```

Main application data includes:

- Users
- Lawyers
- Consultations
- Payments
- Ratings
- Complaints

---

# 📤 File Uploads

Lawyer verification documents are uploaded through:

```text
POST /api/auth/signup/lawyer
```

The file field is:

```text
document
```

Supported file types:

```text
JPEG
PNG
PDF
DOC
DOCX
```

Maximum file size:

```text
10 MB
```

Uploaded files are stored in:

```text
uploads/lawyers/
```

They are exposed by Express through:

```text
/uploads
```

---

# 🌐 Frontend Connection

Local development:

```text
Frontend:
http://localhost:5173

Backend:
http://localhost:5000
```

API base URL:

```text
http://localhost:5000/api
```

Example:

```text
GET http://localhost:5000/api/lawyers
```

CORS is configured using:

```env
CLIENT_URL=http://localhost:5173
```

---

# 📊 API Overview

```text
/api
│
├── /auth
│   ├── POST /signup/client
│   ├── POST /signup/lawyer
│   └── POST /login
│
├── /users
│   ├── GET    /me
│   ├── PUT    /me
│   ├── GET    /admin/clients
│   ├── PUT    /:id/suspend
│   ├── PUT    /:id/activate
│   └── DELETE /:id
│
├── /lawyers
│   ├── GET    /count
│   ├── GET    /
│   ├── GET    /:id
│   ├── GET    /me
│   ├── PUT    /me
│   ├── GET    /me/stats
│   ├── GET    /admin/all
│   ├── PUT    /:id/verify
│   ├── PUT    /:id/suspend
│   ├── PUT    /:id/activate
│   └── DELETE /:id
│
├── /consultations
│   ├── GET    /count
│   ├── POST   /
│   ├── GET    /me
│   ├── GET    /lawyer/orders
│   ├── GET    /lawyer/me
│   ├── PUT    /:id/cancel
│   ├── POST   /:id/rating
│   ├── PUT    /:id/accept
│   ├── PUT    /:id/reject
│   ├── PUT    /:id/complete
│   ├── PUT    /:id/meeting-link
│   └── PUT    /:id/office-location
│
├── /payments
│   ├── POST   /
│   ├── GET    /me
│   └── PUT    /:id/refund
│
├── /complaints
│   ├── POST   /
│   ├── GET    /
│   ├── PUT    /:id/resolve
│   └── DELETE /:id
│
└── /news
    └── GET    /
```

---

# 🔄 Request Flow

A typical protected request follows this flow:

```text
Frontend
   │
   │ HTTP Request
   ▼
Express Router
   │
   ▼
Authentication Middleware
   │
   ▼
Role Middleware
   │
   ▼
Async Handler
   │
   ▼
Controller
   │
   ├──────────────► PostgreSQL
   │
   └──────────────► External API
   │
   ▼
Response
   │
   ▼
Frontend
```


# 🔒 Environment Variables

The backend uses environment variables for configuration and sensitive values.



### Environment Variable Description

| Variable | Purpose |
|----------|---------|
| `PORT` | Express server port |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret used to sign and verify JWT tokens |
| `CLIENT_URL` | Frontend URL used by CORS |
| `GNEWS_API_KEY` | API key used to retrieve news |

---

# ⚠️ Security

Do not commit the `.env` file to GitHub.

Recommended `.gitignore` entries:

```gitignore
.env
node_modules/
uploads/
```

---

# ❤️ Health Check

The backend provides a simple root endpoint:

```text
GET /
```

Response:

```text
ISTISHARA API is running
```

This can be used as a basic server health check.

---

# 🧪 Development

Before starting the backend, make sure:

- Node.js is installed
- PostgreSQL is running
- The database exists
- `DATABASE_URL` is configured
- `JWT_SECRET` is configured
- `GNEWS_API_KEY` is configured
- Dependencies are installed

Start the server:

```bash
node server.js
```

---

# 📋 API Design Principles

The backend follows several development principles:

- REST-style API endpoints
- Separation of routes and controllers
- Centralized authentication
- Role-based authorization
- Centralized error handling
- Parameterized PostgreSQL queries
- Environment-based configuration
- File upload validation
- Reusable middleware
- Clear separation between public and protected routes

---

# 📄 License

This project was developed as part of an academic/software development project.

**All rights reserved.**

The source code may not be redistributed, modified, or reused without permission from the project owner(s).
