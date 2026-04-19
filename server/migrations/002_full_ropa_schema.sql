-- =============================================================================
-- RoPa Web Service V2 ─ Massive ROPA Schema Rewrite
-- =============================================================================

-- =============================================================================
-- 1. DROP EXISTING SCHEMA TO CLEAN THE ENVIRONMENT
-- =============================================================================
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS document_versions CASCADE;
DROP TABLE IF EXISTS review_dpo_assignments CASCADE;
DROP TABLE IF EXISTS review_feedbacks CASCADE;
DROP TABLE IF EXISTS review_assignments CASCADE;
DROP TABLE IF EXISTS document_review_cycles CASCADE;

DROP TABLE IF EXISTS processor_storage_methods CASCADE;
DROP TABLE IF EXISTS processor_storage_types CASCADE;
DROP TABLE IF EXISTS processor_data_sources CASCADE;
DROP TABLE IF EXISTS processor_collection_methods CASCADE;
DROP TABLE IF EXISTS processor_data_types CASCADE;
DROP TABLE IF EXISTS processor_data_categories CASCADE;
DROP TABLE IF EXISTS processor_personal_data_items CASCADE;
DROP TABLE IF EXISTS ropa_processor_sections CASCADE;

DROP TABLE IF EXISTS owner_minor_consent_types CASCADE;
DROP TABLE IF EXISTS owner_minor_consents CASCADE;
DROP TABLE IF EXISTS owner_storage_methods CASCADE;
DROP TABLE IF EXISTS owner_storage_types CASCADE;
DROP TABLE IF EXISTS owner_data_sources CASCADE;
DROP TABLE IF EXISTS owner_collection_methods CASCADE;
DROP TABLE IF EXISTS owner_data_types CASCADE;
DROP TABLE IF EXISTS owner_data_categories CASCADE;
DROP TABLE IF EXISTS owner_personal_data_items CASCADE;
DROP TABLE IF EXISTS ropa_owner_sections CASCADE;

DROP TABLE IF EXISTS document_participants CASCADE;
DROP TABLE IF EXISTS ropa_risk_assessments CASCADE;
DROP TABLE IF EXISTS processor_assignments CASCADE;
DROP TABLE IF EXISTS auditor_assignments CASCADE;
DROP TABLE IF EXISTS document_deletion_requests CASCADE;
DROP TABLE IF EXISTS password_reset_tokens CASCADE;
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS ropa_documents CASCADE;
DROP TABLE IF EXISTS refresh_tokens CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS role_permissions CASCADE;
DROP TABLE IF EXISTS permissions CASCADE;
DROP TABLE IF EXISTS roles CASCADE;

DROP TYPE IF EXISTS document_participant_role_enum CASCADE;
DROP TYPE IF EXISTS ropa_section CASCADE;
DROP TYPE IF EXISTS feedback_target_enum CASCADE;
DROP TYPE IF EXISTS feedback_status_enum CASCADE;
DROP TYPE IF EXISTS review_assignment_role_enum CASCADE;
DROP TYPE IF EXISTS review_assignment_status_enum CASCADE;
DROP TYPE IF EXISTS decision_enum CASCADE;
DROP TYPE IF EXISTS deletion_request_status_enum CASCADE;
DROP TYPE IF EXISTS review_status_enum CASCADE;
DROP TYPE IF EXISTS deletion_status_enum CASCADE;
DROP TYPE IF EXISTS document_status_enum CASCADE;
DROP TYPE IF EXISTS user_role_enum CASCADE;
DROP TYPE IF EXISTS risk_level_enum CASCADE;
DROP TYPE IF EXISTS auditor_assignment_status_enum CASCADE;
DROP TYPE IF EXISTS assignment_status_enum CASCADE;
DROP TYPE IF EXISTS user_status_enum CASCADE;
DROP TYPE IF EXISTS auditor_type_enum CASCADE;

-- =============================================================================
-- 2. CREATE ENUMS
-- =============================================================================
CREATE TYPE user_status_enum AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE assignment_status_enum AS ENUM ('IN_PROGRESS', 'SUBMITTED', 'OVERDUE');
CREATE TYPE auditor_assignment_status_enum AS ENUM ('IN_REVIEW', 'VERIFIED', 'OVERDUE');
CREATE TYPE risk_level_enum AS ENUM ('LOW', 'MEDIUM', 'HIGH');
CREATE TYPE user_role_enum AS ENUM ('OWNER', 'PROCESSOR', 'DPO', 'AUDITOR', 'ADMIN', 'EXECUTIVE');
CREATE TYPE document_status_enum AS ENUM ('IN_PROGRESS', 'UNDER_REVIEW', 'COMPLETED', 'EXPIRED');
CREATE TYPE deletion_status_enum AS ENUM ('DELETE_PENDING', 'DELETED');
CREATE TYPE review_status_enum AS ENUM ('IN_REVIEW', 'CHANGES_REQUESTED', 'APPROVED');
CREATE TYPE deletion_request_status_enum AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');
CREATE TYPE decision_enum AS ENUM ('APPROVED', 'REJECTED');
CREATE TYPE review_assignment_status_enum AS ENUM ('FIX_IN_PROGRESS', 'FIX_SUBMITTED', 'COMPLETED');
CREATE TYPE review_assignment_role_enum AS ENUM ('OWNER', 'PROCESSOR');
CREATE TYPE feedback_status_enum AS ENUM ('OPEN', 'RESOLVED');
CREATE TYPE feedback_target_enum AS ENUM ('OWNER_SECTION', 'PROCESSOR_SECTION', 'RISK_ASSESSMENT');
CREATE TYPE ropa_section AS ENUM ('DRAFT', 'SUBMITTED');
CREATE TYPE document_participant_role_enum AS ENUM ('OWNER', 'EDITOR', 'VIEWER');
CREATE TYPE auditor_type_enum AS ENUM ('INTERNAL', 'EXTERNAL');


-- =============================================================================
-- 3. CREATE TABLES
-- =============================================================================

CREATE TABLE users (
  id serial PRIMARY KEY,
  email varchar UNIQUE NOT NULL,
  username varchar UNIQUE,
  password_hash varchar NOT NULL,
  role user_role_enum NOT NULL,
  first_name varchar,
  last_name varchar,
  department varchar,
  company_name varchar,
  auditor_type auditor_type_enum,
  status user_status_enum NOT NULL DEFAULT 'ACTIVE',
  created_at timestamp DEFAULT NOW()
);

-- Note: The new DBML specifies "password_hash", not "hashed_password"
-- We will adjust ORM and models accordingly.

CREATE TABLE user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id int NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  refresh_token_hash varchar NOT NULL,
  user_agent text,
  ip_address varchar,
  expires_at timestamp NOT NULL,
  revoked_at timestamp,
  created_at timestamp DEFAULT NOW()
);

CREATE TABLE password_reset_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id int NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash varchar NOT NULL,
  expires_at timestamp NOT NULL,
  used_at timestamp,
  created_at timestamp DEFAULT NOW()
);

CREATE TABLE ropa_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title varchar,
  description text,
  created_by int NOT NULL REFERENCES users(id),
  updated_by int REFERENCES users(id),
  status document_status_enum NOT NULL DEFAULT 'IN_PROGRESS',
  deletion_status deletion_status_enum,
  deleted_at timestamp,
  processor_company varchar,
  due_date timestamp,
  last_approved_at timestamp,
  next_review_due_at timestamp,
  review_interval_days int DEFAULT 365,
  created_at timestamp DEFAULT NOW(),
  updated_at timestamp DEFAULT NOW()
);

CREATE TABLE document_deletion_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES ropa_documents(id) ON DELETE CASCADE,
  requested_by int NOT NULL REFERENCES users(id),
  owner_reason text NOT NULL,
  dpo_id int REFERENCES users(id),
  dpo_decision decision_enum,
  dpo_reason text,
  status deletion_request_status_enum NOT NULL DEFAULT 'PENDING',
  requested_at timestamp DEFAULT NOW(),
  decided_at timestamp
);

CREATE TABLE auditor_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES ropa_documents(id) ON DELETE CASCADE,
  auditor_id int NOT NULL REFERENCES users(id),
  assigned_by int NOT NULL REFERENCES users(id),
  auditor_type auditor_type_enum,
  department varchar,
  preferred_title varchar,
  preferred_first_name varchar,
  preferred_last_name varchar,
  due_date timestamp NOT NULL,
  status auditor_assignment_status_enum NOT NULL DEFAULT 'IN_REVIEW',
  created_at timestamp DEFAULT NOW()
);

CREATE TABLE processor_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES ropa_documents(id) ON DELETE CASCADE,
  processor_id int NOT NULL REFERENCES users(id),
  assigned_by int NOT NULL REFERENCES users(id),
  due_date timestamp,
  status assignment_status_enum DEFAULT 'IN_PROGRESS',
  created_at timestamp DEFAULT NOW()
);

CREATE TABLE ropa_risk_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid UNIQUE NOT NULL REFERENCES ropa_documents(id) ON DELETE CASCADE,
  assessed_by int NOT NULL REFERENCES users(id),
  likelihood int,
  impact int,
  risk_score int,
  risk_level risk_level_enum,
  notes text,
  assessed_at timestamp DEFAULT NOW()
);

CREATE TABLE document_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES ropa_documents(id) ON DELETE CASCADE,
  user_id int NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role document_participant_role_enum
);

CREATE TABLE ropa_owner_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid UNIQUE NOT NULL REFERENCES ropa_documents(id) ON DELETE CASCADE,
  owner_id int NOT NULL REFERENCES users(id),
  updated_by int REFERENCES users(id),
  
  title_prefix varchar,
  first_name varchar,
  last_name varchar,
  address text,
  email varchar,
  phone varchar,
  
  contact_email varchar,
  company_phone varchar,
  
  data_owner_name varchar,
  processing_activity text,
  purpose_of_processing text,
  
  data_source_other text,
  retention_value int,
  retention_unit varchar,
  access_control_policy text,
  deletion_method text,
  
  legal_basis text,
  has_cross_border_transfer boolean,
  transfer_country text,
  transfer_in_group text,
  transfer_method text,
  transfer_protection_standard text,
  transfer_exception text,
  exemption_usage text,
  refusal_handling text,
  
  org_measures text,
  access_control_measures text,
  technical_measures text,
  responsibility_measures text,
  physical_measures text,
  audit_measures text,
  
  status ropa_section DEFAULT 'DRAFT',
  updated_at timestamp DEFAULT NOW()
);

CREATE TABLE owner_personal_data_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_section_id uuid NOT NULL REFERENCES ropa_owner_sections(id) ON DELETE CASCADE,
  type varchar,
  other_description text
);

CREATE TABLE owner_data_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_section_id uuid NOT NULL REFERENCES ropa_owner_sections(id) ON DELETE CASCADE,
  category varchar
);

CREATE TABLE owner_data_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_section_id uuid NOT NULL REFERENCES ropa_owner_sections(id) ON DELETE CASCADE,
  type varchar
);

CREATE TABLE owner_collection_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_section_id uuid NOT NULL REFERENCES ropa_owner_sections(id) ON DELETE CASCADE,
  method varchar
);

CREATE TABLE owner_data_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_section_id uuid NOT NULL REFERENCES ropa_owner_sections(id) ON DELETE CASCADE,
  source varchar,
  other_description text
);

CREATE TABLE owner_storage_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_section_id uuid NOT NULL REFERENCES ropa_owner_sections(id) ON DELETE CASCADE,
  type varchar
);

CREATE TABLE owner_storage_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_section_id uuid NOT NULL REFERENCES ropa_owner_sections(id) ON DELETE CASCADE,
  method varchar,
  other_description text
);

CREATE TABLE owner_minor_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_section_id uuid NOT NULL REFERENCES ropa_owner_sections(id) ON DELETE CASCADE
);

CREATE TABLE owner_minor_consent_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consent_id uuid NOT NULL REFERENCES owner_minor_consents(id) ON DELETE CASCADE,
  type varchar
);


CREATE TABLE ropa_processor_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES ropa_documents(id) ON DELETE CASCADE,
  processor_id int NOT NULL REFERENCES users(id),
  updated_by int REFERENCES users(id),
  
  title_prefix varchar,
  first_name varchar,
  last_name varchar,
  address text,
  email varchar,
  phone varchar,
  
  processor_name varchar,
  controller_address text,
  processing_activity text,
  purpose_of_processing text,
  
  data_source_other text,
  retention_value int,
  retention_unit varchar,
  access_policy text,
  deletion_method text,
  
  legal_basis text,
  has_cross_border_transfer boolean,
  transfer_country text,
  transfer_in_group text,
  transfer_method text,
  transfer_protection_standard text,
  transfer_exception text,
  exemption_usage text,
  refusal_handling text,
  
  org_measures text,
  access_control_measures text,
  technical_measures text,
  responsibility_measures text,
  physical_measures text,
  audit_measures text,
  
  status ropa_section DEFAULT 'DRAFT',
  updated_at timestamp DEFAULT NOW(),
  
  UNIQUE (document_id, processor_id)
);

CREATE TABLE processor_personal_data_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  processor_section_id uuid NOT NULL REFERENCES ropa_processor_sections(id) ON DELETE CASCADE,
  type varchar,
  other_description text
);

CREATE TABLE processor_data_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  processor_section_id uuid NOT NULL REFERENCES ropa_processor_sections(id) ON DELETE CASCADE,
  category varchar
);

CREATE TABLE processor_data_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  processor_section_id uuid NOT NULL REFERENCES ropa_processor_sections(id) ON DELETE CASCADE,
  type varchar
);

CREATE TABLE processor_collection_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  processor_section_id uuid NOT NULL REFERENCES ropa_processor_sections(id) ON DELETE CASCADE,
  method varchar
);

CREATE TABLE processor_data_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  processor_section_id uuid NOT NULL REFERENCES ropa_processor_sections(id) ON DELETE CASCADE,
  source varchar,
  other_description text
);

CREATE TABLE processor_storage_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  processor_section_id uuid NOT NULL REFERENCES ropa_processor_sections(id) ON DELETE CASCADE,
  type varchar
);

CREATE TABLE processor_storage_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  processor_section_id uuid NOT NULL REFERENCES ropa_processor_sections(id) ON DELETE CASCADE,
  method varchar,
  other_description text
);


CREATE TABLE document_review_cycles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES ropa_documents(id) ON DELETE CASCADE,
  cycle_number int,
  requested_by int NOT NULL REFERENCES users(id),
  reviewed_by int REFERENCES users(id),
  status review_status_enum NOT NULL DEFAULT 'IN_REVIEW',
  requested_at timestamp DEFAULT NOW(),
  reviewed_at timestamp
);

CREATE TABLE review_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_cycle_id uuid NOT NULL REFERENCES document_review_cycles(id) ON DELETE CASCADE,
  user_id int NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role review_assignment_role_enum NOT NULL,
  status review_assignment_status_enum NOT NULL DEFAULT 'FIX_IN_PROGRESS',
  updated_at timestamp DEFAULT NOW()
);

CREATE TABLE review_feedbacks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_cycle_id uuid NOT NULL REFERENCES document_review_cycles(id) ON DELETE CASCADE,
  from_user_id int NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user_id int NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_type feedback_target_enum NOT NULL,
  target_id uuid NOT NULL,
  field_name varchar,
  comment text,
  status feedback_status_enum NOT NULL DEFAULT 'OPEN',
  created_at timestamp DEFAULT NOW(),
  resolved_at timestamp
);

CREATE TABLE review_dpo_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_cycle_id uuid NOT NULL REFERENCES document_review_cycles(id) ON DELETE CASCADE,
  dpo_id int NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_at timestamp DEFAULT NOW(),
  assignment_method varchar
);

CREATE TABLE audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id int REFERENCES users(id) ON DELETE SET NULL,
  action varchar,
  entity_type varchar,
  entity_id uuid,
  field_name varchar,
  old_value text,
  new_value text,
  metadata jsonb,
  created_at timestamp DEFAULT NOW()
);

CREATE TABLE document_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_cycle_id uuid REFERENCES document_review_cycles(id) ON DELETE CASCADE,
  document_id uuid NOT NULL REFERENCES ropa_documents(id) ON DELETE CASCADE,
  version_number int,
  snapshot jsonb,
  created_by int REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamp DEFAULT NOW()
);

-- =============================================================================
-- Admin Root User Generation
-- Note: bcrypt hash for Admin@1234
-- =============================================================================
INSERT INTO users (email, username, password_hash, role, first_name, last_name, status)
VALUES (
    'admin@ropa.local',
    'admin',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewlzAM3FeGnI6mkm',
    'ADMIN',
    'System',
    'Administrator',
    'ACTIVE'
);
