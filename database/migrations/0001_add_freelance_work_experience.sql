-- Add Mohamed Aiman's current freelance role and close the Backpack Techworks role.
-- Safe to run more than once.

START TRANSACTION;

UPDATE work_experiences
SET end_date = '2026-08'
WHERE company = 'Backpack Techworks'
  AND role = 'Co-Founder';

SET @freelance_work_id = (
  SELECT id
  FROM work_experiences
  WHERE company = 'Myself'
    AND role = 'Full Stack Engineer'
    AND start_date = '2026-03'
  ORDER BY id ASC
  LIMIT 1
);

SET @freelance_work_missing = IF(@freelance_work_id IS NULL, 1, 0);

UPDATE work_experiences
SET display_order = display_order + 1
WHERE @freelance_work_missing = 1;

INSERT INTO work_experiences (
  company,
  role,
  start_date,
  end_date,
  logo,
  display_order
)
SELECT
  'Myself',
  'Full Stack Engineer',
  '2026-03',
  'present',
  'companies/freelance_ma_logo.webp',
  1
WHERE @freelance_work_missing = 1;

SET @freelance_work_id = IF(
  @freelance_work_missing = 1,
  LAST_INSERT_ID(),
  @freelance_work_id
);

UPDATE work_experiences
SET company = 'Myself',
    role = 'Full Stack Engineer',
    start_date = '2026-03',
    end_date = 'present',
    logo = 'companies/freelance_ma_logo.webp',
    display_order = 1
WHERE id = @freelance_work_id;

INSERT INTO work_experience_descriptions (
  work_experience_id,
  description,
  display_order
)
SELECT
  @freelance_work_id,
  'Specializing in Next.js, Express.js, EJS, MySQL, and Tailwind CSS. Experienced in building custom web applications, SaaS platforms, admin dashboards, POS systems, and business automation tools with clean, scalable, and responsive solutions.',
  1
WHERE NOT EXISTS (
  SELECT 1
  FROM work_experience_descriptions
  WHERE work_experience_id = @freelance_work_id
    AND description = 'Specializing in Next.js, Express.js, EJS, MySQL, and Tailwind CSS. Experienced in building custom web applications, SaaS platforms, admin dashboards, POS systems, and business automation tools with clean, scalable, and responsive solutions.'
);

COMMIT;
