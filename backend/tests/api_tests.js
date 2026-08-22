/**
 * BalochHunar — Automated API & Quality Assurance Test Suite
 * Tests all authentication, CRUD, relational queries, validation, and AI endpoints
 */

const BASE_URL = process.env.TEST_URL || 'http://localhost:5000/api';

let sessionCookie = '';
let passedTests = 0;
let failedTests = 0;

function logTest(testName, passed, detail = '') {
  if (passed) {
    console.log(`  ✅ [PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`  ❌ [FAIL] ${testName} — ${detail}`);
    failedTests++;
  }
}

async function runTests() {
  console.log('====================================================');
  console.log('  🧪 BalochHunar Automated End-to-End QA Test Suite   ');
  console.log('====================================================');
  console.log(`Target API URL: ${BASE_URL}\n`);

  try {
    // ----------------------------------------------------
    // TEST 1: Health Check Endpoint
    // ----------------------------------------------------
    const healthRes = await fetch(`${BASE_URL}/health`);
    const healthData = await healthRes.json();
    logTest('API Health Check Endpoint', healthRes.status === 200 && healthData.success === true);

    // ----------------------------------------------------
    // TEST 2: Authentication Tests
    // ----------------------------------------------------
    console.log('\n--- Module: Authentication & Security ---');

    // 2a. Login with invalid password
    const badLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@balochhunar.com', password: 'wrongpassword' })
    });
    logTest('Reject Invalid Password (HTTP 401)', badLoginRes.status === 401);

    // 2b. Login with missing credentials
    const emptyLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: '', password: '' })
    });
    logTest('Reject Empty Credentials (HTTP 400)', emptyLoginRes.status === 400);

    // 2c. Successful Login & Session Cookie Capture
    const validLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@balochhunar.com', password: 'admin123' })
    });
    const validLoginData = await validLoginRes.json();
    sessionCookie = validLoginRes.headers.get('set-cookie') || '';
    
    logTest(
      'Valid Admin Login & Session Cookie Generation',
      validLoginRes.status === 200 && validLoginData.success === true && validLoginData.user.role === 'admin'
    );

    // 2d. Protected Route without Session
    const unauthStatsRes = await fetch(`${BASE_URL}/auth/stats`);
    logTest('Block Unauthenticated Access to Protected Route (HTTP 401)', unauthStatsRes.status === 401);

    // 2e. Protected Route with Valid Session Cookie
    const authStatsRes = await fetch(`${BASE_URL}/auth/stats`, {
      headers: { Cookie: sessionCookie }
    });
    const authStatsData = await authStatsRes.json();
    logTest(
      'Authenticated Access to Dashboard Stats',
      authStatsRes.status === 200 && authStatsData.success === true && authStatsData.stats.totalProducts !== undefined
    );

    // ----------------------------------------------------
    // TEST 3: Categories CRUD
    // ----------------------------------------------------
    console.log('\n--- Module: Categories CRUD ---');
    
    // 3a. Read all categories
    const getCatsRes = await fetch(`${BASE_URL}/categories`);
    const getCatsData = await getCatsRes.json();
    logTest('GET All Categories', getCatsRes.status === 200 && Array.isArray(getCatsData.data));

    // 3b. Create category
    const createCatRes = await fetch(`${BASE_URL}/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
      body: JSON.stringify({
        name: 'QA Test Category ' + Date.now(),
        description: 'Test craft classification created by automated test suite'
      })
    });
    const createCatData = await createCatRes.json();
    const testCatId = createCatData.data?.id;
    logTest('POST Create Category (Admin)', createCatRes.status === 201 && testCatId > 0);

    // 3c. Delete test category
    if (testCatId) {
      const delCatRes = await fetch(`${BASE_URL}/categories/${testCatId}`, {
        method: 'DELETE',
        headers: { Cookie: sessionCookie }
      });
      logTest('DELETE Category (Admin)', delCatRes.status === 200);
    }

    // ----------------------------------------------------
    // TEST 4: Artisans CRUD
    // ----------------------------------------------------
    console.log('\n--- Module: Master Artisans CRUD ---');

    // 4a. Read all artisans
    const getArtisansRes = await fetch(`${BASE_URL}/artisans`);
    const getArtisansData = await getArtisansRes.json();
    logTest('GET All Master Artisans', getArtisansRes.status === 200 && getArtisansData.data.length > 0);

    // 4b. Read single artisan by ID
    const firstArtisanId = getArtisansData.data[0]?.id;
    if (firstArtisanId) {
      const singleArtisanRes = await fetch(`${BASE_URL}/artisans/${firstArtisanId}`);
      const singleArtisanData = await singleArtisanRes.json();
      logTest(
        'GET Single Artisan Details with Crafted Products',
        singleArtisanRes.status === 200 && Array.isArray(singleArtisanData.data.products)
      );
    }

    // ----------------------------------------------------
    // TEST 5: Products Catalog & Multi-Search
    // ----------------------------------------------------
    console.log('\n--- Module: Products & Multi-Faceted Search ---');

    // 5a. Read all products with joined relational entities
    const getProductsRes = await fetch(`${BASE_URL}/products`);
    const getProductsData = await getProductsRes.json();
    const sampleProduct = getProductsData.data[0];
    logTest(
      'GET All Products (Relational 3-way JOIN verified)',
      getProductsRes.status === 200 && sampleProduct && sampleProduct.category_name && sampleProduct.artisan_name
    );

    // 5b. Search query filtering
    const searchRes = await fetch(`${BASE_URL}/products?search=doch`);
    const searchData = await searchRes.json();
    logTest('GET Products Search Filter (?search=doch)', searchRes.status === 200 && searchData.data.length > 0);

    // 5c. Combined Multi-Faceted Search & Price Filter
    const multiFilterRes = await fetch(`${BASE_URL}/products?category=1&min_price=10000&sort=price_desc`);
    const multiFilterData = await multiFilterRes.json();
    logTest(
      'Combined Multi-Faceted Filter (?category=1&min_price=10000&sort=price_desc)',
      multiFilterRes.status === 200 && Array.isArray(multiFilterData.data)
    );

    // ----------------------------------------------------
    // TEST 6: AI Business Intelligence Features
    // ----------------------------------------------------
    console.log('\n--- Module: AI Business Features ---');

    // 6a. AI Product Description Generator
    const aiDescRes = await fetch(`${BASE_URL}/ai/product-description`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
      body: JSON.stringify({
        name: 'Heirloom Doch Velvet Shawl',
        craft_type: 'Balochi Doch Embroidery',
        material: 'Pure Velvet & Silk Thread',
        color: 'Deep Maroon & Saffron',
        characteristics: 'Traditional Kaputuk micro-stitches with mirror work'
      })
    });
    const aiDescData = await aiDescRes.json();
    logTest(
      'AI Feature 1: Product Description Generator',
      aiDescRes.status === 200 && aiDescData.success === true && aiDescData.data.description.length > 50
    );

    // 6b. AI Smart Tags Suggester
    const aiTagsRes = await fetch(`${BASE_URL}/ai/suggest-tags`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
      body: JSON.stringify({
        name: 'Hand-tooled Leather Chappal',
        description: 'Vegetable-tanned leather footwear with geometric patterns',
        craft_type: 'Handcrafted Leatherwork'
      })
    });
    const aiTagsData = await aiTagsRes.json();
    logTest(
      'AI Feature 2: Smart Taxonomy & Tag Suggester',
      aiTagsRes.status === 200 && aiTagsData.success === true && aiTagsData.data.tagList.length >= 3
    );

    // 6c. AI Artisan Cultural Story Generator
    const aiStoryRes = await fetch(`${BASE_URL}/ai/artisan-story`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
      body: JSON.stringify({
        name: 'Gul Bibi',
        location: 'Panjgur, Balochistan',
        experience_years: 19,
        craft_type: 'Clay & Terracotta Pottery',
        background: 'Generational potter shaping river silt earthenware',
        materials: 'Alluvial riverbed clay and natural earth pigments'
      })
    });
    const aiStoryData = await aiStoryRes.json();
    logTest(
      'AI Feature 3: Cultural Story Behind the Craft Generator',
      aiStoryRes.status === 200 && aiStoryData.success === true && aiStoryData.data.story.length > 50
    );

    // ----------------------------------------------------
    // TEST 7: Customer Inquiries / Messages
    // ----------------------------------------------------
    console.log('\n--- Module: Customer Inquiries & Messages ---');

    // 7a. Submit public contact inquiry
    const msgSubmitRes = await fetch(`${BASE_URL}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'QA Evaluator',
        email: 'qa.evaluator@example.com',
        phone: '+92 300 9998877',
        subject: 'Automated Test Inquiry',
        message: 'This is an automated quality assurance inquiry verifying database persistence.'
      })
    });
    const msgSubmitData = await msgSubmitRes.json();
    const createdMsgId = msgSubmitData.data?.id;
    logTest('POST Public Customer Inquiry Submission', msgSubmitRes.status === 201 && createdMsgId > 0);

    // 7b. Admin mark as read
    if (createdMsgId) {
      const markReadRes = await fetch(`${BASE_URL}/messages/${createdMsgId}/read`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
        body: JSON.stringify({ is_read: true })
      });
      logTest('PUT Toggle Message Read Status (Admin)', markReadRes.status === 200);

      // Clean up test message
      await fetch(`${BASE_URL}/messages/${createdMsgId}`, {
        method: 'DELETE',
        headers: { Cookie: sessionCookie }
      });
    }

    // ----------------------------------------------------
    // TEST 8: Logout & Session Invalidation
    // ----------------------------------------------------
    console.log('\n--- Module: Logout & Session Cleanup ---');
    const logoutRes = await fetch(`${BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: { Cookie: sessionCookie }
    });
    logTest('POST Admin Logout', logoutRes.status === 200);

    // Verify session is invalidated
    const postLogoutStats = await fetch(`${BASE_URL}/auth/stats`, {
      headers: { Cookie: sessionCookie }
    });
    logTest('Verify Invalidation After Logout (HTTP 401)', postLogoutStats.status === 401);

    // ----------------------------------------------------
    // Test Summary
    // ----------------------------------------------------
    console.log('\n====================================================');
    console.log(`📊 Test Results: ${passedTests} Passed | ${failedTests} Failed`);
    if (failedTests === 0) {
      console.log('🎉 ALL END-TO-END QA TESTS PASSED PERFECTLY!');
    } else {
      console.log('⚠️ Some tests failed. Check server logs.');
    }
    console.log('====================================================\n');
  } catch (error) {
    console.error('❌ Test execution exception:', error.message);
    console.error('💡 Ensure the backend server is running via `npm run dev` before executing tests.');
  }
}

if (require.main === module) {
  runTests();
}

module.exports = runTests;
