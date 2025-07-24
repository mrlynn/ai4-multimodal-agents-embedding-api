module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check environment variables
    const voyageApiKey = process.env.VOYAGE_API_KEY;
    const geminiApiKey = process.env.GEMINI_API_KEY;

    const status = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.1.0',
      services: {
        embedding: {
          available: !!voyageApiKey,
          endpoint: '/api/embed',
          provider: 'Voyage AI'
        },
        ai_generation: {
          available: !!geminiApiKey,
          endpoint: '/api/gemini',
          provider: 'Google Gemini'
        }
      },
      features: {
        rate_limiting: true,
        cors_enabled: true,
        function_calling: true
      },
      uptime: process.uptime()
    };

    // Overall health based on at least one service being available
    if (!voyageApiKey && !geminiApiKey) {
      status.status = 'degraded';
      status.message = 'No API keys configured';
    } else if (!voyageApiKey || !geminiApiKey) {
      status.status = 'partial';
      status.message = 'Some services unavailable due to missing API keys';
    }

    res.status(200).json(status);

  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      uptime: process.uptime()
    });
  }
};