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

async function testAPIs() {
  try {
    console.log('🧪 Testing User, Role, and Permission APIs...\n');

    // Step 1: Login to get token
    console.log('1. Logging in...');
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

    // Step 2: Test Permissions API
    console.log('\n2. Testing Permissions API...');
    
    const permissionsResponse = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/permissions?limit=5',
      method: 'GET',
      headers: authHeaders
    });

    if (permissionsResponse.status === 200) {
      console.log('✅ GET /api/permissions - Success');
      console.log(`   Found ${permissionsResponse.data.data.total} permissions`);
    } else {
      console.log('❌ GET /api/permissions - Failed:', permissionsResponse.status);
    }

    // Step 3: Test Roles API
    console.log('\n3. Testing Roles API...');
    
    const rolesResponse = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/roles?limit=5',
      method: 'GET',
      headers: authHeaders
    });

    if (rolesResponse.status === 200) {
      console.log('✅ GET /api/roles - Success');
      console.log(`   Found ${rolesResponse.data.data.total} roles`);
    } else {
      console.log('❌ GET /api/roles - Failed:', rolesResponse.status);
    }

    // Step 4: Test Users API
    console.log('\n4. Testing Users API...');
    
    const usersResponse = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/users?limit=5',
      method: 'GET',
      headers: authHeaders
    });

    if (usersResponse.status === 200) {
      console.log('✅ GET /api/users - Success');
      console.log(`   Found ${usersResponse.data.data.total} users`);
    } else {
      console.log('❌ GET /api/users - Failed:', usersResponse.status);
    }

    // Step 5: Test Create Permission
    console.log('\n5. Testing Create Permission...');
    
    const createPermissionResponse = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/permissions',
      method: 'POST',
      headers: authHeaders
    }, {
      code: 'test.permission',
      description: 'Test permission for API testing'
    });

    if (createPermissionResponse.status === 201) {
      console.log('✅ POST /api/permissions - Success');
      console.log(`   Created permission: ${createPermissionResponse.data.data.code}`);
    } else {
      console.log('❌ POST /api/permissions - Failed:', createPermissionResponse.status);
      console.log('   Response:', createPermissionResponse.data.message);
    }

    // Step 6: Test Create Role
    console.log('\n6. Testing Create Role...');
    
    const createRoleResponse = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/roles',
      method: 'POST',
      headers: authHeaders
    }, {
      name: 'test-role',
      description: 'Test role for API testing',
      permissions: []
    });

    if (createRoleResponse.status === 201) {
      console.log('✅ POST /api/roles - Success');
      console.log(`   Created role: ${createRoleResponse.data.data.name}`);
    } else {
      console.log('❌ POST /api/roles - Failed:', createRoleResponse.status);
      console.log('   Response:', createRoleResponse.data.message);
    }

    // Step 7: Test Create User with Role
    console.log('\n7. Testing Create User with Role...');
    
    const createUserResponse = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/users',
      method: 'POST',
      headers: authHeaders
    }, {
      email: 'testuser@example.com',
      password: 'testpass123',
      full_name: 'Test User',
      phone: '1234567890',
      roles: rolesResponse.data.data.data.length > 0 ? [rolesResponse.data.data.data[0].id] : []
    });

    if (createUserResponse.status === 201) {
      console.log('✅ POST /api/users - Success');
      console.log(`   Created user: ${createUserResponse.data.data.full_name}`);
      console.log(`   Assigned roles: ${createUserResponse.data.data.Roles?.length || 0}`);
    } else {
      console.log('❌ POST /api/users - Failed:', createUserResponse.status);
      console.log('   Response:', createUserResponse.data.message);
    }

    console.log('\n🎉 API Testing Complete!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the tests
testAPIs();