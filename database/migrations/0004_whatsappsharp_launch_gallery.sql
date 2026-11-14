-- Original WhatsAppSharp launch screenshots; fictional demonstration conversations.
START TRANSACTION;

INSERT INTO project_images (project_id, image_path, display_order)
SELECT p.id, 'projects/whatsappsharp-desktop-dark.webp', 1 FROM projects p WHERE p.project_name = 'WhatsAppSharp'
AND NOT EXISTS (SELECT 1 FROM project_images i WHERE i.project_id = p.id AND i.image_path = 'projects/whatsappsharp-desktop-dark.webp');
UPDATE project_images i JOIN projects p ON p.id=i.project_id SET i.display_order=1 WHERE p.project_name='WhatsAppSharp' AND i.image_path='projects/whatsappsharp-desktop-dark.webp';

INSERT INTO project_images (project_id, image_path, display_order)
SELECT p.id, 'projects/whatsappsharp-desktop-light.webp', 2 FROM projects p WHERE p.project_name = 'WhatsAppSharp'
AND NOT EXISTS (SELECT 1 FROM project_images i WHERE i.project_id = p.id AND i.image_path = 'projects/whatsappsharp-desktop-light.webp');
UPDATE project_images i JOIN projects p ON p.id=i.project_id SET i.display_order=2 WHERE p.project_name='WhatsAppSharp' AND i.image_path='projects/whatsappsharp-desktop-light.webp';

INSERT INTO project_images (project_id, image_path, display_order)
SELECT p.id, 'projects/whatsappsharp-mobile-chat.webp', 3 FROM projects p WHERE p.project_name = 'WhatsAppSharp'
AND NOT EXISTS (SELECT 1 FROM project_images i WHERE i.project_id = p.id AND i.image_path = 'projects/whatsappsharp-mobile-chat.webp');
UPDATE project_images i JOIN projects p ON p.id=i.project_id SET i.display_order=3 WHERE p.project_name='WhatsAppSharp' AND i.image_path='projects/whatsappsharp-mobile-chat.webp';

UPDATE project_images i JOIN projects p ON p.id=i.project_id SET i.display_order=4 WHERE p.project_name='WhatsAppSharp' AND i.image_path='projects/whatsappsharp-login.webp';
COMMIT;
