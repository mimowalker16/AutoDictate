#!/bin/bash

# ============================================
# AutoDictate Development Setup Script
# ============================================

echo "🚀 Setting up AutoDictate development environment..."

# Navigate to the project directory
cd /c/Users/mouay/Projects/autonote/autonote || {
    echo "❌ Error: Could not navigate to project directory"
    exit 1
}

echo "📦 Installing dependencies..."
npm install

echo "🔧 Checking environment configuration..."
if [ -f ".env" ]; then
    echo "✅ Environment file found"
    echo "📝 Please edit .env file with your API keys"
    echo ""
    echo "🔑 Required API Keys:"
    echo "   1. Speechmatics: https://speechmatics.com (free account)"
    echo "   2. Google Gemini: https://aistudio.google.com (free API key)"
    echo ""
else
    echo "❌ Environment file not found!"
    exit 1
fi

echo "📱 Checking Expo setup..."
npx expo whoami || {
    echo "⚠️  Not logged into Expo. Please run: npx expo login"
    echo "   Or create a free account at: https://expo.dev"
}

echo ""
echo "🎉 Setup complete! Next steps:"
echo ""
echo "1️⃣  Edit the .env file with your API keys"
echo "2️⃣  Login to Expo: npx expo login"
echo "3️⃣  Start development: npm start"
echo ""
echo "📚 For detailed setup guide, see: ../SETUP_FOR_SISTER.md"