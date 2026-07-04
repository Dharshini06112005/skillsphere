const express = require('express');
const passport = require('passport');
const authController = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { generateToken } = require('../utils/authUtils');

const router = express.Router();

// Local Auth routes
router.post('/register', authController.register);
router.get('/verify-email/:token', authController.verifyEmail);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password/:token', authController.resetPassword);

// 2FA Routes (Protected)
router.post('/2fa/setup', protect, authController.setup2FA);
router.post('/2fa/verify', protect, authController.verify2FA);
router.post('/2fa/disable', protect, authController.disable2FA);

// 2FA login verification (Public - uses userId and token)
router.post('/2fa/validate', authController.validate2FA);

// Google OAuth routes
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: `${process.env.CLIENT_URL || 'http://localhost:5173'}/login?error=oauth_failed`, session: false }),
  (req, res) => {
    // If auth is successful, passport attaches user to req.user
    if (!req.user) {
      return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/login?error=oauth_failed`);
    }

    // Check if user is suspended
    if (req.user.status === 'suspended') {
      return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/login?error=account_suspended`);
    }

    // Generate JWT token
    const token = generateToken(req.user._id);

    // Redirect to SPA callback page
    res.redirect(
      `${process.env.CLIENT_URL || 'http://localhost:5173'}/oauth-callback?token=${token}&role=${req.user.role}&name=${encodeURIComponent(req.user.name)}&email=${encodeURIComponent(req.user.email)}`
    );
  }
);

module.exports = router;
