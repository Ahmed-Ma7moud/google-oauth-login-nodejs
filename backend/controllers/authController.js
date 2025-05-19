const qs = require('qs');
const axios = require('axios');
const { OAuth2Client } = require('google-auth-library');

// login with google
// 1 - redirect to google auth page
exports.loginWithGoogle = async (req, res, next) => {
  try {
    const url = "https://accounts.google.com/o/oauth2/v2/auth?" +
      qs.stringify({
        client_id: process.env.GOOGLE_CLIENT_ID,
        redirect_uri: process.env.REDIRECT_URI,
        response_type: "code",  // google will send a code to the redirect_uri
        scope: "openid email profile",  // scopes of data we want to access
        access_type: "online", // donot need refresh token
        prompt: "select_account", // user grant permission for the first time
      });
    res.redirect(url);
  } catch (error) {
    res.status(500).json({ message: `Failed to login with Google: ${error.message}` });
  }
};

// 2 - get the code from google and exchange it for tokens
exports.googleCallback = async (req, res, next) => {
  try {
    const code = req.query.code;
    if (!code) {
      return res.status(400).send(`Missing code: ${req.query.error || 'No code provided'}`);
    }

// 3 - Exchange code for tokens
    const response = await axios.post(
      "https://oauth2.googleapis.com/token",
      qs.stringify({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.REDIRECT_URI,
        grant_type: "authorization_code",
      }),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }
    );

    if (response.status !== 200) {
      return res.status(400).json({ message: "Failed to exchange code for tokens" });
    }
    const { id_token } = response.data;
    if (!id_token) {
      return res.status(400).json({ message: "No id_token received from Google" });
    }

// 4 - Verify id_token
    let payload;
    try {
      const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
      const ticket = await client.verifyIdToken({
        idToken: id_token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch (error) {
      return res.status(400).json({ message: `Error verifying Google ID token: ${error.message}` });
    }

    if (payload) {
      const { email, given_name, family_name, picture, sub, email_verified } = payload;

      req.session.user = {
        firstName: given_name,
        lastName: family_name,
        id: sub,
        email,
      };

// 5 - Ensure session is saved before redirect/response
      req.session.save((err) => {
        if (err) {
          return res.status(500).json({ message: "Session save failed" });
        }
        // You can redirect to dashboard or send JSON 
        console.log(req.session.user);
        res.redirect('/dashboard.html');
      });
    } else {
      return res.status(401).send("Invalid ID Token");
    }
  } catch (err) {
    console.error("Error exchanging code", err.response?.data || err.message);
    return res.status(500).send("Authentication failed");
  }
};

exports.logout = (req, res) => {
  req.session?.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: "Failed to logout" });
    }
    res.clearCookie("connect.sid");
    res.status(200).json({ message: "Logged out successfully" });
  });
};

