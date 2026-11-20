-- Esquema inicial MySQL 8.0 para la plataforma educativa del
-- Colegio Jose Maria Obando. Los archivos binarios se guardan en
-- almacenamiento privado; aquí solo se conserva su metadata.

CREATE DATABASE IF NOT EXISTS colegio_jose_maria_obando
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;

USE colegio_jose_maria_obando;

CREATE TABLE users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  login VARCHAR(120) NOT NULL,
  email VARCHAR(254) NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('teacher', 'student') NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(30) NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
    ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_login (login),
  UNIQUE KEY uq_users_email (email),
  KEY idx_users_name (last_name, first_name),
  CONSTRAINT chk_users_login_not_blank CHECK (CHAR_LENGTH(TRIM(login)) > 0)
) ENGINE=InnoDB;

CREATE TABLE teacher_profiles (
  user_id BIGINT UNSIGNED NOT NULL,
  staff_code VARCHAR(40) NULL,
  PRIMARY KEY (user_id),
  UNIQUE KEY uq_teacher_staff_code (staff_code),
  CONSTRAINT fk_teacher_user FOREIGN KEY (user_id) REFERENCES users (id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE student_profiles (
  user_id BIGINT UNSIGNED NOT NULL,
  student_code VARCHAR(40) NULL,
  PRIMARY KEY (user_id),
  UNIQUE KEY uq_student_code (student_code),
  CONSTRAINT fk_student_user FOREIGN KEY (user_id) REFERENCES users (id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE academic_years (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(20) NOT NULL,
  starts_on DATE NOT NULL,
  ends_on DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (id),
  UNIQUE KEY uq_academic_year_name (name),
  CONSTRAINT chk_academic_year_dates CHECK (ends_on >= starts_on)
) ENGINE=InnoDB;

CREATE TABLE academic_periods (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  academic_year_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(60) NOT NULL,
  starts_on DATE NOT NULL,
  ends_on DATE NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_period_name_per_year (academic_year_id, name),
  KEY idx_period_dates (starts_on, ends_on),
  CONSTRAINT chk_period_dates CHECK (ends_on >= starts_on),
  CONSTRAINT fk_period_year FOREIGN KEY (academic_year_id)
    REFERENCES academic_years (id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE class_groups (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  academic_year_id BIGINT UNSIGNED NOT NULL,
  grade_level VARCHAR(30) NOT NULL,
  group_name VARCHAR(20) NOT NULL DEFAULT 'A',
  display_name VARCHAR(80) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  PRIMARY KEY (id),
  UNIQUE KEY uq_group_year_grade_name (academic_year_id, grade_level, group_name),
  KEY idx_groups_year (academic_year_id, is_active),
  CONSTRAINT fk_group_year FOREIGN KEY (academic_year_id)
    REFERENCES academic_years (id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE subjects (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  PRIMARY KEY (id),
  UNIQUE KEY uq_subject_name (name)
) ENGINE=InnoDB;

-- Una clase es una asignatura de un grupo durante un periodo académico.
CREATE TABLE classes (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  class_group_id BIGINT UNSIGNED NOT NULL,
  subject_id BIGINT UNSIGNED NOT NULL,
  academic_period_id BIGINT UNSIGNED NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_class_group_subject_period
    (class_group_id, subject_id, academic_period_id),
  KEY idx_classes_subject (subject_id, academic_period_id),
  CONSTRAINT fk_class_group FOREIGN KEY (class_group_id)
    REFERENCES class_groups (id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_class_subject FOREIGN KEY (subject_id)
    REFERENCES subjects (id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_class_period FOREIGN KEY (academic_period_id)
    REFERENCES academic_periods (id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE class_teachers (
  class_id BIGINT UNSIGNED NOT NULL,
  teacher_id BIGINT UNSIGNED NOT NULL,
  assigned_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (class_id, teacher_id),
  KEY idx_class_teachers_teacher (teacher_id, class_id),
  CONSTRAINT fk_class_teacher_class FOREIGN KEY (class_id) REFERENCES classes (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_class_teacher_user FOREIGN KEY (teacher_id) REFERENCES teacher_profiles (user_id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE enrollments (
  class_group_id BIGINT UNSIGNED NOT NULL,
  student_id BIGINT UNSIGNED NOT NULL,
  enrolled_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  status ENUM('active', 'transferred', 'completed') NOT NULL DEFAULT 'active',
  PRIMARY KEY (class_group_id, student_id),
  KEY idx_enrollments_student (student_id, status),
  CONSTRAINT fk_enrollment_group FOREIGN KEY (class_group_id)
    REFERENCES class_groups (id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_enrollment_student FOREIGN KEY (student_id)
    REFERENCES student_profiles (user_id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE tasks (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  class_id BIGINT UNSIGNED NOT NULL,
  created_by BIGINT UNSIGNED NOT NULL,
  title VARCHAR(180) NOT NULL,
  instructions TEXT NOT NULL,
  status ENUM('draft', 'published', 'withdrawn') NOT NULL DEFAULT 'draft',
  published_at DATETIME(3) NULL,
  due_at DATETIME(3) NULL,
  allow_late_submissions BOOLEAN NOT NULL DEFAULT FALSE,
  allow_resubmissions BOOLEAN NOT NULL DEFAULT FALSE,
  max_score DECIMAL(7,2) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
    ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_tasks_class_status_due (class_id, status, due_at),
  KEY idx_tasks_author (created_by, created_at),
  CONSTRAINT chk_tasks_title_not_blank CHECK (CHAR_LENGTH(TRIM(title)) > 0),
  CONSTRAINT chk_tasks_score_positive CHECK (max_score IS NULL OR max_score > 0),
  CONSTRAINT fk_task_class FOREIGN KEY (class_id) REFERENCES classes (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_task_author FOREIGN KEY (created_by) REFERENCES teacher_profiles (user_id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE task_attachments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  task_id BIGINT UNSIGNED NOT NULL,
  uploaded_by BIGINT UNSIGNED NOT NULL,
  storage_key VARCHAR(512) NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  mime_type VARCHAR(150) NOT NULL,
  file_size_bytes BIGINT UNSIGNED NOT NULL,
  checksum_sha256 CHAR(64) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_task_attachments_task (task_id),
  CONSTRAINT fk_task_attachment_task FOREIGN KEY (task_id) REFERENCES tasks (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_task_attachment_user FOREIGN KEY (uploaded_by) REFERENCES users (id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE submissions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  task_id BIGINT UNSIGNED NOT NULL,
  student_id BIGINT UNSIGNED NOT NULL,
  answer_text TEXT NULL,
  status ENUM('submitted', 'reviewed', 'withdrawn') NOT NULL DEFAULT 'submitted',
  submitted_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
    ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_submission_per_student_task (task_id, student_id),
  KEY idx_submissions_student_status (student_id, status, submitted_at),
  KEY idx_submissions_task_status (task_id, status, submitted_at),
  CONSTRAINT fk_submission_task FOREIGN KEY (task_id) REFERENCES tasks (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_submission_student FOREIGN KEY (student_id) REFERENCES student_profiles (user_id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE submission_versions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  submission_id BIGINT UNSIGNED NOT NULL,
  version_number SMALLINT UNSIGNED NOT NULL,
  answer_text TEXT NULL,
  submitted_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_submission_version (submission_id, version_number),
  CONSTRAINT fk_submission_version_submission FOREIGN KEY (submission_id)
    REFERENCES submissions (id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE submission_attachments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  submission_version_id BIGINT UNSIGNED NOT NULL,
  storage_key VARCHAR(512) NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  mime_type VARCHAR(150) NOT NULL,
  file_size_bytes BIGINT UNSIGNED NOT NULL,
  checksum_sha256 CHAR(64) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_submission_attachments_version (submission_version_id),
  CONSTRAINT fk_submission_attachment_version FOREIGN KEY (submission_version_id)
    REFERENCES submission_versions (id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE grades (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  task_id BIGINT UNSIGNED NOT NULL,
  student_id BIGINT UNSIGNED NOT NULL,
  submission_id BIGINT UNSIGNED NULL,
  graded_by BIGINT UNSIGNED NOT NULL,
  score DECIMAL(7,2) NOT NULL,
  max_score DECIMAL(7,2) NOT NULL,
  feedback TEXT NULL,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  published_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
    ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_grade_per_task_student (task_id, student_id),
  KEY idx_grades_student_published (student_id, is_published, updated_at),
  KEY idx_grades_teacher (graded_by, updated_at),
  CONSTRAINT chk_grade_range CHECK (max_score > 0 AND score >= 0 AND score <= max_score),
  CONSTRAINT fk_grade_task FOREIGN KEY (task_id) REFERENCES tasks (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_grade_student FOREIGN KEY (student_id) REFERENCES student_profiles (user_id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_grade_submission FOREIGN KEY (submission_id) REFERENCES submissions (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_grade_teacher FOREIGN KEY (graded_by) REFERENCES teacher_profiles (user_id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE grade_change_history (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  grade_id BIGINT UNSIGNED NOT NULL,
  changed_by BIGINT UNSIGNED NOT NULL,
  old_score DECIMAL(7,2) NULL,
  new_score DECIMAL(7,2) NOT NULL,
  old_feedback TEXT NULL,
  new_feedback TEXT NULL,
  changed_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_grade_history_grade (grade_id, changed_at),
  CONSTRAINT fk_grade_history_grade FOREIGN KEY (grade_id) REFERENCES grades (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_grade_history_user FOREIGN KEY (changed_by) REFERENCES users (id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE announcements (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  author_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(180) NOT NULL,
  message TEXT NOT NULL,
  audience ENUM('school', 'selected_classes') NOT NULL,
  status ENUM('draft', 'published', 'withdrawn') NOT NULL DEFAULT 'draft',
  published_at DATETIME(3) NULL,
  event_starts_at DATETIME(3) NULL,
  event_ends_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
    ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_announcements_status_published (status, published_at),
  KEY idx_announcements_author (author_id, created_at),
  CONSTRAINT chk_announcement_title_not_blank CHECK (CHAR_LENGTH(TRIM(title)) > 0),
  CONSTRAINT chk_announcement_event_dates CHECK
    (event_ends_at IS NULL OR event_starts_at IS NULL OR event_ends_at >= event_starts_at),
  CONSTRAINT fk_announcement_author FOREIGN KEY (author_id) REFERENCES teacher_profiles (user_id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE announcement_classes (
  announcement_id BIGINT UNSIGNED NOT NULL,
  class_group_id BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (announcement_id, class_group_id),
  KEY idx_announcement_classes_group (class_group_id, announcement_id),
  CONSTRAINT fk_announcement_class_announcement FOREIGN KEY (announcement_id)
    REFERENCES announcements (id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_announcement_class_group FOREIGN KEY (class_group_id)
    REFERENCES class_groups (id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE calendar_events (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  created_by BIGINT UNSIGNED NOT NULL,
  announcement_id BIGINT UNSIGNED NULL,
  title VARCHAR(180) NOT NULL,
  details TEXT NULL,
  event_type ENUM('school', 'class', 'outing', 'schedule_change', 'other') NOT NULL DEFAULT 'other',
  starts_at DATETIME(3) NOT NULL,
  ends_at DATETIME(3) NULL,
  location VARCHAR(180) NULL,
  audience ENUM('school', 'selected_classes') NOT NULL,
  status ENUM('draft', 'published', 'withdrawn') NOT NULL DEFAULT 'draft',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_calendar_event_announcement (announcement_id),
  KEY idx_calendar_events_dates (status, starts_at, ends_at),
  CONSTRAINT chk_calendar_event_dates CHECK (ends_at IS NULL OR ends_at >= starts_at),
  CONSTRAINT fk_calendar_event_author FOREIGN KEY (created_by) REFERENCES teacher_profiles (user_id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_calendar_event_announcement FOREIGN KEY (announcement_id) REFERENCES announcements (id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE calendar_event_classes (
  event_id BIGINT UNSIGNED NOT NULL,
  class_group_id BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (event_id, class_group_id),
  KEY idx_calendar_event_classes_group (class_group_id, event_id),
  CONSTRAINT fk_calendar_event_class_event FOREIGN KEY (event_id) REFERENCES calendar_events (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_calendar_event_class_group FOREIGN KEY (class_group_id) REFERENCES class_groups (id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE notifications (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  notification_type ENUM('task', 'submission', 'grade', 'announcement', 'calendar_event') NOT NULL,
  title VARCHAR(180) NOT NULL,
  message VARCHAR(500) NOT NULL,
  related_type VARCHAR(40) NULL,
  related_id BIGINT UNSIGNED NULL,
  read_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_notifications_user_unread (user_id, read_at, created_at),
  CONSTRAINT fk_notification_user FOREIGN KEY (user_id) REFERENCES users (id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE audit_logs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  actor_id BIGINT UNSIGNED NOT NULL,
  action VARCHAR(80) NOT NULL,
  entity_type VARCHAR(60) NOT NULL,
  entity_id BIGINT UNSIGNED NOT NULL,
  old_values JSON NULL,
  new_values JSON NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_audit_entity (entity_type, entity_id, created_at),
  KEY idx_audit_actor (actor_id, created_at),
  CONSTRAINT fk_audit_actor FOREIGN KEY (actor_id) REFERENCES users (id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;
