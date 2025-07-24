# Workshop Embedding API - Setup Instructions

## Current Status

✅ **Completed:**
- Code review and security analysis
- Local testing setup with .env.local
- Deployment to Vercel
- Test scripts created

⚠️ **Next Steps Required:**
- Set environment variables
- Test deployed endpoint
- Add security measures

## Deployment URL

Your API is deployed at: `https://workshop-embedding-qsnarp0e3-michael-lynns-projects.vercel.app/api/embed`

## Required Actions

### 1. Set Environment Variables

You need to set your Voyage AI API key:

```bash
vercel env add VOYAGE_API_KEY production
```

When prompted, enter your Voyage AI API key (format: `voyage-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`)

### 2. Redeploy with Environment Variables

After setting the environment variable:

```bash
vercel --prod
```

### 3. Test the Deployment

Run the comprehensive test:

```bash
node test-deployed.js
```

Or test manually:

```bash
curl -X POST https://workshop-embedding-qsnarp0e3-michael-lynns-projects.vercel.app/api/embed \
  -H "Content-Type: application/json" \
  -d '{
    "text": "MongoDB Atlas Vector Search enables semantic search",
    "model": "voyage-3"
  }'
```

## Security Considerations

### Current Security Status:

✅ **Good:**
- API key stored as environment variable (not in code)
- Error handling prevents API key exposure
- CORS enabled for workshop accessibility

⚠️ **Needs Attention:**
- No rate limiting (could lead to high costs)
- CORS allows all origins (acceptable for workshop)
- No request logging for debugging

### Recommended Improvements

1. **Rate Limiting**: Consider implementing rate limiting to prevent abuse
2. **Request Logging**: Add structured logging for debugging workshop issues
3. **Input Validation**: Enhanced validation for text length and model parameters

## Workshop Readiness Checklist

- [ ] Environment variables set
- [ ] Deployment successful
- [ ] API responds to test requests
- [ ] CORS headers working for web requests
- [ ] Error handling working correctly
- [ ] Performance acceptable for workshop load

## Troubleshooting

### Common Issues:

1. **"Authentication Required" page**: Environment variables not set
   - Solution: Run `vercel env add VOYAGE_API_KEY production`

2. **500 Internal Server Error**: Invalid or missing API key
   - Solution: Verify your Voyage AI API key is correct

3. **Network timeout**: Voyage AI service issues
   - Solution: Check Voyage AI status or try different model

### Getting Help:

- Check Vercel logs: `vercel logs`
- Review function logs in Vercel dashboard
- Test locally first: `vercel dev`

## Next Steps

Once testing is complete, you can:
1. Share the API URL with workshop participants
2. Include usage examples in workshop materials
3. Monitor usage during the workshop
4. Clean up resources after the workshop

## API Documentation for Workshop

**Endpoint:** `POST /api/embed`

**Request:**
```json
{
  "text": "Your text to embed",
  "model": "voyage-3"
}
```

**Response:**
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
- `voyage-3` (default)
- `voyage-3-lite`
- `voyage-finance-2`