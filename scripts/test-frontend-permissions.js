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

async function testFrontendPermissions() {
  try {
    console.log('🧪 Testing Frontend Permission Loading...\n');

    // Step 1: Login as admin
    console.log('1. Testing Admin Login...');
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

    if (loginResponse.status !== 200) {
      console.error('❌ Admin login failed');
      return;
    }

    const token = loginResponse.data.data.token;
    const user = loginResponse.data.data.user;
    console.log('✅ Login successful');
    console.log('   User:', user.full_name);
    console.log('   Roles:', user.Roles?.length || 0);
    
    if (user.Roles && user.Roles.length > 0) {
      user.Roles.forEach(role => {
        console.log(`   Role: ${role.name} (${role.Permissions?.length || 0} permissions)`);
      });
    }

    // Step 2: Test profile endpoint (what frontend uses)
    console.log('\n2. Testing Profile Endpoint...');
    const profileResponse = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/profile',
      method: 'GET',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (profileResponse.status === 200) {
      console.log('✅ Profile endpoint successful');
      const profileUser = profileResponse.data.data.user;
      console.log('   User:', profileUser.full_name);
      console.log('   Roles:', profileUser.Roles?.length || 0);
      
      // Extract permissions like frontend does
      const permissions = [];
      if (profileUser.Roles) {
        profileUser.Roles.forEach(role => {
          console.log(`   Role: ${role.name}`);
          if (role.Permissions) {
            role.Permissions.forEach(permission => {
              if (!permissions.includes(permission.code)) {
                permissions.push(permission.code);
              }
            });
          }
        });
      }
      
      console.log(`   Total Permissions: ${permissions.length}`);
      console.log('   Sample Permissions:', permissions.slice(0, 10));
      
      // Check specific permissions that menu items need
      const menuPermissions = [
        'product.read', 'category.read', 'stock.read', 
        'purchase.read', 'sales.read', 'production.read',
        'supplier.read', 'customer.read', 'user.read',
        'role.view', 'permission.view', 'reports.view', 'audit.view'
      ];
      
      console.log('\n   Menu Permission Check:');
      menuPermissions.forEach(perm => {
        const hasIt = permissions.includes(perm);
        console.log(`     ${perm}: ${hasIt ? '✅' : '❌'}`);
      });
      
    } else {
      console.log('❌ Profile endpoint failed:', profileResponse.status);
    }

    console.log('\n🎯 Frontend should now show menu items based on these permissions');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testFrontendPermissions();