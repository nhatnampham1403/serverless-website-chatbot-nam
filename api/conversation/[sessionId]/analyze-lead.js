const OpenAI = require('openai');
const { getConversation, supabase } = require('../../lib/supabase');

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

  const { sessionId } = req.query;

  if (!sessionId) {
    return res.status(400).json({ error: 'Session ID is required' });
  }

  try {
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
}
