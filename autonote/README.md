# AutoDictate (Expo + React Native)

AI-powered voice notes with live recording, Speechmatics transcription (word timestamps), Gemini summaries, interactive timeline playback, and local edits saved to AsyncStorage.

*Customized for academic use with Study Dark theme*

## Quick start

1. Install dependencies (will refresh `package-lock.json`):
   ```bash
   npm install
   ```
2. Create your environment file:
   ```bash
   cp .env.example .env
   # add your keys for SPEECHMATICS_API_KEY and GEMINI_API_KEY
   ```
3. Run the app:
   ```bash
   npx expo start
   ```

## Project structure
```
app/                   # expo-router screens
src/
  api/                 # Speechmatics + Gemini clients
  audio/               # recorder/player helpers
  components/          # UI building blocks (glass cards, timeline, etc.)
  context/             # Notes provider (AsyncStorage-backed)
  hooks/               # audio player/recorder hooks
  screens/             # Record, Processing, Notes list, Note detail
  services/            # storage helpers
  styles/              # theme + design tokens
  utils/               # time + timeline helpers
```

## Features
- **Record** with a glowing circular button (expo-audio).  
- **Processing** pipeline: upload to Speechmatics, poll transcription, then summarize with Gemini (summary, key points, action items, timed keywords).  
- **Notes list** with date/duration/preview and quick navigation.  
- **Note detail**: audio player + seek bar, editable summary/key points/action items/notes, word-timeline blocks that jump playback on tap.  
- **Storage**: AsyncStorage persistence with id, audioUri, duration, date, transcript, summary, notes, timeline, timedKeywords.  
- **Design**: glassmorphism cards, neon accent gradients, dark background, subtle animations.

## Environment
Uses `react-native-dotenv` (`@env`) via `babel.config.js`. Keys required:
```
SPEECHMATICS_API_KEY=...
GEMINI_API_KEY=...
```

## Dependencies to install
`expo-audio`, `expo-blur`, `expo-linear-gradient`, `@react-native-async-storage/async-storage`, `react-native-dotenv` (plus existing Expo/React Navigation stack). Use `npm install` or `npx expo install` to align versions with SDK 54.

## Notes
- Timeline uses Speechmatics word timestamps to drive seeking and keyword chips.  
- All edits save locally; you can clear data by deleting the AsyncStorage key `@autodictate/notes`.  
- The `.env` file is ignored by git—keep your keys private.
