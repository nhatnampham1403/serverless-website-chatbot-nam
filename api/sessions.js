const { getAllConversations } = require('./lib/supabase');

export default async function handler(req, res) {
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

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const conversations = await getAllConversations();
    const sessions = conversations.map(conv => ({
      sessionId: conv.conversation_id,
      messageCount: conv.messages ? conv.messages.length : 0,
      createdAt: conv.created_at,
      updatedAt: conv.updated_at || conv.created_at,
      id: conv.id,
      preview: conv.messages && conv.messages.length > 1 ? 
        conv.messages.find(msg => msg.role === 'user')?.content?.substring(0, 100) + '...' : 
        'No messages yet',
      leadAnalysis: conv.lead_analysis || null
    }));
    
    res.json({ sessions });
  } catch (error) {
    console.error('Error getting sessions:', error);
    res.status(500).json({ error: 'Failed to retrieve sessions' });
  }
}
