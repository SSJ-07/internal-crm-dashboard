# Google Gemini AI Integration Setup

## Step 1: Get Your API Key

1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Sign in with your Google account
3. Click "Get API Key" 
4. Create a new API key
5. Copy the API key (starts with `AIza...`)

## Step 2: Configure Environment Variables

1. Open `.env.local` in your project root
2. Replace `your_api_key_here` with your actual API key:

```
GOOGLE_GEMINI_API_KEY=AIzaSyC...your_actual_key_here
```

## Step 3: Test the Integration

1. Start your development server: `npm run dev`
2. Go to any student profile page
3. Click "Generate Summary" in the AI Summary card
4. The AI will analyze the student data and provide intelligent insights

## Features

- **Real AI Analysis**: Uses Google Gemini to provide intelligent, contextual summaries
- **Comprehensive Data**: Analyzes profile, communications, interactions, and notes
- **Actionable Insights**: Provides specific recommendations based on student status and engagement
- **Free Usage**: Google Gemini offers generous free tier limits

## Troubleshooting

- **"API key not configured"**: Make sure your `.env.local` file has the correct API key
- **"Failed to generate summary"**: Check your internet connection and API key validity
- **Rate limits**: Google Gemini has generous free limits, but very high usage might hit limits

## Cost

- **Free Tier**: 15 requests per minute, 1 million tokens per day
- **Paid Tier**: $0.00075 per 1K input tokens, $0.003 per 1K output tokens
- For typical usage, you'll stay well within the free tier limits
