const { getAllConversations } = require('../lib/supabase');

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
    const leadData = conversations.map(conv => ({
      sessionId: conv.conversation_id,
      hasLeadAnalysis: !!conv.lead_analysis,
      leadAnalysis: conv.lead_analysis,
      createdAt: conv.created_at,
      updatedAt: conv.updated_at
    }));
    
    res.json({
      totalConversations: conversations.length,
      conversationsWithLeadAnalysis: leadData.filter(conv => conv.hasLeadAnalysis).length,
      leadData: leadData
    });
  } catch (error) {
    console.error('Error getting lead analysis debug data:', error);
    res.status(500).json({ error: 'Failed to get lead analysis data' });
  }
}
