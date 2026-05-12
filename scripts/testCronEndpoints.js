/**
 * Test script for external cron endpoints
 * Run with: node scripts/testCronEndpoints.js
 */

const axios = require('axios');
require('dotenv').config();

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:5001';
const CRON_SECRET = process.env.CRON_SECRET_KEY;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  section: (msg) => console.log(`\n${colors.cyan}${'='.repeat(60)}\n${msg}\n${'='.repeat(60)}${colors.reset}\n`),
};

// Test functions
async function testHealthCheck() {
  log.section('Testing Health Check Endpoint');
  try {
    const response = await axios.get(`${BASE_URL}/api/cron/health`);
    log.success('Health check passed');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    log.error('Health check failed');
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    return false;
  }
}

async function testCustomReminders() {
  log.section('Testing Custom Reminders Endpoint');
  
  if (!CRON_SECRET) {
    log.error('CRON_SECRET_KEY not found in .env file');
    return false;
  }
  
  try {
    const response = await axios.post(
      `${BASE_URL}/api/cron/custom-reminders`,
      {},
      {
        headers: {
          'x-cron-secret': CRON_SECRET,
        },
      }
    );
    log.success('Custom reminders endpoint working');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    log.error('Custom reminders endpoint failed');
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    return false;
  }
}

async function testEndOfDayWarnings() {
  log.section('Testing End of Day Warnings Endpoint');
  
  if (!CRON_SECRET) {
    log.error('CRON_SECRET_KEY not found in .env file');
    return false;
  }
  
  try {
    const response = await axios.post(
      `${BASE_URL}/api/cron/end-of-day-warnings`,
      {},
      {
        headers: {
          'x-cron-secret': CRON_SECRET,
        },
      }
    );
    log.success('End of day warnings endpoint working');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    log.error('End of day warnings endpoint failed');
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    return false;
  }
}

async function testUnauthorizedAccess() {
  log.section('Testing Unauthorized Access (Should Fail)');
  
  try {
    await axios.post(`${BASE_URL}/api/cron/custom-reminders`);
    log.error('Security issue: Endpoint accessible without secret!');
    return false;
  } catch (error) {
    if (error.response && error.response.status === 401) {
      log.success('Security working: Unauthorized access blocked');
      console.log('Response:', error.response.data);
      return true;
    } else {
      log.error('Unexpected error');
      console.error('Error:', error.message);
      return false;
    }
  }
}

async function testInvalidSecret() {
  log.section('Testing Invalid Secret (Should Fail)');
  
  try {
    await axios.post(
      `${BASE_URL}/api/cron/custom-reminders`,
      {},
      {
        headers: {
          'x-cron-secret': 'invalid-secret-key',
        },
      }
    );
    log.error('Security issue: Endpoint accessible with invalid secret!');
    return false;
  } catch (error) {
    if (error.response && error.response.status === 403) {
      log.success('Security working: Invalid secret rejected');
      console.log('Response:', error.response.data);
      return true;
    } else {
      log.error('Unexpected error');
      console.error('Error:', error.message);
      return false;
    }
  }
}

// Main test runner
async function runAllTests() {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║        External Cron Endpoints Test Suite                ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
  
  log.info(`Testing server at: ${BASE_URL}`);
  log.info(`CRON_SECRET_KEY ${CRON_SECRET ? 'found' : 'NOT FOUND'} in .env`);
  
  const results = {
    healthCheck: await testHealthCheck(),
    customReminders: await testCustomReminders(),
    endOfDayWarnings: await testEndOfDayWarnings(),
    unauthorizedAccess: await testUnauthorizedAccess(),
    invalidSecret: await testInvalidSecret(),
  };
  
  // Summary
  log.section('Test Summary');
  
  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;
  
  console.log('Results:');
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? `${colors.green}✅ PASS${colors.reset}` : `${colors.red}❌ FAIL${colors.reset}`;
    console.log(`  ${test.padEnd(25)} ${status}`);
  });
  
  console.log(`\n${colors.cyan}Total: ${passed}/${total} tests passed${colors.reset}\n`);
  
  if (passed === total) {
    log.success('All tests passed! Your cron endpoints are ready to use.');
    log.info('');
    log.info('For Render free tier (Option A - Keep Server Warm):');
    log.info('1. Deploy to Render');
    log.info('2. Sign up at cron-job.org');
    log.info('3. Create job: POST /api/cron/custom-reminders every 1 minute');
    log.info('4. Create job: POST /api/cron/end-of-day-warnings daily at 21:00');
    log.info('5. Add header: x-cron-secret: your-secret-key');
    log.info('');
    log.success('Calling every 1 minute keeps Render server warm = no cold starts!');
  } else {
    log.error('Some tests failed. Please check the errors above.');
  }
  
  // Exit with appropriate code
  process.exit(passed === total ? 0 : 1);
}

// Run tests
runAllTests().catch((error) => {
  log.error('Test suite failed');
  console.error(error);
  process.exit(1);
});
