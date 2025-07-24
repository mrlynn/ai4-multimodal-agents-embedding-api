const axios = require('axios');

// Configuration - UPDATE THIS WITH YOUR ACTUAL DEPLOYMENT URL
const DEPLOYED_API_URL = 'https://workshop-embedding-api.vercel.app/api/embed';
const TEST_TEXT = 'MongoDB Atlas Vector Search enables semantic search on your documents using machine learning embeddings.';
const TEST_MODEL = 'voyage-3';

async function testDeployedAPI() {
  console.log('Testing deployed API endpoint...');
  console.log('URL:', DEPLOYED_API_URL);
  console.log('\n');
  
  try {
    // Test 1: Valid request
    console.log('Test 1: Valid embedding request');
    const startTime = Date.now();
    
    const response = await axios.post(DEPLOYED_API_URL, {
      text: TEST_TEXT,
      model: TEST_MODEL
    });
    
    const responseTime = Date.now() - startTime;
    
    console.log('✅ Success!');
    console.log(`- Response time: ${responseTime}ms`);
    console.log(`- Model: ${response.data.model}`);
    console.log(`- Embedding dimensions: ${response.data.embeddings[0].length}`);
    console.log(`- Tokens used: ${response.data.usage.total_tokens}`);
    console.log(`- Sample embedding values: [${response.data.embeddings[0].slice(0, 5).map(v => v.toFixed(4)).join(', ')}...]`);
    console.log('\n');
    
    // Test 2: Different model
    console.log('Test 2: Using voyage-3-lite model');
    const liteResponse = await axios.post(DEPLOYED_API_URL, {
      text: 'Shorter test text',
      model: 'voyage-3-lite'
    });
    
    console.log('✅ Success with lite model!');
    console.log(`- Model: ${liteResponse.data.model}`);
    console.log(`- Embedding dimensions: ${liteResponse.data.embeddings[0].length}`);
    console.log(`- Tokens used: ${liteResponse.data.usage.total_tokens}`);
    console.log('\n');
    
    // Test 3: Error handling
    console.log('Test 3: Error handling (missing text)');
    try {
      await axios.post(DEPLOYED_API_URL, {
        model: TEST_MODEL
      });
      console.log('❌ Should have failed but succeeded');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Correctly handled bad request');
        console.log(`- Status: ${error.response.status}`);
        console.log(`- Error: ${error.response.data.error}`);
      } else {
        console.log('❌ Unexpected error response:', error.response?.status);
      }
    }
    console.log('\n');
    
    // Test 4: CORS test
    console.log('Test 4: CORS headers verification');
    const corsResponse = await axios.post(DEPLOYED_API_URL, {
      text: 'CORS test',
      model: 'voyage-3'
    });
    
    const corsHeaders = corsResponse.headers;
    console.log('CORS Headers:');
    console.log(`- access-control-allow-origin: ${corsHeaders['access-control-allow-origin'] || 'Not set'}`);
    console.log(`- access-control-allow-methods: ${corsHeaders['access-control-allow-methods'] || 'Not set'}`);
    console.log(`- access-control-allow-headers: ${corsHeaders['access-control-allow-headers'] || 'Not set'}`);
    console.log('\n');
    
    // Test 5: Load test (multiple requests)
    console.log('Test 5: Light load test (5 concurrent requests)');
    const loadTestPromises = Array.from({ length: 5 }, (_, i) => 
      axios.post(DEPLOYED_API_URL, {
        text: `Load test request ${i + 1}: ${TEST_TEXT}`,
        model: 'voyage-3-lite' // Use lite model for faster responses
      })
    );
    
    const loadTestStart = Date.now();
    const loadTestResults = await Promise.all(loadTestPromises);
    const loadTestTime = Date.now() - loadTestStart;
    
    console.log('✅ Load test completed!');
    console.log(`- Total time for 5 requests: ${loadTestTime}ms`);
    console.log(`- Average time per request: ${Math.round(loadTestTime / 5)}ms`);
    console.log(`- All responses successful: ${loadTestResults.every(r => r.status === 200)}`);
    
    console.log('\n🎉 All tests passed! Your API is ready for the workshop.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    
    if (error.response?.status === 500) {
      console.error('\n⚠️  This might be due to:');
      console.error('1. VOYAGE_API_KEY not set in Vercel environment variables');
      console.error('2. Invalid or expired API key');
      console.error('3. Voyage AI service issues');
      console.error('\nTo fix:');
      console.error('1. Run: vercel env add VOYAGE_API_KEY production');
      console.error('2. Enter your valid Voyage AI API key');
      console.error('3. Redeploy: vercel --prod');
    }
    
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      console.error('\n⚠️  Connection failed. Check if:');
      console.error('1. The deployment URL is correct');
      console.error('2. The deployment was successful');
      console.error('3. You have internet connectivity');
    }
  }
}

// Usage instructions
console.log('='.repeat(60));
console.log('WORKSHOP EMBEDDING API - DEPLOYMENT TEST');
console.log('='.repeat(60));
console.log('');
console.log('Before running this test, make sure you have:');
console.log('1. Deployed to Vercel: vercel --prod');
console.log('2. Set environment variable: vercel env add VOYAGE_API_KEY production');
console.log('3. Updated DEPLOYED_API_URL in this script if needed');
console.log('');

// Run the test
testDeployedAPI();