const { getConversation, deleteConversation } = require('../lib/supabase');

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

  // Extract sessionId from the URL path
  const sessionId = req.url.split('/').pop();

  if (!sessionId) {
    return res.status(400).json({ error: 'Session ID is required' });
  }

  try {
    if (req.method === 'GET') {
      // Get conversation history
      const conversation = await getConversation(sessionId);
      
      if (!conversation) {
        return res.status(404).json({ error: 'Conversation not found' });
      }
      
      res.json({
        sessionId: conversation.conversation_id,
        messages: conversation.messages,
        createdAt: conversation.created_at,
        id: conversation.id
      });
    } else if (req.method === 'DELETE') {
      // Delete conversation
      await deleteConversation(sessionId);
      res.json({ message: 'Conversation cleared successfully' });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error handling conversation request:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
}
