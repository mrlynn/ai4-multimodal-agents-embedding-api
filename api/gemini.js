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

  // Apply rate limiting - less restrictive for AI generation
  const rateLimitResult = applyRateLimit(req, res, {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 30, // 30 requests per 15 minutes
    burstLimit: 3, // 3 requests per minute
    burstWindowMs: 60 * 1000 // 1 minute
  });
  
  if (rateLimitResult) return; // Rate limit exceeded

  try {
    const { 
      model = 'gemini-2.0-flash-exp',
      contents,
      tools,
      generationConfig,
      systemInstruction
    } = req.body;
    
    if (!contents || !Array.isArray(contents)) {
      return res.status(400).json({ 
        error: 'Contents parameter is required and must be an array' 
      });
    }

    // Get API key from environment variable
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Gemini API key not configured' });
    }

    // Build request body for Gemini API
    const requestBody = {
      contents,
      generationConfig: generationConfig || {
        temperature: 0.7,
        maxOutputTokens: 2048
      }
    };

    // Add optional parameters
    if (tools) {
      requestBody.tools = tools;
    }
    if (systemInstruction) {
      requestBody.systemInstruction = systemInstruction;
    }

    // Call Gemini API
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      requestBody,
      {
        headers: {
          'x-goog-api-key': apiKey,
          'Content-Type': 'application/json'
        }
      }
    );

    // Return the response
    res.status(200).json(response.data);

  } catch (error) {
    console.error('Gemini API error:', error.response?.data || error.message);
    
    // Handle specific Gemini API errors
    if (error.response?.status === 400) {
      return res.status(400).json({
        error: 'Invalid request to Gemini API',
        details: error.response.data
      });
    }
    
    if (error.response?.status === 403) {
      return res.status(403).json({
        error: 'Gemini API access denied - check API key',
        details: error.response.data
      });
    }

    res.status(500).json({ 
      error: 'Failed to generate content',
      details: error.response?.data || error.message
    });
  }
};