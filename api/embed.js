const axios = require('axios');
const { applyRateLimit } = require('../lib/rateLimiter');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Apply rate limiting - more restrictive for embeddings
  const rateLimitResult = applyRateLimit(req, res, {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 50, // 50 requests per 15 minutes
    burstLimit: 5, // 5 requests per minute
    burstWindowMs: 60 * 1000 // 1 minute
  });
  
  if (rateLimitResult) return; // Rate limit exceeded

  try {
    const { text, model = 'voyage-3' } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text parameter is required' });
    }

    // Get API key from environment variable
    const apiKey = process.env.VOYAGE_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    // Call Voyage AI API
    const response = await axios.post('https://api.voyageai.com/v1/embeddings', {
      input: text,
      model: model,
      input_type: 'document' // or 'query' based on use case
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    // Return the embeddings
    res.status(200).json({
      embeddings: response.data.data.map(item => item.embedding),
      model: response.data.model,
      usage: response.data.usage
    });

  } catch (error) {
    console.error('Voyage AI API error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to generate embeddings',
      details: error.response?.data?.error || error.message
    });
  }
};