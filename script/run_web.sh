#!/bin/bash

# Change to the web directory
cd "$(dirname "$0")/../web"

# Check if .env file exists
if [ ! -f .env ]; then
  echo "Error: .env file not found. Please create a .env file with your OpenAI API key."
  echo "Example: REACT_APP_OPENAI_API_KEY=your_openai_api_key_here"
  exit 1
fi

# Check if node_modules directory exists
if [ ! -d node_modules ]; then
  echo "Installing dependencies..."
  npm install
fi

# Start the web application
echo "Starting VyperSense web application..."
npm start 