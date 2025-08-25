const qs = require('qs');
const axios = require('axios');
const { OAuth2Client } = require('google-auth-library');
const crypto = require('crypto')
// login with google
// 1 - redirect to google auth page
exports.loginWithGoogle = async (req, res, next) => {
  try {
    const state = crypto.randomBytes(32).toString('hex'); // for csrf protection
    req.session.oauthState = state;

    // Save state in the session of the user, then redirect only after save
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        return res.status(500).json({ message: "Service temporarily unavailable" });
      }
      const url = "https://accounts.google.com/o/oauth2/v2/auth?" +
        qs.stringify({
          client_id: process.env.GOOGLE_CLIENT_ID,
          redirect_uri: process.env.REDIRECT_URI,
          response_type: "code",  // google will send a code to the redirect_uri
          scope: "openid email profile",  // scopes of data we want to access
          access_type: "online", // donot need refresh token
          prompt: "select_account", // user grant permission for the first time
          state: state
        });
      res.redirect(url);
    });
  } catch (error) {
    console.error('OAuth initiation error:', error);
    res.status(500).json({ message: "Service temporarily unavailable" });
  }
};

// 2 - get the code from google and exchange it for tokens
exports.googleCallback = async (req, res, next) => {
  try {
    const { code, state, error } = req.query;

    // Check for OAuth errors
    if (error) {
      console.error('OAuth error from Google:', error);
      return res.status(400).json({ 
        message: "Authentication was cancelled or failed" 
      });
    }
    
    // Validate required parameters
    if (!code) {
      return res.status(400).json({ message: "Authorization code not provided" });
    }
    
    if (!state) {
      return res.status(400).json({ message: "State parameter missing" });
    }
    
    // Verify CSRF state
    // if (state !== req.session.oauthState) {
    //   console.error('CSRF state mismatch:', { 
    //     received: state, 
    //     expected: req.session.oauthState 
    //   });
    //   return res.status(400).json({ message: "Invalid request state" });
    // }

    delete req.session.oauthState;

// 3 - Exchange code for tokens
    const tokenResponse  = await axios.post(
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
      },
    );

    if (tokenResponse.status !== 200) {
      console.error('Token exchange failed:', tokenResponse.status);
      return res.status(500).json({ message: "Authentication service error" });
    }
    
    const { id_token } = tokenResponse.data;
    
    if (!id_token) {
      console.error('No ID token received from Google');
      return res.status(500).json({ message: "Authentication incomplete" });
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
      console.error('ID token verification failed:', error.message);
      return res.status(401).json({ message: "Invalid authentication token" });
    }

      const { 
      email, 
      given_name, 
      family_name, 
      picture, 
      sub, 
      email_verified,
    } = payload;

    if (!email_verified) {
      return res.status(400).json({ 
        message: "Email address must be verified with Google" 
      });
    }
// Regenerate session ID to prevent session fixation
    req.session.regenerate((err) => {
      if (err) {
        console.error('Session regeneration failed:', err);
        return res.status(500).json({ message: "Authentication failed" });
      }

      const userData = {
        firstName: given_name,
        lastName: family_name,
        id: sub,
        email,
      };
      req.session.user = userData;

      req.session.save((err) => {
        if (err) {
          return res.status(500).json({ message: "Session save failed" });
        }
        // redirect to dashboard after session is saved
        console.log(req.session.user);
        res.redirect('/dashboard.html');
      });
    });
  } catch (err) {
    console.error("Error exchanging code", err.response?.data || err.message);
    return res.status(500).send("Authentication failed");
  }
};

exports.logout = (req, res) => {
  try{
    console.log(req.sessionID.user);
    if(!req.session.user) {  // sessionID of incoming request
      console.log('No session found for logout');
      return res.status(400).json({ message: "Logout failed" });
    }
    req.session.destroy((err) => {
      if (err) {
        console.error(`Logout failed : ${err}`)
        return res.status(500).json({ message: "Logout failed" });
      }
      console.log('Session destroyed successfully');
      res.status(200).json({ message: "Logged out successfully" });
    });
  }catch(error){
    console.error(`Logout failed : ${error}`)
    res.status(500).json({ message: "Logout failed" });
  }
};

