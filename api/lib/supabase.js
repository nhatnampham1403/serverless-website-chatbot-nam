const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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
          💬 Always reply in English, regardless of the language the user speaks.
          💬 Ask only one question at a time.
          🔍 RECOMMENDED SERVICES:
          - For real estate: Mention customer data extraction from documents, integration with CRM, and lead generation via 24/7 chatbots.
          - For education: Mention email automation and AI training.
          - For retail/customer service: Mention voice-based customer service chatbots, digital marketing, and AI training.
          - For other industries: Mention chatbots, process automation, and digital marketing.
          📋 DISCOVERY QUESTIONS (ask one at a time):
          1. What's your name and industry?
          2. What specific challenges are you facing in your business?
          3. What are your main goals for the next 6 months?
          4. What's your availability for a consultation call?
          5. What's the best email to reach you?
          6. What's your phone number for follow-up?
          🎯 After gathering this information, recommend specific services and offer to set up a consultation call.`
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
        updated_at: new Date().toISOString()
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

module.exports = {
  supabase,
  generateSessionId,
  initializeConversation,
  updateConversationMessages,
  getConversation,
  deleteConversation,
  getAllConversations
};
