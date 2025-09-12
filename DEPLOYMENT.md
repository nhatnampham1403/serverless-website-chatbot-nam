# Vercel Deployment Guide

This project has been restructured to run as Vercel serverless functions.

## Project Structure

```
├── api/
│   ├── lib/
│   │   └── supabase.js          # Shared database utilities
│   ├── chat.js                  # POST /api/chat
│   ├── sessions.js              # GET /api/sessions
│   ├── health.js                # GET /api/health
│   ├── debug/
│   │   └── lead-analysis.js     # GET /api/debug/lead-analysis
│   └── conversation/
│       └── [sessionId]/
│           ├── index.js         # GET/DELETE /api/conversation/[sessionId]
│           └── analyze-lead.js  # POST /api/conversation/[sessionId]/analyze-lead
├── vercel.json                  # Vercel configuration
├── package.json                 # Dependencies
└── .vercelignore               # Files to ignore during deployment
```

## Environment Variables

Set these in your Vercel dashboard:

- `OPENAI_API_KEY` - Your OpenAI API key
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key

## Deployment Steps

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy the project**:
   ```bash
   vercel
   ```

4. **Set environment variables**:
   ```bash
   vercel env add OPENAI_API_KEY
   vercel env add SUPABASE_URL
   vercel env add SUPABASE_SERVICE_ROLE_KEY
   ```

5. **Redeploy with environment variables**:
   ```bash
   vercel --prod
   ```

## API Endpoints

- `POST /api/chat` - Send a message to the chatbot
- `GET /api/sessions` - Get all conversations
- `GET /api/conversation/[sessionId]` - Get specific conversation
- `DELETE /api/conversation/[sessionId]` - Delete conversation
- `POST /api/conversation/[sessionId]/analyze-lead` - Analyze lead
- `GET /api/health` - Health check
- `GET /api/debug/lead-analysis` - Debug lead analysis data

## Local Development

For local development, you can still use the original Express server:

```bash
npm start
```

## Database Setup

Ensure your Supabase database has the `conversations` table with these columns:
- `id` (primary key)
- `conversation_id` (text, unique)
- `messages` (jsonb)
- `created_at` (timestamp)
- `updated_at` (timestamp)
- `lead_analysis` (jsonb)

## Notes

- All API functions are serverless and will scale automatically
- CORS is handled in each function
- Environment variables are securely managed by Vercel
- The original Express server is preserved for local development
