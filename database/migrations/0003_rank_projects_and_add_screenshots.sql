-- Showcase the strongest full-stack systems and infrastructure work first.
-- Add genuine project screenshots without removing existing images.
-- Safe to rerun.

START TRANSACTION;

UPDATE projects
SET display_order = CASE project_name
  WHEN 'Tuition Management System' THEN 1
  WHEN 'WhatsAppSharp' THEN 2
  WHEN 'NEEM Stack Setup' THEN 3
  WHEN 'Al-Osmani-Pharmacy-ERP-system' THEN 4
  WHEN 'Logistics and Fulfilment Client Analytics Dashboard' THEN 5
  WHEN 'Tuitix Tuition Management System' THEN 6
  WHEN 'Rosterly Time Management System' THEN 7
  WHEN 'MUST T-Shirt Design Viewer' THEN 8
  WHEN 'Resonance Website' THEN 9
  WHEN 'Pain.com.my' THEN 10
  WHEN 'Backpack-Website' THEN 11
  WHEN 'Multimedia-Management-System' THEN 12
  WHEN 'Credit-System' THEN 13
  WHEN 'LMS-Starter-Kit' THEN 14
  WHEN 'Staf-Claim-System' THEN 15
  WHEN 'Roster-System' THEN 16
  WHEN 'Consent-Forms' THEN 17
  WHEN 'Modular-Student-Utility-System-MSUS' THEN 18
  WHEN 'Library-Book-Borrowing-System' THEN 19
  WHEN 'Football-Fixtures-Database-Project' THEN 20
  WHEN 'LexiLogos-Clone' THEN 21
  WHEN 'DDOS-easy' THEN 22
  ELSE display_order
END
WHERE project_name IN (
  'Tuition Management System',
  'WhatsAppSharp',
  'NEEM Stack Setup',
  'Al-Osmani-Pharmacy-ERP-system',
  'Logistics and Fulfilment Client Analytics Dashboard',
  'Tuitix Tuition Management System',
  'Rosterly Time Management System',
  'MUST T-Shirt Design Viewer',
  'Resonance Website',
  'Pain.com.my',
  'Backpack-Website',
  'Multimedia-Management-System',
  'Credit-System',
  'LMS-Starter-Kit',
  'Staf-Claim-System',
  'Roster-System',
  'Consent-Forms',
  'Modular-Student-Utility-System-MSUS',
  'Library-Book-Borrowing-System',
  'Football-Fixtures-Database-Project',
  'LexiLogos-Clone',
  'DDOS-easy'
);

INSERT INTO project_images (project_id, image_path, display_order)
SELECT p.id, 'projects/tuition-management-overview.webp', 1 FROM projects p
WHERE p.project_name = 'Tuition Management System'
  AND NOT EXISTS (SELECT 1 FROM project_images i WHERE i.project_id = p.id AND i.image_path = 'projects/tuition-management-overview.webp');

INSERT INTO project_images (project_id, image_path, display_order)
SELECT p.id, 'projects/tuition-management-schedule.webp', 2 FROM projects p
WHERE p.project_name = 'Tuition Management System'
  AND NOT EXISTS (SELECT 1 FROM project_images i WHERE i.project_id = p.id AND i.image_path = 'projects/tuition-management-schedule.webp');

INSERT INTO project_images (project_id, image_path, display_order)
SELECT p.id, 'projects/whatsappsharp-login.webp', 1 FROM projects p
WHERE p.project_name = 'WhatsAppSharp'
  AND NOT EXISTS (SELECT 1 FROM project_images i WHERE i.project_id = p.id AND i.image_path = 'projects/whatsappsharp-login.webp');

INSERT INTO project_images (project_id, image_path, display_order)
SELECT p.id, 'projects/neem-persistent-processes.webp', 1 FROM projects p
WHERE p.project_name = 'NEEM Stack Setup'
  AND NOT EXISTS (SELECT 1 FROM project_images i WHERE i.project_id = p.id AND i.image_path = 'projects/neem-persistent-processes.webp');

INSERT INTO project_images (project_id, image_path, display_order)
SELECT p.id, 'projects/neem-telegram-alerts.webp', 2 FROM projects p
WHERE p.project_name = 'NEEM Stack Setup'
  AND NOT EXISTS (SELECT 1 FROM project_images i WHERE i.project_id = p.id AND i.image_path = 'projects/neem-telegram-alerts.webp');

INSERT INTO project_images (project_id, image_path, display_order)
SELECT p.id, 'projects/neem-boot-service.webp', 3 FROM projects p
WHERE p.project_name = 'NEEM Stack Setup'
  AND NOT EXISTS (SELECT 1 FROM project_images i WHERE i.project_id = p.id AND i.image_path = 'projects/neem-boot-service.webp');

INSERT INTO project_images (project_id, image_path, display_order)
SELECT p.id, 'projects/must-tshirt-front.webp', 1 FROM projects p
WHERE p.project_name = 'MUST T-Shirt Design Viewer'
  AND NOT EXISTS (SELECT 1 FROM project_images i WHERE i.project_id = p.id AND i.image_path = 'projects/must-tshirt-front.webp');

INSERT INTO project_images (project_id, image_path, display_order)
SELECT p.id, 'projects/must-tshirt-back.webp', 2 FROM projects p
WHERE p.project_name = 'MUST T-Shirt Design Viewer'
  AND NOT EXISTS (SELECT 1 FROM project_images i WHERE i.project_id = p.id AND i.image_path = 'projects/must-tshirt-back.webp');

COMMIT;
