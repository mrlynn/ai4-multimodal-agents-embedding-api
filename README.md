# AI4 Multimodal Agents - Embedding API

A serverless API for the MongoDB Multimodal PDF Agent workshop that provides secure access to Voyage AI embeddings and Google Gemini AI without exposing API keys to workshop participants.

## 🚀 Live API

**Production URLs:**
- Embeddings: `https://workshop-embedding-api.vercel.app/api/embed`
- AI Generation: `https://workshop-embedding-api.vercel.app/api/gemini`
- Health Check: `https://workshop-embedding-api.vercel.app/api/health`

## 📋 API Documentation

### Embedding Endpoint

```
POST /api/embed
```

**Request Format:**
```json
{
  "text": "Your text to embed",
  "model": "voyage-3"
}
```

**Response Format:**
```json
{
  "embeddings": [[0.123, -0.456, ...]],
  "model": "voyage-3", 
  "usage": {
    "total_tokens": 15
  }
}
```

**Supported Models:**
- `voyage-3` (default) - Latest high-performance model
- `voyage-3-lite` - Faster, lighter version
- `voyage-finance-2` - Specialized for financial texts

**Rate Limits:** 50 requests per 15 minutes, max 5 per minute

### Gemini AI Endpoint

```
POST /api/gemini
```

**Request Format:**
```json
{
  "contents": [
    {
      "role": "user",
      "parts": [{"text": "Your prompt here"}]
    }
  ],
  "model": "gemini-2.0-flash-exp",
  "generationConfig": {
    "temperature": 0.7,
    "maxOutputTokens": 2048
  },
  "tools": []
}
```

**Response Format:**
```json
{
  "candidates": [
    {
      "content": {
        "parts": [{"text": "AI response here"}],
        "role": "model"
      },
      "finishReason": "STOP"
    }
  ],
  "usageMetadata": {
    "promptTokenCount": 10,
    "candidatesTokenCount": 25,
    "totalTokenCount": 35
  }
}
```

**Rate Limits:** 30 requests per 15 minutes, max 3 per minute

### Health Check Endpoint

```
GET /api/health
```

**Response Format:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-24T10:30:00.000Z",
  "version": "1.1.0",
  "services": {
    "embedding": {
      "available": true,
      "endpoint": "/api/embed",
      "provider": "Voyage AI"
    },
    "ai_generation": {
      "available": true,
      "endpoint": "/api/gemini", 
      "provider": "Google Gemini"
    }
  },
  "features": {
    "rate_limiting": true,
    "cors_enabled": true,
    "function_calling": true
  },
  "uptime": 123.45
}
```

**Status Values:**
- `healthy` - All services operational
- `partial` - Some services unavailable
- `degraded` - No services available
- `unhealthy` - System error

## 🔧 Quick Test

**Test Embedding API:**
```bash
curl -X POST https://workshop-embedding-api.vercel.app/api/embed \
  -H "Content-Type: application/json" \
  -d '{
    "text": "MongoDB Atlas Vector Search enables semantic search",
    "model": "voyage-3"
  }'
```

**Test Gemini API:**
```bash
curl -X POST https://workshop-embedding-api.vercel.app/api/gemini \
  -H "Content-Type: application/json" \
  -d '{
    "contents": [
      {
        "role": "user",
        "parts": [{"text": "Explain vector databases in one sentence"}]
      }
    ]
  }'
```

**Test Health Check:**
```bash
curl https://workshop-embedding-api.vercel.app/api/health
```

## 💻 Local Development

### Prerequisites

- Node.js 18+
- Vercel CLI: `npm i -g vercel`
- Voyage AI API Key: Get from [Voyage AI Dashboard](https://dash.voyageai.com/)

### Setup

1. **Clone and install:**
   ```bash
   git clone https://github.com/mrlynn/ai4-multimodal-agents-embedding-api.git
   cd ai4-multimodal-agents-embedding-api
   npm install
   ```

2. **Configure environment:**
   ```bash
   # Create .env.local
   echo "VOYAGE_API_KEY=your_voyage_api_key_here" > .env.local
   echo "GEMINI_API_KEY=your_gemini_api_key_here" >> .env.local
   ```

3. **Start development server:**
   ```bash
   vercel dev
   ```

4. **Test locally:**
   ```bash
   node test-local.js
   ```

## 🚢 Deployment

### Deploy to Vercel

1. **Login to Vercel:**
   ```bash
   vercel login
   ```

2. **Deploy:**
   ```bash
   vercel --prod
   ```

3. **Set environment variables:**
   ```bash
   vercel env add VOYAGE_API_KEY production
   vercel env add GEMINI_API_KEY production
   # Enter your API keys when prompted
   ```

4. **Test deployment:**
   ```bash
   node test-deployed.js
   ```

## 🛡️ Security Features

- **API Key Protection**: Both Voyage AI and Gemini keys stored securely in environment variables
- **Rate Limiting**: Built-in protection against API abuse
  - Embedding API: 50 requests per 15 minutes, max 5 per minute
  - Gemini API: 30 requests per 15 minutes, max 3 per minute
  - Client identification via IP + User-Agent
- **CORS Enabled**: Allows cross-origin requests for workshop accessibility  
- **Input Validation**: Validates request content and parameters
- **Error Handling**: Sanitized error responses prevent information leakage
- **Rate Limit Headers**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

## 📊 Workshop Usage

### For Workshop Participants

**Using the Embedding API:**
```javascript
const response = await fetch('https://workshop-embedding-api.vercel.app/api/embed', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    text: 'Your document text here',
    model: 'voyage-3'
  })
});

const data = await response.json();
console.log('Embedding:', data.embeddings[0]);
```

**Using the Gemini API:**
```javascript
const response = await fetch('https://workshop-embedding-api.vercel.app/api/gemini', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    contents: [{
      role: 'user',
      parts: [{ text: 'What are vector embeddings?' }]
    }]
  })
});

const data = await response.json();
console.log('AI Response:', data.candidates[0].content.parts[0].text);
```

### For Workshop Organizers

Monitor usage:
- Check Vercel dashboard for function invocations
- Review logs: `vercel logs`
- Monitor API usage in Voyage AI and Google AI Studio dashboards
- Rate limiting automatically protects against abuse

## 🔍 Troubleshooting

### Common Issues

**"Authentication Required" or "API key not configured":**
- Environment variables not set in Vercel
- Solution: `vercel env add VOYAGE_API_KEY production` and `vercel env add GEMINI_API_KEY production`

**"Invalid character in header" error:**
- API key has invisible characters (newlines, carriage returns)
- Solution: Re-enter API key in Vercel dashboard, ensure no extra whitespace

**Network timeout:**
- Voyage AI service issues or large text input
- Solution: Try `voyage-3-lite` model or reduce text length

**Rate limit exceeded:**
- Too many requests from same IP
- Solution: Implement backoff or contact organizers

### Getting Help

1. Check the [Issues](https://github.com/mrlynn/ai4-multimodal-agents-embedding-api/issues) page
2. Review Vercel deployment logs
3. Test locally first: `vercel dev`

## 📁 Project Structure

```
├── api/
│   ├── embed.js              # Voyage AI embedding endpoint
│   ├── gemini.js             # Google Gemini AI endpoint
│   └── health.js             # Health check endpoint
├── lib/
│   └── rateLimiter.js        # Rate limiting middleware
├── test-local.js             # Local testing script
├── test-deployed.js          # Production testing script
├── debug-auth.js             # Authentication debugging
├── .env.local               # Local environment variables
├── .env.example             # Environment template
├── vercel.json              # Vercel configuration
├── package.json             # Dependencies
├── CLAUDE.md                # AI assistant instructions
└── README.md                # This file
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Test locally: `npm test` (if tests exist)
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Voyage AI](https://voyageai.com/) for providing the embedding service
- [Google AI](https://ai.google.dev/) for providing the Gemini API
- [Vercel](https://vercel.com/) for serverless hosting
- MongoDB team for the workshop series

---

**Workshop Series:** AI4 - Multimodal Agents with MongoDB  
**Maintainer:** [@mrlynn](https://github.com/mrlynn)  
**Last Updated:** January 2025