DROP TABLE IF EXISTS complaints CASCADE;
DROP TABLE IF EXISTS ratings CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS consultations CASCADE;
DROP TABLE IF EXISTS lawyers CASCADE;
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
id          SERIAL PRIMARY KEY,
name        TEXT NOT NULL,
email       TEXT UNIQUE NOT NULL,
password    TEXT NOT NULL,
phone       TEXT,
city        TEXT,
role        TEXT NOT NULL CHECK (role IN ('client', 'lawyer', 'admin')),
status      TEXT NOT NULL DEFAULT 'active'
CHECK (status IN ('active', 'suspended')),
created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE lawyers (
id                 SERIAL PRIMARY KEY,
user_id            INTEGER UNIQUE NOT NULL
REFERENCES users(id) ON DELETE CASCADE,

specialty          TEXT,
specialties        TEXT[] NOT NULL DEFAULT '{}',
experience         INTEGER NOT NULL DEFAULT 0,
bio                TEXT,
image              TEXT,
response_time      TEXT,

bar_number         TEXT,
document_url       TEXT,

prices             JSONB NOT NULL DEFAULT '{}',
consultation_types TEXT[] NOT NULL DEFAULT '{}',

available          BOOLEAN NOT NULL DEFAULT TRUE,
verified           BOOLEAN NOT NULL DEFAULT FALSE,

rating_avg         NUMERIC(3,2) NOT NULL DEFAULT 0,
reviews_count      INTEGER NOT NULL DEFAULT 0,
cases_count        INTEGER NOT NULL DEFAULT 0,

created_at         TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE consultations (
id              SERIAL PRIMARY KEY,
client_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
lawyer_id       INTEGER NOT NULL REFERENCES lawyers(id) ON DELETE CASCADE,

type            TEXT NOT NULL CHECK (type IN ('phone', 'video', 'office')),
title           TEXT NOT NULL,
description     TEXT NOT NULL,

scheduled_date  DATE NOT NULL,
scheduled_time  TEXT NOT NULL,
price           INTEGER NOT NULL,

status          TEXT NOT NULL DEFAULT 'pending'
CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),

client_phone    TEXT,
meeting_link    TEXT,
office_location TEXT,

created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX uq_consultation_slot
ON consultations (lawyer_id, scheduled_date, scheduled_time)
WHERE status IN ('pending', 'confirmed');

CREATE TABLE payments (
id              SERIAL PRIMARY KEY,
consultation_id INTEGER UNIQUE NOT NULL
REFERENCES consultations(id) ON DELETE CASCADE,
amount          INTEGER NOT NULL,
method          TEXT NOT NULL DEFAULT 'card',
status          TEXT NOT NULL DEFAULT 'paid'
CHECK (status IN ('paid', 'refunded')),
created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE ratings (
id              SERIAL PRIMARY KEY,
consultation_id INTEGER UNIQUE NOT NULL
REFERENCES consultations(id) ON DELETE CASCADE,
client_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
lawyer_id       INTEGER NOT NULL REFERENCES lawyers(id) ON DELETE CASCADE,
rating          INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
comment         TEXT,
created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE complaints (
id              SERIAL PRIMARY KEY,
consultation_id INTEGER REFERENCES consultations(id) ON DELETE SET NULL,
complainant_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
accused_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
type            TEXT NOT NULL,
details         TEXT NOT NULL,
status          TEXT NOT NULL DEFAULT 'open'
CHECK (status IN ('open', 'resolved')),
created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_lawyers_specialty ON lawyers(specialty);
CREATE INDEX idx_lawyers_verified ON lawyers(verified);
CREATE INDEX idx_consultations_client ON consultations(client_id);
CREATE INDEX idx_consultations_lawyer ON consultations(lawyer_id);
CREATE INDEX idx_consultations_status ON consultations(status);
CREATE INDEX idx_payments_consultation ON payments(consultation_id);
CREATE INDEX idx_ratings_lawyer ON ratings(lawyer_id);
CREATE INDEX idx_complaints_status ON complaints(status);