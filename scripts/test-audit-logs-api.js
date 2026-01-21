const axios = require('axios');

async function testAuditLogsAPI() {
  try {
    console.log('Testing Audit Logs API...');

    // First, login to get a token
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'admin@garmentims.com',
      password: 'admin123'
    });

    if (!loginResponse.data.success) {
      console.error('Login failed:', loginResponse.data.message);
      return;
    }

    const token = loginResponse.data.data.token;
    console.log('Login successful, token obtained');

    // Test audit logs API with authentication
    const auditLogsResponse = await axios.get('http://localhost:3000/api/audit-logs?page=1&limit=5', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Audit Logs API Response:');
    console.log('Success:', auditLogsResponse.data.success);
    console.log('Total logs:', auditLogsResponse.data.data.total);
    console.log('Logs count:', auditLogsResponse.data.data.data.length);
    
    if (auditLogsResponse.data.data.data.length > 0) {
      console.log('Sample log entry:');
      const sampleLog = auditLogsResponse.data.data.data[0];
      console.log('- Action:', sampleLog.action);
      console.log('- Target Table:', sampleLog.target_table);
      console.log('- User:', sampleLog.User ? sampleLog.User.full_name : 'N/A');
      console.log('- Created At:', sampleLog.created_at);
    }

    console.log('\n✅ Audit Logs API is working correctly!');

  } catch (error) {
    console.error('❌ Error testing Audit Logs API:', error.response?.data || error.message);
  }
}

// Run the test
testAuditLogsAPI();