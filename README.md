# SeniorCompanion

A health and wellness companion app built for seniors, featuring secure authentication and personalized health tracking.

## Features

- **Secure Authentication**: Face ID/Touch ID biometric authentication with passcode fallback
- **Health Dashboard**: Track daily mood, medications, and exercise activities
- **Memory Timeline**: Capture and organize photos with categories and descriptions
- **Intelligent Chat**: Conversational companion powered by Google's Gemini AI for emotional support and wellness guidance
- **Smart Reminders**: Medication schedules and exercise notifications with flexible timing options

## Gemini AI Integration

This app uses Google's Gemini API to provide personalized, empathetic conversations. The chat feature offers:
- Emotional support and companionship
- Health and wellness guidance
- Memory prompts and conversation starters
- Simple, senior-friendly language

### Setting up Gemini API

1. Get a Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a `.env` file in the project root
3. Add your API key:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```

The chat system includes fallback responses when the API is unavailable, ensuring the app remains functional.

## Security

The app includes comprehensive data protection:
- Biometric authentication (Face ID/Touch ID) when available
- Secure passcode storage using device keychain
- Data encryption until authentication is successful
- Manual logout option from the home screen

## Getting Started

### Run the React Native App
In the root project directory:

```bash
npm install
npm run dev
```

### Run the Backend Server
In the `/server` directory:

```bash
npm install
npm start
```

## Tech Stack

- **Frontend**: React Native with Expo
- **Authentication**: Expo LocalAuthentication
- **Storage**: AsyncStorage for local data persistence
- **AI Integration**: Google Gemini API
- **Backend**: Express.js server
- **Styling**: React Native StyleSheet

## Project Structure

- `/app` - React Native screens and navigation
- `/components` - Reusable UI components
- `/services` - API integrations and business logic
- `/hooks` - Custom React hooks
- `/utils` - Helper functions
- `/server` - Backend Express.js server
