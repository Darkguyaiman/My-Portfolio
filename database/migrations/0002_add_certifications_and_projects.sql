-- Portfolio additions verified on 14 November 2026.
-- Additive and safe to rerun; preserves existing projects and screenshots.

CREATE TABLE IF NOT EXISTS certifications (
  id INT UNSIGNED NOT NULL,
  name VARCHAR(255) NOT NULL,
  issuer VARCHAR(255) NOT NULL,
  issued CHAR(7) NOT NULL,
  credential_id VARCHAR(120) NULL,
  credential_url VARCHAR(500) NOT NULL,
  description TEXT NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

START TRANSACTION;

INSERT INTO projects (project_name, description, deployed_link, github_link, display_order)
SELECT 'NEEM Stack Setup', 'An interactive terminal assistant for setting up and managing a Node.js server stack on Windows, Linux, and macOS. Guides Nginx, PM2, MySQL, domains, HTTPS, and Cloudflare Tunnel setup, with verified database backups, encrypted process persistence, and Telegram recovery alerts.', NULL, 'https://github.com/Darkguyaiman/NEEM-Stack-Setup', COALESCE(MAX(display_order), 0) + 1 FROM projects
WHERE NOT EXISTS (SELECT 1 FROM projects WHERE project_name = 'NEEM Stack Setup')
HAVING COUNT(*) > 0 OR NOT EXISTS (SELECT 1 FROM projects WHERE project_name = 'NEEM Stack Setup');

SET @portfolio_project_id = (SELECT id FROM projects WHERE project_name = 'NEEM Stack Setup' LIMIT 1);

INSERT INTO project_technologies (project_id, technology, display_order)
SELECT @portfolio_project_id, 'PowerShell', 1
WHERE NOT EXISTS (SELECT 1 FROM project_technologies WHERE project_id = @portfolio_project_id AND technology = 'PowerShell');

INSERT INTO project_technologies (project_id, technology, display_order)
SELECT @portfolio_project_id, 'Bash', 2
WHERE NOT EXISTS (SELECT 1 FROM project_technologies WHERE project_id = @portfolio_project_id AND technology = 'Bash');

INSERT INTO project_technologies (project_id, technology, display_order)
SELECT @portfolio_project_id, 'JavaScript', 3
WHERE NOT EXISTS (SELECT 1 FROM project_technologies WHERE project_id = @portfolio_project_id AND technology = 'JavaScript');

INSERT INTO project_technologies (project_id, technology, display_order)
SELECT @portfolio_project_id, 'Node.js', 4
WHERE NOT EXISTS (SELECT 1 FROM project_technologies WHERE project_id = @portfolio_project_id AND technology = 'Node.js');

INSERT INTO project_technologies (project_id, technology, display_order)
SELECT @portfolio_project_id, 'Nginx', 5
WHERE NOT EXISTS (SELECT 1 FROM project_technologies WHERE project_id = @portfolio_project_id AND technology = 'Nginx');

INSERT INTO project_technologies (project_id, technology, display_order)
SELECT @portfolio_project_id, 'PM2', 6
WHERE NOT EXISTS (SELECT 1 FROM project_technologies WHERE project_id = @portfolio_project_id AND technology = 'PM2');

INSERT INTO project_technologies (project_id, technology, display_order)
SELECT @portfolio_project_id, 'MySQL', 7
WHERE NOT EXISTS (SELECT 1 FROM project_technologies WHERE project_id = @portfolio_project_id AND technology = 'MySQL');

INSERT INTO project_technologies (project_id, technology, display_order)
SELECT @portfolio_project_id, 'Cloudflare', 8
WHERE NOT EXISTS (SELECT 1 FROM project_technologies WHERE project_id = @portfolio_project_id AND technology = 'Cloudflare');

INSERT INTO project_technologies (project_id, technology, display_order)
SELECT @portfolio_project_id, 'SQLite', 9
WHERE NOT EXISTS (SELECT 1 FROM project_technologies WHERE project_id = @portfolio_project_id AND technology = 'SQLite');


INSERT INTO projects (project_name, description, deployed_link, github_link, display_order)
SELECT 'WhatsAppSharp', 'A responsive C# messaging application with direct and group chats, voice notes, shared media, communities, status updates, and voice/video calls. Built with ASP.NET Core, Razor Pages, SignalR, MySQL, and WebRTC, with an installable PWA. Demo only, available for testing; Google sign-in is required.', 'https://whatsappsharp.darkguyaiman.com/Chat', 'https://github.com/Darkguyaiman/WhatsAppSharp', COALESCE(MAX(display_order), 0) + 1 FROM projects
WHERE NOT EXISTS (SELECT 1 FROM projects WHERE project_name = 'WhatsAppSharp')
HAVING COUNT(*) > 0 OR NOT EXISTS (SELECT 1 FROM projects WHERE project_name = 'WhatsAppSharp');

SET @portfolio_project_id = (SELECT id FROM projects WHERE project_name = 'WhatsAppSharp' LIMIT 1);

INSERT INTO project_technologies (project_id, technology, display_order)
SELECT @portfolio_project_id, 'C#', 1
WHERE NOT EXISTS (SELECT 1 FROM project_technologies WHERE project_id = @portfolio_project_id AND technology = 'C#');

INSERT INTO project_technologies (project_id, technology, display_order)
SELECT @portfolio_project_id, 'ASP.NET Core', 2
WHERE NOT EXISTS (SELECT 1 FROM project_technologies WHERE project_id = @portfolio_project_id AND technology = 'ASP.NET Core');

INSERT INTO project_technologies (project_id, technology, display_order)
SELECT @portfolio_project_id, 'Razor Pages', 3
WHERE NOT EXISTS (SELECT 1 FROM project_technologies WHERE project_id = @portfolio_project_id AND technology = 'Razor Pages');

INSERT INTO project_technologies (project_id, technology, display_order)
SELECT @portfolio_project_id, 'SignalR', 4
WHERE NOT EXISTS (SELECT 1 FROM project_technologies WHERE project_id = @portfolio_project_id AND technology = 'SignalR');

INSERT INTO project_technologies (project_id, technology, display_order)
SELECT @portfolio_project_id, 'Entity Framework Core', 5
WHERE NOT EXISTS (SELECT 1 FROM project_technologies WHERE project_id = @portfolio_project_id AND technology = 'Entity Framework Core');

INSERT INTO project_technologies (project_id, technology, display_order)
SELECT @portfolio_project_id, 'MySQL', 6
WHERE NOT EXISTS (SELECT 1 FROM project_technologies WHERE project_id = @portfolio_project_id AND technology = 'MySQL');

INSERT INTO project_technologies (project_id, technology, display_order)
SELECT @portfolio_project_id, 'WebRTC', 7
WHERE NOT EXISTS (SELECT 1 FROM project_technologies WHERE project_id = @portfolio_project_id AND technology = 'WebRTC');

INSERT INTO project_technologies (project_id, technology, display_order)
SELECT @portfolio_project_id, 'JavaScript', 8
WHERE NOT EXISTS (SELECT 1 FROM project_technologies WHERE project_id = @portfolio_project_id AND technology = 'JavaScript');

INSERT INTO project_technologies (project_id, technology, display_order)
SELECT @portfolio_project_id, 'PWA', 9
WHERE NOT EXISTS (SELECT 1 FROM project_technologies WHERE project_id = @portfolio_project_id AND technology = 'PWA');


INSERT INTO projects (project_name, description, deployed_link, github_link, display_order)
SELECT 'MUST T-Shirt Design Viewer', 'An interactive 3D showcase for the MUST T-Shirt Design Competition. Explore male and female shirt fits, switch between front and back views, rotate and zoom the models, toggle fabric motion, and download renders and Blender source files.', 'https://must-tshirt.darkguyaiman.com/', NULL, COALESCE(MAX(display_order), 0) + 1 FROM projects
WHERE NOT EXISTS (SELECT 1 FROM projects WHERE project_name = 'MUST T-Shirt Design Viewer')
HAVING COUNT(*) > 0 OR NOT EXISTS (SELECT 1 FROM projects WHERE project_name = 'MUST T-Shirt Design Viewer');

SET @portfolio_project_id = (SELECT id FROM projects WHERE project_name = 'MUST T-Shirt Design Viewer' LIMIT 1);

INSERT INTO project_technologies (project_id, technology, display_order)
SELECT @portfolio_project_id, 'HTML', 1
WHERE NOT EXISTS (SELECT 1 FROM project_technologies WHERE project_id = @portfolio_project_id AND technology = 'HTML');

INSERT INTO project_technologies (project_id, technology, display_order)
SELECT @portfolio_project_id, 'CSS', 2
WHERE NOT EXISTS (SELECT 1 FROM project_technologies WHERE project_id = @portfolio_project_id AND technology = 'CSS');

INSERT INTO project_technologies (project_id, technology, display_order)
SELECT @portfolio_project_id, 'JavaScript', 3
WHERE NOT EXISTS (SELECT 1 FROM project_technologies WHERE project_id = @portfolio_project_id AND technology = 'JavaScript');

INSERT INTO project_technologies (project_id, technology, display_order)
SELECT @portfolio_project_id, 'Three.js', 4
WHERE NOT EXISTS (SELECT 1 FROM project_technologies WHERE project_id = @portfolio_project_id AND technology = 'Three.js');

INSERT INTO project_technologies (project_id, technology, display_order)
SELECT @portfolio_project_id, 'Vite', 5
WHERE NOT EXISTS (SELECT 1 FROM project_technologies WHERE project_id = @portfolio_project_id AND technology = 'Vite');

INSERT INTO project_technologies (project_id, technology, display_order)
SELECT @portfolio_project_id, 'Express.js', 6
WHERE NOT EXISTS (SELECT 1 FROM project_technologies WHERE project_id = @portfolio_project_id AND technology = 'Express.js');

INSERT INTO project_technologies (project_id, technology, display_order)
SELECT @portfolio_project_id, 'Node.js', 7
WHERE NOT EXISTS (SELECT 1 FROM project_technologies WHERE project_id = @portfolio_project_id AND technology = 'Node.js');

INSERT INTO project_technologies (project_id, technology, display_order)
SELECT @portfolio_project_id, 'Blender', 8
WHERE NOT EXISTS (SELECT 1 FROM project_technologies WHERE project_id = @portfolio_project_id AND technology = 'Blender');


INSERT INTO projects (project_name, description, deployed_link, github_link, display_order)
SELECT 'Tuition Management System', 'A multi-branch tuition management platform for management, staff, teachers, students, and parents. Brings together scheduling, enrolments, attendance, invoices, payments, recurring billing, tutor payroll, reports, and real-time notifications. Demo only, available for testing. Email: admin@admin.com, Password: 1234567890', 'https://tms.darkguyaiman.com/login', NULL, COALESCE(MAX(display_order), 0) + 1 FROM projects
WHERE NOT EXISTS (SELECT 1 FROM projects WHERE project_name = 'Tuition Management System')
HAVING COUNT(*) > 0 OR NOT EXISTS (SELECT 1 FROM projects WHERE project_name = 'Tuition Management System');

SET @portfolio_project_id = (SELECT id FROM projects WHERE project_name = 'Tuition Management System' LIMIT 1);

INSERT INTO project_technologies (project_id, technology, display_order)
SELECT @portfolio_project_id, 'Next.js', 1
WHERE NOT EXISTS (SELECT 1 FROM project_technologies WHERE project_id = @portfolio_project_id AND technology = 'Next.js');

INSERT INTO project_technologies (project_id, technology, display_order)
SELECT @portfolio_project_id, 'React', 2
WHERE NOT EXISTS (SELECT 1 FROM project_technologies WHERE project_id = @portfolio_project_id AND technology = 'React');

INSERT INTO project_technologies (project_id, technology, display_order)
SELECT @portfolio_project_id, 'TypeScript', 3
WHERE NOT EXISTS (SELECT 1 FROM project_technologies WHERE project_id = @portfolio_project_id AND technology = 'TypeScript');

INSERT INTO project_technologies (project_id, technology, display_order)
SELECT @portfolio_project_id, 'Node.js', 4
WHERE NOT EXISTS (SELECT 1 FROM project_technologies WHERE project_id = @portfolio_project_id AND technology = 'Node.js');

INSERT INTO project_technologies (project_id, technology, display_order)
SELECT @portfolio_project_id, 'MySQL', 5
WHERE NOT EXISTS (SELECT 1 FROM project_technologies WHERE project_id = @portfolio_project_id AND technology = 'MySQL');

INSERT INTO project_technologies (project_id, technology, display_order)
SELECT @portfolio_project_id, 'Tailwind CSS', 6
WHERE NOT EXISTS (SELECT 1 FROM project_technologies WHERE project_id = @portfolio_project_id AND technology = 'Tailwind CSS');

INSERT INTO project_technologies (project_id, technology, display_order)
SELECT @portfolio_project_id, 'Socket.IO', 7
WHERE NOT EXISTS (SELECT 1 FROM project_technologies WHERE project_id = @portfolio_project_id AND technology = 'Socket.IO');

INSERT INTO project_technologies (project_id, technology, display_order)
SELECT @portfolio_project_id, 'PWA', 8
WHERE NOT EXISTS (SELECT 1 FROM project_technologies WHERE project_id = @portfolio_project_id AND technology = 'PWA');


INSERT INTO certifications (id, name, issuer, issued, credential_id, credential_url, description) VALUES
  (1660981169, 'Web Development Solo Learn', 'Sololearn', '2025-12', 'CC-7CHH4EAW', 'https://www.sololearn.com/certificates/CC-7CHH4EAW', ''),
  (708238174, 'Fundamentals of Stock Exchange Course', 'Bursa Malaysia', '2025-10', NULL, 'https://www.linkedin.com/in/darkguyaiman/overlay/Certifications/708238174/treasury/?profileId=ACoAADL8FxoB0BryvGPbk292fzh7IhOehVpaNzg', ''),
  (708095835, 'Certificate of Excellence Top Scorer May June 2024', 'International Modern Arabic School (IMAS)', '2024-08', NULL, 'https://www.linkedin.com/in/darkguyaiman/overlay/Certifications/708095835/treasury/?profileId=ACoAADL8FxoB0BryvGPbk292fzh7IhOehVpaNzg', ''),
  (707340432, 'Micro-Credential in Python Programming', 'Malaysia University of Science and Technology', '2023-06', NULL, 'https://www.linkedin.com/in/darkguyaiman/overlay/Certifications/707340432/treasury/?profileId=ACoAADL8FxoB0BryvGPbk292fzh7IhOehVpaNzg', ''),
  (707641520, 'Certificate of Achievement – Public Speaking Competition 2023', 'International Modern Arabic School (IMAS)', '2023-05', NULL, 'https://www.linkedin.com/in/darkguyaiman/overlay/Certifications/707641520/treasury/?profileId=ACoAADL8FxoB0BryvGPbk292fzh7IhOehVpaNzg', 'Awarded 2nd place in a public speaking competition representing my institution.'),
  (707021642, 'Royal Commonwealth Essay Competition 2023', 'Royal Commonwealth Society', '2023-01', NULL, 'https://www.linkedin.com/in/darkguyaiman/overlay/Certifications/707021642/treasury/?profileId=ACoAADL8FxoB0BryvGPbk292fzh7IhOehVpaNzg', ''),
  (707182088, 'Leadership Training for Muslim Youth', 'International Institute of Islamic Thought', '2022-10', NULL, 'https://www.linkedin.com/in/darkguyaiman/overlay/Certifications/707182088/treasury/?profileId=ACoAADL8FxoB0BryvGPbk292fzh7IhOehVpaNzg', 'Participated in leadership development focused on communication, teamwork, and Islamic leadership principles.'),
  (707446038, 'Full Attendance Certificate – SMK Sultan Abdul Samad', 'SMK Sultan Abdul Samad', '2021-11', NULL, 'https://www.linkedin.com/in/darkguyaiman/overlay/Certifications/707446038/treasury/?profileId=ACoAADL8FxoB0BryvGPbk292fzh7IhOehVpaNzg', 'Recognised for maintaining full attendance throughout the academic year.'),
  (1482700685, '8th Grade Taekwondo (GUP) Certificate', 'Taekwondo Malaysia (WTF)', '2019-10', '077566 (Serial No.)', 'https://www.linkedin.com/in/darkguyaiman/overlay/Certifications/1482700685/treasury/?profileId=ACoAADL8FxoB0BryvGPbk292fzh7IhOehVpaNzg', 'Achieved 8th Grade after the examination on 30 October 2019.'),
  (1483169554, 'Kangaroo Math Competition (KMC) 2019', 'Kangaroo Math Malaysia', '2019-03', NULL, 'https://www.linkedin.com/in/darkguyaiman/overlay/Certifications/1483169554/treasury/?profileId=ACoAADL8FxoB0BryvGPbk292fzh7IhOehVpaNzg', 'Certificate of Participation in the Benjamin category, representing SK Sri Petaling on 14 March 2019.')
ON DUPLICATE KEY UPDATE credential_url = VALUES(credential_url);

COMMIT;
