Project Feather

A simple learning project demonstrating OAuth login with Express sessions.

⚠️ Disclaimer

This code is provided for educational purposes only. It is not production-ready. For a more robust and secure OAuth implementation, consider using a battle-tested library like Passport.

🚀 Features

Frontend

Login form with two options: Google OAuth (working) and Traditional login (placeholder).

Dashboard page displaying user details after successful Google login.

Backend

Express server with session management (express-session).

Google OAuth redirect and callback handling.

Secure session cookie configuration (HTTP-only, SameSite, secure in production).

Simple logout endpoint.

🛠️ Prerequisites

Node.js and npm

A Google Cloud project with OAuth credentials (Client ID & Client Secret)

📁 Project Structure

project-feather/
├── backend/
│   ├── controllers/
│   │   └── authController.js
│   ├── routes/
│   │   └── authRoutes.js
│   ├── .env                 # Add your environment variables here
│   ├── app.js               # Express server entry point
│   ├── package.json
│   └── package-lock.json
└── frontend/
    ├── index.html           # Login page
    ├── dashboard.html
    ├── style.css
    └── images/
        └── google photo

⚙️ Setup & Run

1. Clone the repo

git clone https://github.com/<your-username>/project-feather.git
cd project-feather

2. Install dependencies

# Backend
cd backend
npm install

3. Configure environment variables

Create a .env file in the backend/ folder with the following:

PORT=3000
SESSION_SECRET=your_session_secret_here
NODE_ENV=development

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

4. Start the server

cd backend
npm start

5. Open the app

Navigate to http://localhost:3000 in your browser.

Click Login with Google and complete the OAuth flow.

After login, you’ll be redirected to the dashboard.

🔐 Security Notes

This implementation uses in-memory session storage. For production, use a persistent store (e.g., Redis).

Always validate and sanitize user data.

Enable HTTPS (secure: true cookie) in production.

Rotate your session secret regularly.

For a secure, full-featured OAuth solution, use Passport.js or similar.

📝 License

MIT © Your Name

