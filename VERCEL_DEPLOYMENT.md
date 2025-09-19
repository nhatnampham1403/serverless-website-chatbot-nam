# Vercel Serverless Deployment Guide

This chatbot has been restructured to run as Vercel serverless functions. Here's how to deploy and configure it.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **OpenAI API Key**: Get one from [OpenAI Platform](https://platform.openai.com)
3. **Supabase Project**: Set up at [supabase.com](https://supabase.com)

## Environment Variables

Create a `.env.local` file (for local development) or set these in Vercel dashboard:

```bash
OPENAI_API_KEY=your_openai_api_key_here
SUPABASE_URL=your_supabase_project_url_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
```

## Database Setup

1. Create a Supabase project
2. Create a table called `conversations` with this schema:

```sql
CREATE TABLE conversations (
  id SERIAL PRIMARY KEY,
  conversation_id TEXT UNIQUE NOT NULL,
  messages JSONB NOT NULL DEFAULT '[]',
  lead_analysis JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_conversations_conversation_id ON conversations(conversation_id);
CREATE INDEX idx_conversations_created_at ON conversations(created_at);
```

## Local Development

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env.local
# Edit .env.local with your actual values
```

3. Run locally:
```bash
npm run dev
```

This will start the Vercel development server at `http://localhost:3000`

## Deployment to Vercel

### Option 1: Vercel CLI

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy:
```bash
vercel
```

4. Set environment variables:
```bash
vercel env add OPENAI_API_KEY
vercel env add SUPABASE_URL
vercel env add SUPABASE_SERVICE_ROLE_KEY
```

### Option 2: Vercel Dashboard

1. Connect your GitHub repository to Vercel
2. Set environment variables in the Vercel dashboard
3. Deploy automatically on push to main branch

## API Endpoints

The following serverless functions are available:

- `POST /api/chat` - Send message to chatbot
- `GET /api/conversation/[sessionId]` - Get conversation history
- `DELETE /api/conversation/[sessionId]` - Delete conversation
- `POST /api/conversation/[sessionId]/analyze-lead` - Analyze lead from conversation
- `GET /api/sessions` - Get all sessions
- `GET /api/health` - Health check
- `GET /api/debug/lead-analysis` - Debug lead analysis data

## File Structure

```
├── api/
│   ├── chat.js                    # Main chat endpoint
│   ├── health.js                  # Health check
│   ├── sessions.js                # List all sessions
│   ├── lib/
│   │   └── supabase.js           # Database utilities
│   ├── conversation/
│   │   ├── [sessionId].js        # Get/delete conversation
│   │   └── [sessionId]/
│   │       └── analyze-lead.js   # Lead analysis
│   └── debug/
│       └── lead-analysis.js      # Debug endpoint
├── index.html                     # Main chatbot interface
├── dashboard.html                 # Admin dashboard
├── conversation-view.html         # Conversation viewer
├── script.js                      # Frontend JavaScript
├── styles.css                     # Main styles
├── dashboard-styles.css           # Dashboard styles
├── vercel.json                    # Vercel configuration
└── package.json                   # Dependencies
```

## Key Changes Made

1. **Removed Express server**: The `server.js` file was removed as it conflicts with Vercel serverless
2. **Updated package.json**: Removed Express dependencies, added Vercel CLI
3. **Fixed API routes**: Updated dynamic route handling for Vercel serverless functions
4. **Simplified vercel.json**: Optimized for serverless deployment
5. **Environment variables**: Created `.env.example` for easy setup

## Troubleshooting

### Common Issues

1. **Function timeout**: Increase `maxDuration` in `vercel.json` if needed
2. **CORS errors**: CORS headers are already configured in all API functions
3. **Environment variables**: Make sure all required env vars are set in Vercel dashboard
4. **Database connection**: Verify Supabase URL and service role key are correct

### Debugging

- Check Vercel function logs in the dashboard
- Use the `/api/health` endpoint to verify database connectivity
- Use `/api/debug/lead-analysis` to check lead analysis data

## Performance

- Functions have a 30-second timeout (configurable in `vercel.json`)
- Cold start times are typically 100-500ms
- Database queries are optimized with proper indexing
- OpenAI API calls are made efficiently with appropriate token limits

## Security

- Service role key is used for database operations (server-side only)
- CORS is properly configured
- Input validation is implemented in all endpoints
- No sensitive data is exposed in client-side code
