-- Add BOM permissions to the database
-- Run this script to add BOM-related permissions

-- Insert BOM permissions if they don't exist
INSERT IGNORE INTO permissions (id, code, description, created_at) VALUES
(UUID(), 'bom.create', 'Create Bill of Materials', NOW()),
(UUID(), 'bom.read', 'View Bill of Materials', NOW()),
(UUID(), 'bom.update', 'Update Bill of Materials', NOW()),
(UUID(), 'bom.delete', 'Delete Bill of Materials', NOW()),
(UUID(), 'bom.approve', 'Approve Bill of Materials', NOW());

-- Grant all BOM permissions to admin role
INSERT IGNORE INTO role_permissions (role_id, permission_id, created_at)
SELECT r.id, p.id, NOW()
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'admin'
AND p.code LIKE 'bom.%';

-- Verify permissions were added
SELECT 
    r.name as role_name,
    p.code as permission_code,
    p.description
FROM roles r
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE r.name = 'admin' AND p.code LIKE 'bom.%'
ORDER BY p.code;
