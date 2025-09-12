# Website Chatbot NAM

A retro Macintosh-style chatbot interface with OpenAI integration, built with Node.js, Express, and modern web technologies.

## Features

- Classic Macintosh System 7.0 aesthetic
- OpenAI GPT-3.5-turbo integration
- Real-time conversation with AI
- Session-based conversation storage
- Responsive design
- Animated typing indicators
- Retro computing theme
- RESTful API endpoints

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- OpenAI API key
- Supabase account and project

### Installation

1. Clone or download this repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up your environment variables:
   - Open the `.env` file
   - Replace `your_openai_api_key_here` with your actual OpenAI API key
   - Replace `your_supabase_project_url_here` with your Supabase project URL
   - Replace `your_supabase_service_role_key_here` with your Supabase service role key
   - Save the file

4. Start the server:
   ```bash
   npm start
   ```
   
   Or for development with auto-restart:
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:3000`

## API Endpoints

- `POST /api/chat` - Send a message and get AI response
- `GET /api/conversation/:sessionId` - Get conversation history
- `DELETE /api/conversation/:sessionId` - Clear conversation
- `GET /api/sessions` - Get all active sessions
- `GET /api/health` - Health check

## Supabase Database Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. In your Supabase dashboard, go to the SQL Editor
3. Create the conversations table with this SQL:

```sql
CREATE TABLE conversations (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  conversation_id TEXT UNIQUE NOT NULL,
  messages JSONB NOT NULL DEFAULT '[]'::jsonb
);

-- Create an index for faster lookups
CREATE INDEX idx_conversations_conversation_id ON conversations(conversation_id);
```

4. Get your project URL and service role key from Settings > API

## Configuration

The server can be configured using environment variables in the `.env` file:

- `OPENAI_API_KEY` - Your OpenAI API key (required)
- `SUPABASE_URL` - Your Supabase project URL (required)
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (required)
- `PORT` - Server port (default: 3000)

## Conversation Storage

Conversations are stored in Supabase with the following structure:

**Database Table: `conversations`**
- `id` - Auto-incrementing primary key
- `created_at` - Timestamp when conversation was created
- `conversation_id` - Unique session identifier
- `messages` - JSONB array of message objects

**Message Structure:**
```javascript
{
  "role": "system|user|assistant",
  "content": "Message content"
}
```

**Example Database Record:**
```json
{
  "id": 1,
  "created_at": "2024-01-01T00:00:00.000Z",
  "conversation_id": "abc123def456",
  "messages": [
    { "role": "system", "content": "You are a Macintosh assistant..." },
    { "role": "user", "content": "Hello!" },
    { "role": "assistant", "content": "Greetings! How may I assist?" }
  ]
}
```

## Error Handling

The application includes comprehensive error handling for:
- Invalid API keys
- Quota exceeded
- Network errors
- Server errors

## Browser Compatibility

This project works best in modern browsers that support:
- CSS Grid and Flexbox
- ES6 JavaScript features
- CSS animations
- Fetch API

## License

MIT License