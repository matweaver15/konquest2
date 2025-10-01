# konquest2

Simple Express-based prototype with account creation, login, and a session-protected homepage.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a `.env` file (optional) to override defaults:
   ```bash
   SESSION_SECRET=change-me
   PORT=3000
   ```
3. Start the development server:
   ```bash
   npm start
   ```

The app uses an in-memory user store, so accounts reset whenever the process restarts. Input is validated and sanitized server-side before being stored.
