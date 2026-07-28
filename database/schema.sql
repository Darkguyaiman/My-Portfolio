-- MySQL schema and seed data for darkguyaiman-com.

SET NAMES utf8mb4;
CREATE DATABASE IF NOT EXISTS `darkguyaiman-com` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `darkguyaiman-com`;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS work_experience_descriptions;
DROP TABLE IF EXISTS work_experiences;
DROP TABLE IF EXISTS education;
DROP TABLE IF EXISTS languages;
DROP TABLE IF EXISTS project_images;
DROP TABLE IF EXISTS project_technologies;
DROP TABLE IF EXISTS projects;
DROP TABLE IF EXISTS site_content;

CREATE TABLE projects (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  project_name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  deployed_link VARCHAR(500) NULL,
  github_link VARCHAR(500) NULL,
  display_order INT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_projects_project_name (project_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE project_technologies (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  project_id INT UNSIGNED NOT NULL,
  technology VARCHAR(120) NOT NULL,
  display_order INT UNSIGNED NOT NULL,
  PRIMARY KEY (id),
  KEY idx_project_technologies_project_id (project_id),
  CONSTRAINT fk_project_technologies_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE project_images (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  project_id INT UNSIGNED NOT NULL,
  image_path VARCHAR(500) NOT NULL,
  display_order INT UNSIGNED NOT NULL,
  PRIMARY KEY (id),
  KEY idx_project_images_project_id (project_id),
  CONSTRAINT fk_project_images_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE languages (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  level VARCHAR(120) NOT NULL,
  display_order INT UNSIGNED NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_languages_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE education (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  qualification VARCHAR(255) NOT NULL,
  institution VARCHAR(255) NOT NULL,
  field VARCHAR(255) NOT NULL,
  duration_start VARCHAR(80) NOT NULL,
  duration_end VARCHAR(80) NOT NULL,
  results JSON NULL,
  description TEXT NOT NULL,
  display_order INT UNSIGNED NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE work_experiences (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  company VARCHAR(255) NOT NULL,
  role VARCHAR(255) NOT NULL,
  start_date CHAR(7) NOT NULL,
  end_date VARCHAR(20) NOT NULL,
  logo VARCHAR(500) NULL,
  display_order INT UNSIGNED NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE work_experience_descriptions (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  work_experience_id INT UNSIGNED NOT NULL,
  description TEXT NOT NULL,
  display_order INT UNSIGNED NOT NULL,
  PRIMARY KEY (id),
  KEY idx_work_descriptions_work_experience_id (work_experience_id),
  CONSTRAINT fk_work_descriptions_work_experience FOREIGN KEY (work_experience_id) REFERENCES work_experiences(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE site_content (
  content_key VARCHAR(120) NOT NULL,
  content_value TEXT NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (content_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

INSERT INTO projects (id, project_name, description, deployed_link, github_link, display_order) VALUES
  (1, 'Tuitix Tuition Management System', 'Tuitix is a tuition management system built with Next.js, using a combination of server-side rendering (SSR) and client-side rendering (CSR) to deliver dynamic pages and interactive user interfaces. Email: admin@admin.com, Password: 1234567890', 'https://tuitix.backpack2u.com', NULL, 1),
  (2, 'Resonance Website', 'A website for the company Resonance, developed as a server-rendered web application with dynamic content, structured routing, and interactive user interfaces, integrating backend logic and database-driven features for efficient data handling and a responsive user experience. Email: admin@admin.com, Password: 1234567890', 'https://resonance2u.com', NULL, 2),
  (3, 'Rosterly Time Management System', 'Rosterly is a time management system developed as a server-rendered web application with dynamic scheduling, organized workflows, and interactive user interfaces, integrating backend logic and database-driven features to ensure efficient time tracking and a responsive experience. Email: admin@admin.com, Password: 1234567890', 'https://rosterly.backpack2u.com', NULL, 3),
  (4, 'Pain.com.my', 'A website for Pain.com.my, developed as a server-rendered web application with dynamic content, structured routing, and interactive user interfaces, integrating backend logic and database-driven features to deliver efficient data handling and a responsive user experience. Email: admin@admin.com, Password: 1234567890', 'https://pain.com.my', NULL, 4),
  (5, 'Backpack-Website', 'The official Backpack Tech Work website, built as a server-rendered web application with dynamic pages and interactive user interfaces.', 'https://backpack2u.com', NULL, 5),
  (6, 'Al-Osmani-Pharmacy-ERP-system', 'A full-featured pharmacy ERP system built for multi-branch operations with integrated e-commerce, inventory tracking, POS, order management, role-based access control, and sales reporting.', NULL, NULL, 6),
  (7, 'Logistics and Fulfilment Client Analytics Dashboard', 'A comprehensive logistics and fulfilment client management application built with Node.js, Express, EJS, and MySQL, designed to track client activity, operational data, and performance metrics through an analytics-driven dashboard.', NULL, NULL, 7),
  (8, 'Multimedia-Management-System', 'A multimedia file management system that integrates with Google Drive and Google Sheets, allowing users to organize, search, and add remarks to files through a responsive web interface.', NULL, 'https://github.com/BackpackTechWork/Multimedia-Management-System', 8),
  (9, 'Credit-System', 'A web-based credit management system for tracking medical device credits, built using Google Apps Script and Google Sheets.', NULL, 'https://github.com/Darkguyaiman/Credit-System', 9),
  (10, 'Staf-Claim-System', 'A staff claim and expense management system that simplifies claim submissions and tracking.', NULL, 'https://github.com/Darkguyaiman/Staf-Claim-System_PR', 10),
  (11, 'Roster-System', 'A staff roster management web application that simplifies scheduling and shift organization.', NULL, 'https://github.com/Darkguyaiman/Roster-System-PR', 11),
  (12, 'Consent-Forms', 'A digital consent form system for collecting and managing user acknowledgements.', NULL, 'https://github.com/Darkguyaiman/Consent-Forms', 12),
  (13, 'LMS-Starter-Kit', 'A learning management system starter kit intended as a foundation for training and education platforms.', NULL, 'https://github.com/Darkguyaiman/LMS-Starter-Kit', 13),
  (14, 'LexiLogos-Clone', 'A near-identical clone of the LexiLogos Arabic keyboard, created for Quran class usage and learning purposes.', NULL, 'https://github.com/Darkguyaiman/LexiLogos-Clone', 14),
  (15, 'Football-Fixtures-Database-Project', 'A database project developed for academic purposes, focused on managing football fixtures and related data.', NULL, 'https://github.com/Darkguyaiman/Football-Fixtures-Database-Project', 15),
  (16, 'Library-Book-Borrowing-System', 'A comprehensive command-line application for managing library books and their borrowing status, enabling librarians to handle inventory, member borrowing, and return processes efficiently.', NULL, 'https://github.com/Darkguyaiman/Library-Book-Borrowing-System', 16),
  (17, 'Modular-Student-Utility-System-MSUS', 'A modular Python application designed to manage student data and utilities for academic environments.', NULL, 'https://github.com/Darkguyaiman/Modular-Student-Utility-System-MSUS-', 17),
  (18, 'DDOS-easy', 'A Python-based script created for educational and authorized network stress testing purposes.', NULL, 'https://github.com/Darkguyaiman/DDOS-easy', 18);

INSERT INTO project_technologies (project_id, technology, display_order) VALUES
  (1, 'Next.js', 1),
  (1, 'React', 2),
  (1, 'TypeScript', 3),
  (1, 'Node.js', 4),
  (1, 'MySQL', 5),
  (1, 'Tailwind CSS', 6),
  (2, 'EJS', 1),
  (2, 'Node.js', 2),
  (2, 'MySQL', 3),
  (2, 'CSS', 4),
  (2, 'JavaScript', 5),
  (2, 'HTML', 6),
  (2, 'Express.js', 7),
  (3, 'EJS', 1),
  (3, 'Node.js', 2),
  (3, 'MySQL', 3),
  (3, 'CSS', 4),
  (3, 'JavaScript', 5),
  (3, 'HTML', 6),
  (3, 'CSS', 7),
  (3, 'Express.js', 8),
  (4, 'Node.js', 1),
  (4, 'Express.js', 2),
  (4, 'EJS', 3),
  (4, 'Tailwind CSS', 4),
  (4, 'HTML', 5),
  (4, 'CSS', 6),
  (4, 'JavaScript', 7),
  (4, 'MySQL', 8),
  (5, 'Node.js', 1),
  (5, 'Express.js', 2),
  (5, 'EJS', 3),
  (5, 'jQuery', 4),
  (5, 'HTML', 5),
  (5, 'CSS', 6),
  (5, 'JavaScript', 7),
  (6, 'Node.js', 1),
  (6, 'Express.js', 2),
  (6, 'MySQL', 3),
  (6, 'EJS', 4),
  (6, 'JavaScript', 5),
  (6, 'CSS', 6),
  (6, 'HTML', 7),
  (7, 'Node.js', 1),
  (7, 'Express.js', 2),
  (7, 'EJS', 3),
  (7, 'MySQL', 4),
  (7, 'JavaScript', 5),
  (7, 'HTML', 6),
  (7, 'CSS', 7),
  (7, 'Google Sheets API', 8),
  (8, 'Google Apps Script', 1),
  (8, 'Google Drive API', 2),
  (8, 'Google Sheets API', 3),
  (8, 'HTML', 4),
  (8, 'CSS', 5),
  (8, 'JavaScript', 6),
  (9, 'Google Apps Script', 1),
  (9, 'JavaScript', 2),
  (9, 'HTML', 3),
  (9, 'CSS', 4),
  (9, 'Google Sheets', 5),
  (10, 'Google Apps Script', 1),
  (10, 'JavaScript', 2),
  (10, 'HTML', 3),
  (10, 'CSS', 4),
  (10, 'Google Sheets', 5),
  (10, 'Tailwind CSS', 6),
  (10, 'Gmail API', 7),
  (11, 'Google Apps Script', 1),
  (11, 'JavaScript', 2),
  (11, 'HTML', 3),
  (11, 'CSS', 4),
  (11, 'Google Sheets', 5),
  (11, 'Bootstrap', 6),
  (11, 'jQuery', 7),
  (12, 'HTML', 1),
  (12, 'CSS', 2),
  (12, 'JavaScript', 3),
  (12, 'Google Apps Script', 4),
  (12, 'Google Sheets', 5),
  (12, 'Gmail API', 6),
  (13, 'Google Apps Script', 1),
  (13, 'JavaScript', 2),
  (13, 'HTML', 3),
  (13, 'CSS', 4),
  (13, 'Google Sheets', 5),
  (13, 'Tailwind CSS', 6),
  (13, 'Gmail API', 7),
  (14, 'HTML', 1),
  (14, 'CSS', 2),
  (14, 'JavaScript', 3),
  (15, 'MySQL', 1),
  (16, 'Python', 1),
  (17, 'Python', 1),
  (18, 'Python', 1);

INSERT INTO project_images (project_id, image_path, display_order) VALUES
  (1, 'projects/Tuitix 1.webp', 1),
  (1, 'projects/Tuitix 2.webp', 2),
  (1, 'projects/Tuitix 3.webp', 3),
  (1, 'projects/Tuitix 4.webp', 4),
  (2, 'projects/Resonance 1.webp', 1),
  (2, 'projects/Resonance 2.webp', 2),
  (2, 'projects/Resonance 3.webp', 3),
  (2, 'projects/Resonance 4.webp', 4),
  (2, 'projects/Resonance 5.webp', 5),
  (3, 'projects/Rosterly 1.webp', 1),
  (3, 'projects/Rosterly 2.webp', 2),
  (3, 'projects/Rosterly 3.webp', 3),
  (3, 'projects/Rosterly 4.webp', 4),
  (4, 'projects/Pain-Com-My-1.webp', 1),
  (4, 'projects/Pain-Com-My-2.webp', 2),
  (4, 'projects/Pain-Com-My-3.webp', 3),
  (4, 'projects/Pain-Com-My-4.webp', 4),
  (5, 'projects/Backpack Website 1.webp', 1),
  (5, 'projects/Backpack Website 2.webp', 2),
  (5, 'projects/Backpack Website 3.webp', 3),
  (5, 'projects/Backpack Website 4.webp', 4),
  (5, 'projects/Backpack Website 5.webp', 5),
  (6, 'projects/Al-Osmani Pharmacy 1.webp', 1),
  (6, 'projects/Al-Osmani Pharmacy 2.webp', 2),
  (6, 'projects/Al-Osmani Pharmacy 3.webp', 3),
  (6, 'projects/Al-Osmani Pharmacy 4.webp', 4),
  (6, 'projects/Al-Osmani Pharmacy 5.webp', 5),
  (6, 'projects/Al-Osmani Pharmacy 6.webp', 6),
  (6, 'projects/Al-Osmani Pharmacy 7.webp', 7),
  (6, 'projects/Al-Osmani Pharmacy 8.webp', 8),
  (6, 'projects/Al-Osmani Pharmacy 9.webp', 9),
  (7, 'projects/Logistics and Fulfilment Client Analytics Dashboard 1.webp', 1),
  (7, 'projects/Logistics and Fulfilment Client Analytics Dashboard 2.webp', 2),
  (7, 'projects/Logistics and Fulfilment Client Analytics Dashboard 3.webp', 3),
  (7, 'projects/Logistics and Fulfilment Client Analytics Dashboard 4.webp', 4),
  (7, 'projects/Logistics and Fulfilment Client Analytics Dashboard 5.webp', 5),
  (7, 'projects/Logistics and Fulfilment Client Analytics Dashboard 6.webp', 6),
  (8, 'projects/Multimedia Management System 1.webp', 1),
  (8, 'projects/Multimedia Management System 2.webp', 2),
  (8, 'projects/Multimedia Management System 3.webp', 3),
  (9, 'projects/Credit System 1.webp', 1),
  (9, 'projects/Credit System 2.webp', 2),
  (9, 'projects/Credit System 3.webp', 3),
  (9, 'projects/Credit System 4.webp', 4),
  (9, 'projects/Credit System 5.webp', 5),
  (10, 'projects/Claim System 1.webp', 1),
  (10, 'projects/Claim System 2.webp', 2),
  (10, 'projects/Claim System 3.webp', 3),
  (10, 'projects/Claim System 4.webp', 4),
  (10, 'projects/Claim System 5.webp', 5),
  (11, 'projects/Rooster System 1.webp', 1),
  (11, 'projects/Rooster System 2.webp', 2),
  (11, 'projects/Rooster System 3.webp', 3),
  (12, 'projects/Consent Form 1.webp', 1),
  (12, 'projects/Consent Form 2.webp', 2),
  (12, 'projects/Consent Form 3.webp', 3),
  (12, 'projects/Consent Form 4.webp', 4),
  (12, 'projects/Consent Form 5.webp', 5),
  (12, 'projects/Consent Form 6.webp', 6),
  (14, 'projects/Lexilogos.webp', 1);

INSERT INTO languages (id, name, level, display_order) VALUES
  (1, 'English', 'Advanced', 1),
  (2, 'Malay', 'Advanced', 2),
  (3, 'Burmese', 'Intermediate', 3);

INSERT INTO education (id, qualification, institution, field, duration_start, duration_end, results, description, display_order) VALUES
  (1, 'Diploma of Information Technology', 'Malaysia University of Science and Technology', 'Information Technology', 'December 2024', 'July 2027', '{"semester":4,"gpa":4}', 'The Diploma in Information Technology programme equips students with technologies and skills essential for the Digital Economy. It exposes students to information systems, computer programming, database systems, web and mobile applications, software development, data mining, cybersecurity, IoT, drone technology, computer networks, and communication technologies.', 1),
  (2, 'IGCSE O Level', 'International Modern Arabic School', 'High School / Secondary Education', 'September 2021', 'June 2024', '{"total_subjects":7,"grades":{"A*":4,"A":3}}', 'Completed lower education at IMAS, gaining strong academic foundations, meaningful friendships, and a clear understanding that personal ability and action matter more than external perceptions.', 2);

INSERT INTO work_experiences (id, company, role, start_date, end_date, logo, display_order) VALUES
  (1, 'Backpack Techworks', 'Co-Founder', '2025-01', 'present', 'companies/Backpack.webp', 1),
  (2, 'Fussional', 'Team Leader', '2024-05', '2025-09', 'companies/Fussional.webp', 2),
  (3, 'Working for myself', 'Freelancer', '2021-01', '2024-12', 'assets/2D Mohamed Leaning.webp', 3);

INSERT INTO work_experience_descriptions (work_experience_id, description, display_order) VALUES
  (1, 'Developed custom systems in Google App Script as well as web apps in Node.js', 1),
  (1, 'Set up the company''s initial websites in Canva using design skills', 2),
  (1, 'Developed the simple website to the current website on backpack2u.com', 3),
  (1, 'Representing the company as its spokesperson', 4),
  (2, 'Focused on guiding the team toward our goals, ensuring everyone has what they need to succeed', 1),
  (2, 'Kept things on track and created an environment for collaboration', 2),
  (2, 'Solved problems and delivered great results together', 3),
  (3, 'Worked independently on a range of personal and client-based projects while continuously learning and improving my development skills.', 1),
  (3, 'Built server-side applications using Google Apps Script, focusing on automation, data processing, and creating custom web apps.', 2),
  (3, 'Developed and managed solutions using Google Sheets, including advanced formulas, data handling, and workflow automation.', 3),
  (3, 'Created simple and responsive websites using HTML, CSS, and JavaScript, focusing on clean design and usability.', 4),
  (3, 'Explored different tools and technologies to improve performance, scalability, and overall project structure.', 5);

INSERT INTO site_content (content_key, content_value) VALUES
  ('heroTitlePrefix', 'Hellow, I''m'),
  ('heroName', 'Mohamed Aiman'),
  ('heroSubtitle', '<span class="age" id="age">17</span> yo web developer in <span class="location">Malaysia</span>, from <span class="location">Myanmar</span> & <span class="location">Sudan</span> <span class="blasian-note">(yes, that makes me blasian)</span>'),
  ('heroDescription', 'I specialise in server-side development, that makes me more of a backend developer however I am proficient on the frontend as well such as making responsive UIs.'),
  ('resumePath', '/resume/resume.pdf'),
  ('contactText', 'I''m always open to discussing new projects, creative ideas, or opportunities to be part of your visions.'),
  ('linkedinUrl', 'https://www.linkedin.com/in/mohamed-aiman-7365701ba/'),
  ('githubUrl', 'https://github.com/Darkguyaiman'),
  ('xUrl', 'https://x.com/MohamedAiman103'),
  ('instagramUrl', 'https://www.instagram.com/darkguyaiman/'),
  ('facebookUrl', 'https://www.facebook.com/darkguyaiman'),
  ('email', 'mohamedaiman103@gmail.com');
