/**
 * k6 Load Testing Script for IELTS Ai Pro
 *
 * This script tests the application under load with various scenarios.
 *
 * Installation:
 *   brew install k6
 *
 * Usage:
 *   k6 run tests/performance/load-test.js
 *
 * With custom base URL:
 *   k6 run -e BASE_URL=http://your-staging-url.com tests/performance/load-test.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('error_rate');
const pageLoadTime = new Trend('page_load_time');

// Configuration
const env = globalThis.__ENV || {};
const BASE_URL = env.BASE_URL || 'http://localhost:5173';

// Test scenarios
export const options = {
  scenarios: {
    // Smoke test - basic sanity check
    smoke: {
      executor: 'constant-vus',
      vus: 1,
      duration: '30s',
      startTime: '0s',
      tags: { scenario: 'smoke' },
    },
    // Load test - normal expected load
    load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 10 }, // Ramp up to 10 users
        { duration: '1m', target: 10 }, // Stay at 10 users
        { duration: '30s', target: 20 }, // Ramp up to 20 users
        { duration: '1m', target: 20 }, // Stay at 20 users
        { duration: '30s', target: 0 }, // Ramp down
      ],
      startTime: '35s',
      tags: { scenario: 'load' },
    },
    // Stress test - beyond normal capacity
    stress: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 50 }, // Ramp up to 50 users
        { duration: '1m', target: 50 }, // Stay at 50 users
        { duration: '30s', target: 100 }, // Ramp up to 100 users
        { duration: '30s', target: 100 }, // Stay at 100 users
        { duration: '1m', target: 0 }, // Ramp down
      ],
      startTime: '5m',
      tags: { scenario: 'stress' },
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'], // 95% < 500ms, 99% < 1s
    http_req_failed: ['rate<0.05'], // Error rate < 5%
    error_rate: ['rate<0.1'], // Custom error rate < 10%
  },
};

// Main test function
export default function () {
  group('Public Pages', () => {
    // Landing page
    let res = http.get(BASE_URL);
    check(res, {
      'landing page status 200': (r) => r.status === 200,
      'landing page < 500ms': (r) => r.timings.duration < 500,
    });
    errorRate.add(res.status !== 200);
    pageLoadTime.add(res.timings.duration);

    sleep(1);

    // Pricing page
    res = http.get(`${BASE_URL}/pricing`);
    check(res, {
      'pricing page status 200': (r) => r.status === 200,
      'pricing page < 500ms': (r) => r.timings.duration < 500,
    });
    errorRate.add(res.status !== 200);
    pageLoadTime.add(res.timings.duration);

    sleep(1);

    // Login page
    res = http.get(`${BASE_URL}/login`);
    check(res, {
      'login page status 200': (r) => r.status === 200,
      'login page < 500ms': (r) => r.timings.duration < 500,
    });
    errorRate.add(res.status !== 200);
    pageLoadTime.add(res.timings.duration);

    sleep(1);
  });

  group('Static Assets', () => {
    // Test static asset loading (adjust paths as needed)
    const assetRes = http.get(`${BASE_URL}/favicon.ico`);
    check(assetRes, {
      'static asset loads': (r) => r.status === 200 || r.status === 304,
    });

    sleep(0.5);
  });

  // Simulate user think time
  sleep(Math.random() * 3 + 1);
}

// Optional: Test authenticated endpoints
export function authenticatedTest() {
  // This would require setting up authentication
  // and is left as a template

  const loginPayload = JSON.stringify({
    email: env.TEST_EMAIL,
    password: env.TEST_PASSWORD,
  });

  const loginHeaders = {
    'Content-Type': 'application/json',
  };

  // Note: Actual implementation depends on your auth setup
  // This is a placeholder showing the pattern
  group('Authenticated Endpoints', () => {
    // Dashboard
    const dashboardRes = http.get(`${BASE_URL}/dashboard`);
    check(dashboardRes, {
      'dashboard accessible or redirect': (r) => r.status === 200 || r.status === 302,
    });

    sleep(1);

    // Reading tests
    const readingRes = http.get(`${BASE_URL}/reading`);
    check(readingRes, {
      'reading page loads': (r) => r.status === 200 || r.status === 302,
    });

    sleep(1);
  });
}

// Teardown
export function teardown(data) {
  console.log('Load test completed');
}
