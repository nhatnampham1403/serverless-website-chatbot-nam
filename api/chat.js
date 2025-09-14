const OpenAI = require('openai');
const { 
  generateSessionId, 
  initializeConversation, 
  updateConversationMessages 
} = require('./lib/supabase');

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

module.exports = async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, sessionId } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Generate session ID if not provided
    const currentSessionId = sessionId || generateSessionId();
    
    // Initialize conversation for this session
    const conversation = await initializeConversation(currentSessionId);
    
    // Add user message to conversation
    const updatedMessages = [...conversation.messages, {
      role: "user",
      content: message
    }];
    
    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: updatedMessages,
      max_tokens: 500,
      temperature: 0.7,
    });
    
    const botResponse = completion.choices[0].message.content;
    
    // Add bot response to conversation
    const finalMessages = [...updatedMessages, {
      role: "assistant",
      content: botResponse
    }];
    
    // Update conversation in Supabase
    await updateConversationMessages(currentSessionId, finalMessages);
    
    // Return response with session ID
    res.json({
      response: botResponse,
      sessionId: currentSessionId,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error processing chat message:', error);
    
    // Handle different types of errors
    if (error.code === 'insufficient_quota') {
      return res.status(402).json({ 
        error: 'OpenAI API quota exceeded. Please check your billing.' 
      });
    } else if (error.code === 'invalid_api_key') {
      return res.status(401).json({ 
        error: 'Invalid OpenAI API key. Please check your configuration.' 
      });
    } else if (error.code === 'PGRST116') {
      return res.status(404).json({ 
        error: 'Database connection error. Please check your Supabase configuration.' 
      });
    } else {
      return res.status(500).json({ 
        error: 'Internal server error. Please try again later.' 
      });
    }
  }
}
