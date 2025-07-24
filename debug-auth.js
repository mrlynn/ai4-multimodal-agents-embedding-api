// Debug script to check the API key format
const axios = require('axios');

const LOCAL_URL = 'http://localhost:3000/api/embed';
const DEPLOYED_URL = 'https://workshop-embedding-api.vercel.app/api/embed';

async function debugAuth() {
  console.log('🔍 Debugging API Authentication...\n');
  
  // Test 1: Check local environment
  console.log('1. Local Environment Check:');
  const localApiKey = process.env.VOYAGE_API_KEY;
  if (localApiKey) {
    console.log(`✅ Local API key found: ${localApiKey.slice(0, 10)}...${localApiKey.slice(-5)}`);
    console.log(`📏 Length: ${localApiKey.length}`);
    console.log(`🔍 Contains special chars: ${/[^\w-]/.test(localApiKey)}`);
    
    // Check for invisible characters
    const cleanKey = localApiKey.trim();
    console.log(`🧹 Length after trim: ${cleanKey.length}`);
    console.log(`⚠️  Has whitespace/newlines: ${localApiKey !== cleanKey}`);
  } else {
    console.log('❌ No local API key found');
  }
  
  console.log('\n2. Testing Raw HTTP Headers:');
  
  // Test with manual header construction
  try {
    const response = await axios.post(DEPLOYED_URL, {
      text: 'Simple test',
      model: 'voyage-3'
    }, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Workshop-Test/1.0'
      },
      timeout: 10000
    });
    
    console.log('✅ API call successful!');
    console.log(`📊 Response status: ${response.status}`);
    
  } catch (error) {
    if (error.response) {
      console.log(`❌ API Error: ${error.response.status}`);
      console.log(`📝 Error details:`, error.response.data);
      
      // Check if it's specifically an auth header issue
      if (error.response.data?.details?.includes('Authorization')) {
        console.log('\n🚨 Authorization Header Issue Detected');
        console.log('This usually means:');
        console.log('- API key has invisible characters (carriage return, newlines)');
        console.log('- API key encoding issues');
        console.log('- Vercel environment variable not properly set');
      }
    } else {
      console.log(`❌ Network Error: ${error.message}`);
    }
  }
  
  console.log('\n3. Recommended Actions:');
  console.log('- Verify API key format: should be "voyage-" followed by 40 chars');
  console.log('- Check for invisible characters in Vercel dashboard');
  console.log('- Consider re-creating the environment variable');
}

debugAuth().catch(console.error);