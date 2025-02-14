# FlowFocus

AI-Powered Deep Work Companion

## Setup

1. Clone the repository
2. Install dependencies:
```bash
npm install
```
3. Set up environment variables:
   - Copy `.env.example` to `.env.local`
   - Get your Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Add your API key to `.env.local`

## Development

Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Features

- 🚀 Task Prioritization with AI
- ⏱️ Focus Mode with Pomodoro Timer
- 📊 Analytics Dashboard
- 🚫 Distraction Blocker

## Security Note

Never commit your `.env.local` file or share your API keys. The `.env.local` file is listed in `.gitignore` and will not be tracked by Git.