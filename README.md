# FlowFocus 🌊

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![Next.js](https://img.shields.io/badge/Next.js-15.1.7-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0.0-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7.3-blue)](https://www.typescriptlang.org/)

An AI-powered deep work companion designed to enhance your productivity and focus through intelligent task management and distraction control.

## 🚀 Features

- **Task Prioritization**
  - AI-powered task breakdown
  - PDF task import and analysis using Gemini AI
  - Custom prioritization with subtasks
  - Export tasks to PDF

- **Focus Mode**
  - Pomodoro timer with customizable work/break durations
  - Website and app blocking during focus sessions
  - Distraction management

- **Analytics Dashboard**
  - Focus streak tracking
  - Productivity patterns analysis
  - Personalized improvement tips

- **Calendar Integration**
  - Optional sync with Google Calendar and Outlook
  - Visual schedule management

## 🛠️ Tech Stack

- Next.js 15.1.7
- React 19.0.0
- TypeScript 5.7.3
- Tailwind CSS
- Google Generative AI (Gemini)
- PDF.js for document processing
- Electron for desktop app support

## ⚙️ Prerequisites

- Node.js
- npm
- Google AI API key

## 📦 Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```
3. Set up environment variables:
   - Copy `.env.example` to `.env.local`
   - Add your Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

## 🚀 Development

Run the development server:
```bash
npm run dev
```

For desktop app development:
```bash
npm run electron-dev
```

## 🏗️ Building

For web:
```bash
npm run build
npm start
```

For desktop:
```bash
npm run electron-build
```

## 🔒 Security Note

- Never commit `.env.local` or share API keys
- API keys are stored securely in localStorage
- Environment variables are protected by Next.js

## 📄 License

This project is licensed under the ISC License.