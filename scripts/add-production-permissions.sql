-- Add Production Order Permissions to Admin Role

-- First, check if permissions exist, if not create them
INSERT IGNORE INTO permissions (id, code, description, created_at)
VALUES 
  (UUID(), 'production_order.create', 'Create production orders', NOW()),
  (UUID(), 'production_order.read', 'View production orders', NOW()),
  (UUID(), 'production_order.update', 'Update production orders', NOW()),
  (UUID(), 'production_order.delete', 'Delete production orders', NOW()),
  (UUID(), 'production_order.start', 'Start production orders', NOW()),
  (UUID(), 'production_order.complete', 'Complete production orders', NOW());

-- Get the admin role ID
SET @admin_role_id = (SELECT id FROM roles WHERE name = 'admin' LIMIT 1);

-- Add permissions to admin role
INSERT IGNORE INTO role_permissions (role_id, permission_id, created_at)
SELECT @admin_role_id, id, NOW()
FROM permissions
WHERE code IN (
  'production_order.create',
  'production_order.read',
  'production_order.update',
  'production_order.delete',
  'production_order.start',
  'production_order.complete'
);

-- Verify the permissions were added
SELECT 
  r.name as role_name,
  p.code as permission_code,
  p.description
FROM roles r
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE r.name = 'admin' AND p.code LIKE 'production_order.%'
ORDER BY p.code;
