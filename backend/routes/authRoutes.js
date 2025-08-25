const express = require('express');
const {
  loginWithGoogle,
  googleCallback,
  logout
} = require('../controllers/authController');

const router = express.Router();

router.get('/google', loginWithGoogle); 
router.get('/auth/google/callback', googleCallback); 
router.post('/api/logout', logout);
module.exports = router;