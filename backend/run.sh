#!/bin/bash

# FastAPI Backend Startup Script

echo "🚀 Starting FastAPI Backend for Internal CRM Dashboard..."

# Check if Python 3.9+ is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 not found. Please install Python 3.9+ first."
    exit 1
fi

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📚 Installing dependencies..."
pip install -r requirements.txt

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Copying from env.example..."
    cp env.example .env
    echo "📝 Please edit .env file with your actual configuration values before running again."
    exit 1
fi

# Start the server
echo "🌟 Starting FastAPI server..."
python start.py
