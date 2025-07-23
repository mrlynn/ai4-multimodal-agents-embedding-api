# Workshop Embedding API

A serverless API for the MongoDB Multimodal PDF Agent workshop that provides a secure proxy to Voyage AI embeddings.

## Deployment

### Deploy to Vercel

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Clone this directory to a separate repository

3. Set up environment variable:
   ```bash
   vercel env add VOYAGE_API_KEY
   ```

4. Deploy:
   ```bash
   vercel --prod
   ```

### Environment Variables

- `VOYAGE_API_KEY` - Your Voyage AI API key (get one at https://voyageai.com)

## API Usage

### POST /api/embed

Generate embeddings for text.

**Request:**
```json
{
  "text": "Your text here",
  "model": "voyage-3" // optional, defaults to voyage-3
}
```

**Response:**
```json
{
  "embeddings": [[0.1, 0.2, ...]], // 1024-dimensional vectors
  "model": "voyage-3",
  "usage": {
    "total_tokens": 10
  }
}
```

## Security

- API key is stored as environment variable in Vercel
- CORS enabled for all origins (adjust for production)
- No API keys exposed to workshop participants

## Local Development

```bash
npm install
vercel dev
```

Set `VOYAGE_API_KEY` in `.env.local` for local testing.