const express = require('express');
const session  = require('express-session');
const cors = require('cors')
//if .env file in the root directory use require('dotenv').config();
require('dotenv').config({ path: __dirname + '/.env' });
const path = require('path');
const app = express();

app.set('trust proxy', 1); // must trust proxy to get cookies / headers
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.static(path.join(__dirname, '../frontend')));

app.use(session({
  secret: process.env.SESSION_SECRET, // secret key for signing the session ID cookie
  resave: false,    // don't save session if unmodified
  saveUninitialized: false, // don't save uninitialized sessions (empty session)
  cookie: {
    secure: process.env.NODE_ENV === 'production', // sending cookies over HTTPS
    sameSite: 'lax', // CSRF protection
    httpOnly: true,     // prevents client-side JS access
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  }
}))

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.use(require('./routes/authRoutes'))

app.get('/api/dashboard', (req, res) => {
  console.log("dashboard",req.session.user);
    if (!req.session.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    const userData = req.session.user;
    const atIndex = userData.email?.indexOf('@');
    if (atIndex > 3) {
    userData.email = userData.email?.slice(0, 3) + "***@gmail.com";
  } else {
    userData.email = "*****@gmail.com";
  }
    userData.id = userData.id?.slice(0,5) + "***"
    res.json({ message: 'Welcome to the dashboard!', user: userData });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log('Server is running on port 3000');
})