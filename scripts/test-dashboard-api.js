#!/usr/bin/env node

const axios = require('axios');

async function testDashboardAPI() {
  console.log('🧪 Testing Dashboard API...\n');

  try {
    // First, login to get a token
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'admin@garmentims.com',
      password: 'admin123'
    });

    if (!loginResponse.data.success) {
      console.log('❌ Login failed:', loginResponse.data.message);
      return;
    }

    const token = loginResponse.data.data.token;
    console.log('✅ Login successful');

    // Test dashboard API
    const dashboardResponse = await axios.get('http://localhost:3000/api/reports/dashboard', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('\n📊 Dashboard API Response:');
    console.log(JSON.stringify(dashboardResponse.data, null, 2));

    if (dashboardResponse.data.success) {
      const data = dashboardResponse.data.data;
      console.log('\n📈 Key Metrics:');
      console.log(`This Month Orders: ${data.sales?.this_month?.count || 0}`);
      console.log(`This Month Revenue: ₹${(data.sales?.this_month?.total || 0).toLocaleString()}`);
      console.log(`Completed Production: ${data.production?.completed_orders || 0}`);
      console.log(`Low Stock Items: ${data.alerts?.low_stock_items || 0}`);
      console.log(`Pending Orders: Sales(${data.pending_orders?.sales || 0}) + Purchase(${data.pending_orders?.purchase || 0}) + Production(${data.pending_orders?.production || 0})`);
    }

  } catch (error) {
    console.error('❌ API Test failed:', error.response?.data || error.message);
  }
}

// Run if called directly
if (require.main === module) {
  testDashboardAPI();
}

module.exports = testDashboardAPI;