-- Add missing BOM permissions to admin role
DELETE FROM role_permissions 
WHERE role_id = (SELECT id FROM roles WHERE name = 'admin')
AND permission_id IN (SELECT id FROM permissions WHERE code LIKE 'bom.%');

INSERT INTO role_permissions (id, role_id, permission_id, created_at)
SELECT UUID(), r.id, p.id, NOW()
FROM roles r, permissions p
WHERE r.name = 'admin' AND p.code IN ('bom.create', 'bom.read', 'bom.update', 'bom.delete', 'bom.approve');
