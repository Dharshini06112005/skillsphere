const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const Profile = require('../models/Profile');

const setupPassport = () => {
  // Serialize / Deserialize User for Sessions (if used, although we rely on JWT)
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  });

  // Only configure strategy if client credentials are provided
  if (
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    process.env.GOOGLE_CLIENT_ID !== 'your_google_client_id'
  ) {
    console.log('Google OAuth strategy configured.');
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: process.env.GOOGLE_CALLBACK_URL,
          proxy: true,
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            const email = profile.emails[0].value;
            const name = profile.displayName;

            // 1. Check if user already exists
            let user = await User.findOne({ email });

            if (user) {
              // User exists, return the user
              return done(null, user);
            }

            // 2. User does not exist, create user and profile
            // For OAuth users, we can generate a random password and mark email as verified
            const randomPassword = require('crypto').randomBytes(16).toString('hex');
            
            user = await User.create({
              name,
              email,
              password: randomPassword,
              role: 'freelancer', // Default role; they can change it in profile setup
              isEmailVerified: true, // Google emails are already verified
            });

            // Initialize Profile
            await Profile.create({ user: user._id });

            return done(null, user);
          } catch (error) {
            return done(error, null);
          }
        }
      )
    );
  } else {
    console.warn('Google OAuth is not configured. Google login will be disabled.');
  }
};

module.exports = setupPassport;
