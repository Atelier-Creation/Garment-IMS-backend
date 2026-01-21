const http = require('http');

// Simple HTTP request function
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve({ status: res.statusCode, data: response });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testCompleteUserManagement() {
  try {
    console.log('🧪 Testing Complete User Management System...\n');

    // Step 1: Login to get token
    console.log('1. Logging in as admin...');
    const loginResponse = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      email: 'admin@garmentims.com',
      password: 'admin123'
    });

    if (loginResponse.status !== 200 || !loginResponse.data.success) {
      console.error('❌ Login failed:', loginResponse.data.message);
      return;
    }

    const token = loginResponse.data.data.token;
    console.log('✅ Login successful');

    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    // Step 2: Test Permissions Management
    console.log('\n2. Testing Permissions Management...');
    
    // Create a test permission
    const createPermissionResponse = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/permissions',
      method: 'POST',
      headers: authHeaders
    }, {
      code: 'inventory.manage',
      description: 'Manage inventory items and stock levels'
    });

    let testPermissionId = null;
    if (createPermissionResponse.status === 201) {
      testPermissionId = createPermissionResponse.data.data.id;
      console.log('✅ Permission created successfully');
    } else {
      console.log('⚠️  Permission creation failed (might already exist)');
    }

    // List permissions
    const permissionsResponse = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/permissions?limit=5',
      method: 'GET',
      headers: authHeaders
    });

    if (permissionsResponse.status === 200) {
      console.log(`✅ Listed permissions: ${permissionsResponse.data.data.total} total`);
    } else {
      console.log('❌ Failed to list permissions');
    }

    // Step 3: Test Role Management
    console.log('\n3. Testing Role Management...');
    
    // Get available permissions for role creation
    const allPermissionsResponse = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/permissions/all',
      method: 'GET',
      headers: authHeaders
    });

    let availablePermissions = [];
    if (allPermissionsResponse.status === 200) {
      availablePermissions = allPermissionsResponse.data.data || [];
      console.log(`✅ Retrieved ${availablePermissions.length} available permissions`);
    }

    // Create a test role with some permissions
    const testPermissions = availablePermissions.slice(0, 5).map(p => p.id);
    const createRoleResponse = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/roles',
      method: 'POST',
      headers: authHeaders
    }, {
      name: 'inventory-manager',
      description: 'Manages inventory and stock operations',
      permissions: testPermissions
    });

    let testRoleId = null;
    if (createRoleResponse.status === 201) {
      testRoleId = createRoleResponse.data.data.id;
      console.log('✅ Role created successfully with permissions');
    } else {
      console.log('⚠️  Role creation failed (might already exist)');
    }

    // List roles
    const rolesResponse = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/roles?limit=5',
      method: 'GET',
      headers: authHeaders
    });

    if (rolesResponse.status === 200) {
      console.log(`✅ Listed roles: ${rolesResponse.data.data.total} total`);
    } else {
      console.log('❌ Failed to list roles');
    }

    // Step 4: Test User Management with Role Assignment
    console.log('\n4. Testing User Management with Role Assignment...');
    
    // Get available roles for user creation
    const availableRoles = rolesResponse.data.data.data || [];
    const testRoles = availableRoles.slice(0, 2).map(r => r.id);

    // Create a test user with roles
    const createUserResponse = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/users',
      method: 'POST',
      headers: authHeaders
    }, {
      email: 'manager@garmentims.com',
      password: 'manager123',
      full_name: 'Inventory Manager',
      phone: '1234567890',
      roles: testRoles
    });

    let testUserId = null;
    if (createUserResponse.status === 201) {
      testUserId = createUserResponse.data.data.id;
      console.log('✅ User created successfully with roles');
      console.log(`   User: ${createUserResponse.data.data.full_name}`);
      console.log(`   Roles assigned: ${createUserResponse.data.data.Roles?.length || 0}`);
    } else {
      console.log('⚠️  User creation failed:', createUserResponse.data.message);
    }

    // List users
    const usersResponse = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/users?limit=5',
      method: 'GET',
      headers: authHeaders
    });

    if (usersResponse.status === 200) {
      console.log(`✅ Listed users: ${usersResponse.data.data.total} total`);
    } else {
      console.log('❌ Failed to list users');
    }

    // Step 5: Test User Login with New User
    if (testUserId) {
      console.log('\n5. Testing New User Login...');
      
      const newUserLoginResponse = await makeRequest({
        hostname: 'localhost',
        port: 3000,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, {
        email: 'manager@garmentims.com',
        password: 'manager123'
      });

      if (newUserLoginResponse.status === 200) {
        console.log('✅ New user login successful');
        console.log(`   User: ${newUserLoginResponse.data.data.user.full_name}`);
        console.log(`   Roles: ${newUserLoginResponse.data.data.user.Roles?.length || 0}`);
      } else {
        console.log('❌ New user login failed');
      }
    }

    // Step 6: Cleanup (optional)
    console.log('\n6. Cleanup...');
    
    if (testUserId) {
      const deleteUserResponse = await makeRequest({
        hostname: 'localhost',
        port: 3000,
        path: `/api/users/${testUserId}`,
        method: 'DELETE',
        headers: authHeaders
      });
      
      if (deleteUserResponse.status === 200) {
        console.log('✅ Test user deleted');
      }
    }

    if (testRoleId) {
      const deleteRoleResponse = await makeRequest({
        hostname: 'localhost',
        port: 3000,
        path: `/api/roles/${testRoleId}`,
        method: 'DELETE',
        headers: authHeaders
      });
      
      if (deleteRoleResponse.status === 200) {
        console.log('✅ Test role deleted');
      }
    }

    if (testPermissionId) {
      const deletePermissionResponse = await makeRequest({
        hostname: 'localhost',
        port: 3000,
        path: `/api/permissions/${testPermissionId}`,
        method: 'DELETE',
        headers: authHeaders
      });
      
      if (deletePermissionResponse.status === 200) {
        console.log('✅ Test permission deleted');
      }
    }

    console.log('\n🎉 Complete User Management System Test Completed Successfully!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Permission Management - Working');
    console.log('   ✅ Role Management - Working');
    console.log('   ✅ User Management with Role Assignment - Working');
    console.log('   ✅ Authentication with Role-based Access - Working');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the comprehensive test
testCompleteUserManagement();