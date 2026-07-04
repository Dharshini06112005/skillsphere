const User = require('../models/User');
const Profile = require('../models/Profile');
const { generateToken, generateRandomToken } = require('../utils/authUtils');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/emailService');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

/**
 * Register User
 */
exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // 1. Validation
    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    if (!['client', 'freelancer'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role selected' });
    }

    // 2. Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    // 3. Generate verification token
    const verificationToken = generateRandomToken();
    const verificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    // 4. Create User
    const user = await User.create({
      name,
      email,
      password,
      role,
      emailVerificationToken: verificationToken,
      emailVerificationExpires: verificationExpires,
    });

    // 5. Initialize Profile for the user
    await Profile.create({ user: user._id });

    // 6. Send verification email (catch errors to prevent server crash if email fails)
    try {
      await sendVerificationEmail(user.email, user.name, verificationToken);
    } catch (mailErr) {
      console.error('Registration email failed to send:', mailErr);
    }

    res.status(201).json({
      success: true,
      message: 'Registration successful! Please check your email to verify your account.',
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Registration failed' });
  }
};

/**
 * Verify Email Address
 */
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired email verification link.',
      });
    }

    // Mark verified and clear verification tokens
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Email verified successfully! You can now log in.',
    });
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({ success: false, message: 'Verification failed' });
  }
};

/**
 * Login User
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    // Fetch user with password selected
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ success: false, message: 'Your account has been suspended' });
    }

    // Check if 2FA is enabled
    if (user.isTwoFactorEnabled) {
      return res.status(200).json({
        success: true,
        twoFactorRequired: true,
        userId: user._id,
        message: 'Two-factor authentication code required.',
      });
    }

    // Generate JWT
    const token = generateToken(user._id);

    // Filter user details response
    const userData = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
    };

    res.status(200).json({
      success: true,
      token,
      user: userData,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Login failed' });
  }
};

/**
 * Forgot Password
 */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide email address' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // For security, don't reveal that the user doesn't exist
      return res.status(200).json({
        success: true,
        message: 'If that email exists in our system, we have sent a reset link.',
      });
    }

    const resetToken = generateRandomToken();
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = Date.now() + 1 * 60 * 60 * 1000; // 1 hour
    await user.save();

    try {
      await sendPasswordResetEmail(user.email, user.name, resetToken);
    } catch (mailErr) {
      console.error('Password reset email failed:', mailErr);
    }

    res.status(200).json({
      success: true,
      message: 'If that email exists in our system, we have sent a reset link.',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, message: 'Forgot password operation failed' });
  }
};

/**
 * Reset Password
 */
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ success: false, message: 'Please provide new password' });
    }

    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Token is invalid or has expired',
      });
    }

    // Set new password (the model pre-save hook will hash it)
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successful! You can now log in with your new password.',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'Password reset failed' });
  }
};

/**
 * Setup 2FA (Generate secret and QR Code)
 */
exports.setup2FA = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Generate secret keys
    const secret = speakeasy.generateSecret({
      name: `SkillSphere:${user.email}`,
    });

    // Save temporary secret to user document
    user.twoFactorTempSecret = secret.base32;
    await user.save();

    // Generate QR Code URL
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    res.status(200).json({
      success: true,
      secret: secret.base32,
      qrCodeUrl,
    });
  } catch (error) {
    console.error('2FA setup error:', error);
    res.status(500).json({ success: false, message: 'Could not set up two-factor authentication' });
  }
};

/**
 * Verify & Enable 2FA
 */
exports.verify2FA = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Please provide authentication token' });
    }

    const user = await User.findById(req.user._id);
    if (!user || !user.twoFactorTempSecret) {
      return res.status(400).json({ success: false, message: '2FA setup has not been initialized' });
    }

    // Verify OTP token against temporary secret
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorTempSecret,
      encoding: 'base32',
      token,
      window: 1, // allow slight clock drift (+/- 30s)
    });

    if (!verified) {
      return res.status(400).json({ success: false, message: 'Invalid two-factor code. Try again.' });
    }

    // Enable 2FA and move temp secret to permanent secret
    user.twoFactorSecret = user.twoFactorTempSecret;
    user.twoFactorTempSecret = undefined;
    user.isTwoFactorEnabled = true;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Two-factor authentication enabled successfully!',
    });
  } catch (error) {
    console.error('2FA verification error:', error);
    res.status(500).json({ success: false, message: 'Verification failed' });
  }
};

/**
 * Disable 2FA
 */
exports.disable2FA = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.twoFactorSecret = undefined;
    user.isTwoFactorEnabled = false;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Two-factor authentication disabled successfully.',
    });
  } catch (error) {
    console.error('Disable 2FA error:', error);
    res.status(500).json({ success: false, message: 'Could not disable two-factor authentication' });
  }
};

/**
 * Validate 2FA OTP during login
 */
exports.validate2FA = async (req, res) => {
  try {
    const { userId, token } = req.body;

    if (!userId || !token) {
      return res.status(400).json({ success: false, message: 'Missing user ID or OTP token' });
    }

    const user = await User.findById(userId);
    if (!user || !user.twoFactorSecret) {
      return res.status(400).json({ success: false, message: 'Two-factor is not configured for this user' });
    }

    // Validate TOTP
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 1,
    });

    if (!verified) {
      return res.status(400).json({ success: false, message: 'Invalid code. Authentication failed.' });
    }

    // Authentication successful, generate JWT
    const jwtToken = generateToken(user._id);

    const userData = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
    };

    res.status(200).json({
      success: true,
      token: jwtToken,
      user: userData,
    });
  } catch (error) {
    console.error('2FA validation error:', error);
    res.status(500).json({ success: false, message: 'Authentication failed during two-factor validation' });
  }
};
