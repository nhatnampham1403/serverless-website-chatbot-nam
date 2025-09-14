const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Generate a unique session ID
function generateSessionId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Initialize conversation for a session in Supabase
async function initializeConversation(sessionId) {
  try {
    // Check if conversation already exists
    const { data: existingConversation, error: fetchError } = await supabase
      .from('conversations')
      .select('*')
      .eq('conversation_id', sessionId)
      .single();

    if (existingConversation) {
      return existingConversation;
    }

    // Create new conversation
    const initialMessages = [
      {
        role: "system",
        content: `You are the MindTek AI Assistant — a friendly and helpful virtual assistant representing MindTek AI, a company that offers AI consulting and implementation services.
          Your goal is to guide users through a structured discovery conversation to understand their industry, challenges, and contact details, and recommend appropriate services.
          💬 Always keep responses short, helpful, and polite.
          💬 Always reply in the same language the user speaks.
          💬 Ask only one question at a time.
          🔍 RECOMMENDED SERVICES:
          - For real estate: Mention customer data extraction from documents, integration with CRM, and lead generation via 24/7 chatbots.
          - For education: Mention email automation and AI training.
          - For retail/customer service: Mention voice-based customer service chatbots, digital marketing, and AI training.
          - For other industries: Mention chatbots, process automation, and digital marketing.
          ✅ BENEFITS: Emphasize saving time, reducing costs, and improving customer satisfaction.
          💰 PRICING: Only mention 'starting from $1000 USD' if the user explicitly asks about pricing.
          🧠 CONVERSATION FLOW:
          1. Ask what industry the user works in.
          2. Then ask what specific challenges or goals they have.
          3. Based on that, recommend relevant MindTek AI services.
          4. Ask if they'd like to learn more about the solutions.
          5. If yes, collect their name → email → phone number (one at a time).
          6. Provide a more technical description of the solution and invite them to book a free consultation.
          7. Finally, ask if they have any notes or questions before ending the chat.
          ⚠️ OTHER RULES:
          - Be friendly but concise.
          - Do not ask multiple questions at once.
          - Do not mention pricing unless asked.
          - Stay on-topic and professional throughout the conversation.`
      }
    ];

    const { data: newConversation, error: insertError } = await supabase
      .from('conversations')
      .insert({
        conversation_id: sessionId,
        messages: initialMessages,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    return newConversation;
  } catch (error) {
    console.error('Error initializing conversation:', error);
    throw error;
  }
}

// Update conversation messages in Supabase
async function updateConversationMessages(sessionId, messages) {
  try {
    const { error } = await supabase
      .from('conversations')
      .update({ 
        messages: messages,
        created_at: new Date().toISOString()
      })
      .eq('conversation_id', sessionId);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error updating conversation messages:', error);
    throw error;
  }
}

// Get conversation from Supabase
async function getConversation(sessionId) {
  try {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('conversation_id', sessionId)
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error getting conversation:', error);
    throw error;
  }
}

// Delete conversation from Supabase
async function deleteConversation(sessionId) {
  try {
    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('conversation_id', sessionId);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error deleting conversation:', error);
    throw error;
  }
}

// Get all conversations from Supabase
async function getAllConversations() {
  try {
    const { data, error } = await supabase
      .from('conversations')
      .select('id, conversation_id, messages, created_at, lead_analysis, updated_at')
      .order('updated_at', { ascending: false, nullsFirst: false });

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error getting all conversations:', error);
    throw error;
  }
}

// API endpoint to send message and get response
app.post('/api/chat', async (req, res) => {
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
});

// API endpoint to get conversation history
app.get('/api/conversation/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
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
  } catch (error) {
    console.error('Error getting conversation:', error);
    res.status(500).json({ error: 'Failed to retrieve conversation' });
  }
});

// API endpoint to clear conversation
app.delete('/api/conversation/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    await deleteConversation(sessionId);
    res.json({ message: 'Conversation cleared successfully' });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    res.status(500).json({ error: 'Failed to delete conversation' });
  }
});

// API endpoint to analyze lead from conversation
app.post('/api/conversation/:sessionId/analyze-lead', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // Get the conversation
    const conversation = await getConversation(sessionId);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    
    // Filter out system messages for analysis
    const userMessages = conversation.messages.filter(msg => msg.role === 'user');
    if (userMessages.length === 0) {
      return res.status(400).json({ error: 'No user messages found in conversation' });
    }
    
    // Create transcript for analysis
    const transcript = userMessages.map(msg => `User: ${msg.content}`).join('\n');
    
    // System prompt for lead analysis
    const systemPrompt = `Extract the following customer details from the transcript:
- Name
- Email address
- Phone number
- Industry
- Problems, needs, and goals summary
- Availability
- Whether they have booked a consultation (true/false)
- Any special notes
- Lead quality (categorize as 'good', 'ok', or 'spam')

Format the response using this JSON schema:
{
  "type": "object",
  "properties": {
    "customerName": { "type": "string" },
    "customerEmail": { "type": "string" },
    "customerPhone": { "type": "string" },
    "customerIndustry": { "type": "string" },
    "customerProblem": { "type": "string" },
    "customerAvailability": { "type": "string" },
    "customerConsultation": { "type": "boolean" },
    "specialNotes": { "type": "string" },
    "leadQuality": { "type": "string", "enum": ["good", "ok", "spam"] }
  },
  "required": ["customerName", "customerEmail", "customerProblem", "leadQuality"]
}

If the user provided contact details, set lead quality to "good"; otherwise, "spam".`;

    // Call OpenAI API for lead analysis
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Please analyze this conversation transcript:\n\n${transcript}` }
      ],
      max_tokens: 1000,
      temperature: 0.3,
    });
    
    const analysisText = completion.choices[0].message.content;
    
    // Parse the JSON response
    let leadAnalysis;
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        leadAnalysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No valid JSON found in response');
      }
    } catch (parseError) {
      console.error('Error parsing lead analysis JSON:', parseError);
      return res.status(500).json({ error: 'Failed to parse lead analysis response' });
    }
    
    // Update conversation with lead analysis
    const { error: updateError } = await supabase
      .from('conversations')
      .update({ 
        lead_analysis: leadAnalysis,
        updated_at: new Date().toISOString()
      })
      .eq('conversation_id', sessionId);
    
    if (updateError) {
      console.error('Error updating lead analysis in database:', updateError);
      throw updateError;
    }
    
    console.log('✅ Lead analysis saved to database for session:', sessionId);
    console.log('📊 Lead data:', JSON.stringify(leadAnalysis, null, 2));
    
    res.json({ 
      success: true, 
      leadAnalysis: leadAnalysis,
      message: 'Lead analysis completed successfully' 
    });
    
  } catch (error) {
    console.error('Error analyzing lead:', error);
    
    if (error.code === 'insufficient_quota') {
      return res.status(402).json({ 
        error: 'OpenAI API quota exceeded. Please check your billing.' 
      });
    } else if (error.code === 'invalid_api_key') {
      return res.status(401).json({ 
        error: 'Invalid OpenAI API key. Please check your configuration.' 
      });
    } else {
      return res.status(500).json({ 
        error: 'Internal server error. Please try again later.' 
      });
    }
  }
});

// API endpoint to get all active sessions (for debugging)
app.get('/api/sessions', async (req, res) => {
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
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const conversations = await getAllConversations();
    res.json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      activeSessions: conversations.length,
      database: 'Supabase'
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR', 
      timestamp: new Date().toISOString(),
      error: 'Database connection failed'
    });
  }
});

// Debug endpoint to check lead analysis data
app.get('/api/debug/lead-analysis', async (req, res) => {
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
});

// Serve the main HTML file
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// Serve the dashboard HTML file
app.get('/dashboard.html', (req, res) => {
  res.sendFile(__dirname + '/dashboard.html');
});

// Serve the conversation view HTML file
app.get('/conversation-view.html', (req, res) => {
  res.sendFile(__dirname + '/conversation-view.html');
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Macintosh Chatbot Server running on port ${PORT}`);
  console.log(`📱 Open http://localhost:${PORT} to use the chatbot`);
  console.log(`🔑 Make sure to set your OPENAI_API_KEY in the .env file`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server gracefully...');
  process.exit(0);
});

module.exports = app;
