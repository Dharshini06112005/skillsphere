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
const isGoogleConfigured = 
  process.env.GOOGLE_CLIENT_ID &&
  process.env.GOOGLE_CLIENT_SECRET &&
  process.env.GOOGLE_CLIENT_ID !== 'your_google_client_id';

router.get(
  '/google',
  (req, res, next) => {
    const role = req.query.role || 'freelancer';
    if (isGoogleConfigured) {
      return passport.authenticate('google', {
        scope: ['profile', 'email'],
        prompt: 'select_account',
        state: role
      })(req, res, next);
    } else {
      console.log(`[Mock Google OAuth] Not configured. Redirecting with role: ${role}`);
      return res.redirect(`/api/auth/google/mock-callback?role=${role}`);
    }
  }
);

router.get(
  '/google/callback',
  (req, res, next) => {
    const role = req.query.state || 'freelancer';
    if (isGoogleConfigured) {
      return passport.authenticate('google', { failureRedirect: `${process.env.CLIENT_URL || 'http://localhost:5173'}/login?error=oauth_failed`, session: false })(req, res, next);
    } else {
      return res.redirect(`/api/auth/google/mock-callback?role=${role}`);
    }
  },
  (req, res) => {
    if (!req.user) {
      return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/login?error=oauth_failed`);
    }

    if (req.user.status === 'suspended') {
      return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/login?error=account_suspended`);
    }

    const token = generateToken(req.user._id);

    res.redirect(
      `${process.env.CLIENT_URL || 'http://localhost:5173'}/oauth-callback?token=${token}&role=${req.user.role}&name=${encodeURIComponent(req.user.name)}&email=${encodeURIComponent(req.user.email)}`
    );
  }
);

router.get('/google/mock-callback', async (req, res) => {
  try {
    const User = require('../models/User');
    const Profile = require('../models/Profile');

    const role = req.query.role || 'freelancer';
    
    // Simulate different accounts for testing different roles
    const email = role === 'client' ? 'demo.client@skillsphere.local' : 'demo.freelancer@skillsphere.local';
    const name = role === 'client' ? 'Demo Client User' : 'Demo Freelancer User';

    let user = await User.findOne({ email });
    if (!user) {
      const randomPassword = require('crypto').randomBytes(16).toString('hex');
      user = await User.create({
        name,
        email,
        password: randomPassword,
        role: role,
        isEmailVerified: true
      });
      await Profile.create({ user: user._id });
    }

    if (user.status === 'suspended') {
      return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/login?error=account_suspended`);
    }

    const token = generateToken(user._id);

    res.redirect(
      `${process.env.CLIENT_URL || 'http://localhost:5173'}/oauth-callback?token=${token}&role=${user.role}&name=${encodeURIComponent(user.name)}&email=${encodeURIComponent(user.email)}`
    );
  } catch (error) {
    console.error('Mock Google callback error:', error);
    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/login?error=oauth_failed`);
  }
});

module.exports = router;
