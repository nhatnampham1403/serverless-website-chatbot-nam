#!/bin/bash

# Macintosh Chatbot Startup Script
echo "🚀 Starting Macintosh Chatbot Server..."
echo ""

# Check if .env file exists and has API key
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "Please create a .env file with your OPENAI_API_KEY"
    exit 1
fi

# Check if API key is set
if grep -q "your_openai_api_key_here" .env; then
    echo "⚠️  Please set your actual OpenAI API key in the .env file"
    echo "Replace 'your_openai_api_key_here' with your real API key"
    exit 1
fi

# Check if Supabase credentials are set
if grep -q "your_supabase_project_url_here" .env; then
    echo "⚠️  Please set your Supabase credentials in the .env file"
    echo "Replace 'your_supabase_project_url_here' with your Supabase project URL"
    echo "Replace 'your_supabase_service_role_key_here' with your Supabase service role key"
    exit 1
fi

echo "✅ Environment configuration looks good"
echo "✅ OpenAI API key configured"
echo "✅ Supabase credentials configured"
echo ""

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

echo "🎯 Starting server on port 3000..."
echo "📱 Open http://localhost:3000 in your browser"
echo ""

# Start the server
npm start
