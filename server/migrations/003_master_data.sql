-- Create Master Data Tables
CREATE TABLE mst_departments (
    id serial PRIMARY KEY,
    name varchar NOT NULL UNIQUE,
    is_active boolean DEFAULT true,
    created_at timestamp DEFAULT NOW()
);

CREATE TABLE mst_companies (
    id serial PRIMARY KEY,
    name varchar NOT NULL UNIQUE,
    is_active boolean DEFAULT true,
    created_at timestamp DEFAULT NOW()
);

CREATE TABLE mst_roles (
    id serial PRIMARY KEY,
    code varchar NOT NULL UNIQUE,
    name varchar NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp DEFAULT NOW()
);

-- Seed initial Roles
INSERT INTO mst_roles (code, name) VALUES
('OWNER', 'ผู้รับผิดชอบข้อมูล'),
('PROCESSOR', 'ผู้ประมวลผลข้อมูลส่วนบุคคล'),
('DPO', 'เจ้าหน้าที่คุ้มครองข้อมูลส่วนบุคคล'),
('AUDITOR', 'ผู้ตรวจสอบ'),
('ADMIN', 'ผู้ดูแลระบบ'),
('EXECUTIVE', 'ผู้บริหาร')
ON CONFLICT (code) DO NOTHING;

-- Seed departments from existing users table
INSERT INTO mst_departments (name)
SELECT DISTINCT department FROM users WHERE department IS NOT NULL
ON CONFLICT (name) DO NOTHING;

-- Seed companies from existing users table
INSERT INTO mst_companies (name)
SELECT DISTINCT company_name FROM users WHERE company_name IS NOT NULL
ON CONFLICT (name) DO NOTHING;

-- Alter users.role to VARCHAR
ALTER TABLE users ALTER COLUMN role TYPE varchar USING role::varchar;
DROP TYPE IF EXISTS user_role_enum CASCADE;
