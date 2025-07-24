const axios = require('axios');

// Configuration constants
const MAX_TEXT_LENGTH = 8192; // Voyage AI's limit
const ALLOWED_MODELS = ['voyage-3', 'voyage-3-lite', 'voyage-finance-2'];
const ALLOWED_INPUT_TYPES = ['document', 'query'];

// Simple in-memory rate limiting (for production, use Redis or similar)
const rateLimitMap = new Map();
const RATE_LIMIT_REQUESTS = 100; // requests per window
const RATE_LIMIT_WINDOW = 60000; // 1 minute in milliseconds

function checkRateLimit(clientId) {
  const now = Date.now();
  const clientData = rateLimitMap.get(clientId) || { count: 0, resetTime: now + RATE_LIMIT_WINDOW };
  
  // Reset if window has passed
  if (now > clientData.resetTime) {
    clientData.count = 0;
    clientData.resetTime = now + RATE_LIMIT_WINDOW;
  }
  
  // Check if rate limit exceeded
  if (clientData.count >= RATE_LIMIT_REQUESTS) {
    return false;
  }
  
  // Increment count
  clientData.count++;
  rateLimitMap.set(clientId, clientData);
  return true;
}

function logRequest(req, status, duration, error = null) {
  const timestamp = new Date().toISOString();
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';
  const textLength = req.body?.text?.length || 0;
  const model = req.body?.model || 'unknown';
  
  const logData = {
    timestamp,
    ip,
    userAgent,
    method: req.method,
    status,
    duration,
    textLength,
    model,
    error: error ? error.message : null
  };
  
  console.log('API_REQUEST:', JSON.stringify(logData));
}

module.exports = async (req, res) => {
  const startTime = Date.now();
  
  // Enable CORS with configurable origins
  const allowedOrigins = process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['*'];
  const origin = req.headers.origin;
  
  if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigins.includes('*') ? '*' : origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    logRequest(req, 200, Date.now() - startTime);
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    logRequest(req, 405, Date.now() - startTime);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Rate limiting
    const clientId = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
    if (!checkRateLimit(clientId)) {
      logRequest(req, 429, Date.now() - startTime);
      return res.status(429).json({ 
        error: 'Rate limit exceeded',
        message: `Maximum ${RATE_LIMIT_REQUESTS} requests per minute allowed`
      });
    }

    const { text, texts, model = 'voyage-3', input_type = 'document' } = req.body;
    
    // Handle both single text and batch inputs
    const input = texts || (text ? [text] : null);
    
    // Input validation
    if (!input || !Array.isArray(input) ? !text : input.length === 0) {
      logRequest(req, 400, Date.now() - startTime);
      return res.status(400).json({ error: 'Either text or texts array is required' });
    }
    
    // Convert single text to array for consistent processing
    const inputArray = Array.isArray(input) ? input : [input];
    
    // Validate each text input
    for (let i = 0; i < inputArray.length; i++) {
      const textInput = inputArray[i];
      if (!textInput || typeof textInput !== 'string') {
        logRequest(req, 400, Date.now() - startTime);
        return res.status(400).json({ 
          error: `Text at index ${i} must be a non-empty string` 
        });
      }
      if (textInput.length > MAX_TEXT_LENGTH) {
        logRequest(req, 400, Date.now() - startTime);
        return res.status(400).json({ 
          error: `Text at index ${i} exceeds maximum length of ${MAX_TEXT_LENGTH} characters` 
        });
      }
    }
    
    // Validate model
    if (!ALLOWED_MODELS.includes(model)) {
      logRequest(req, 400, Date.now() - startTime);
      return res.status(400).json({ 
        error: `Invalid model. Allowed models: ${ALLOWED_MODELS.join(', ')}` 
      });
    }
    
    // Validate input_type
    if (!ALLOWED_INPUT_TYPES.includes(input_type)) {
      logRequest(req, 400, Date.now() - startTime);
      return res.status(400).json({ 
        error: `Invalid input_type. Allowed types: ${ALLOWED_INPUT_TYPES.join(', ')}` 
      });
    }

    // Get API key from environment variable
    const apiKey = process.env.VOYAGE_API_KEY;
    if (!apiKey) {
      logRequest(req, 500, Date.now() - startTime);
      return res.status(500).json({ error: 'API key not configured' });
    }

    // Call Voyage AI API
    const response = await axios.post('https://api.voyageai.com/v1/embeddings', {
      input: inputArray,
      model: model,
      input_type: input_type
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30 second timeout
    });

    // Return the embeddings
    const result = {
      embeddings: response.data.data.map(item => item.embedding),
      model: response.data.model,
      usage: response.data.usage
    };
    
    logRequest(req, 200, Date.now() - startTime);
    res.status(200).json(result);

  } catch (error) {
    const duration = Date.now() - startTime;
    
    if (error.response) {
      // Voyage AI API error
      const status = error.response.status;
      let errorMessage = 'Failed to generate embeddings';
      
      if (status === 429) {
        errorMessage = 'Rate limit exceeded on Voyage AI service';
        logRequest(req, 429, duration, error);
        return res.status(429).json({ error: errorMessage });
      } else if (status === 401) {
        errorMessage = 'Authentication failed with Voyage AI';
        logRequest(req, 500, duration, error);
        return res.status(500).json({ error: errorMessage });
      } else if (status === 400) {
        errorMessage = 'Invalid request to Voyage AI';
        logRequest(req, 400, duration, error);
        return res.status(400).json({ 
          error: errorMessage,
          details: error.response.data?.error || 'Bad request'
        });
      }
      
      logRequest(req, 502, duration, error);
      return res.status(502).json({ 
        error: 'External service error',
        details: process.env.NODE_ENV === 'development' ? error.response.data : undefined
      });
    } else if (error.request) {
      // Network error
      logRequest(req, 503, duration, error);
      return res.status(503).json({ error: 'Service temporarily unavailable' });
    } else if (error.code === 'ECONNABORTED') {
      // Timeout error
      logRequest(req, 504, duration, error);
      return res.status(504).json({ error: 'Request timeout' });
    }
    
    // Generic error
    console.error('Unexpected error:', error);
    logRequest(req, 500, duration, error);
    return res.status(500).json({ error: 'An unexpected error occurred' });
  }
};