// Test script to verify all backend modules and schemas load correctly
try {
  console.log('Testing modules load...');
  require('dotenv').config();
  const mongoose = require('mongoose');
  
  console.log('Loading User model...');
  const User = require('./models/User');
  
  console.log('Loading Profile model...');
  const Profile = require('./models/Profile');

  console.log('Loading Gig model...');
  const Gig = require('./models/Gig');

  console.log('Loading Proposal model...');
  const Proposal = require('./models/Proposal');

  console.log('Loading Message model...');
  const Message = require('./models/Message');

  console.log('Loading Review model...');
  const Review = require('./models/Review');

  console.log('Loading Notification model...');
  const Notification = require('./models/Notification');

  console.log('Loading Transaction model...');
  const Transaction = require('./models/Transaction');

  console.log('Loading Dispute model...');
  const Dispute = require('./models/Dispute');
  
  console.log('Loading Auth middleware...');
  const authMiddleware = require('./middleware/authMiddleware');
  
  console.log('Loading Email service...');
  const emailService = require('./utils/emailService');
  
  console.log('Loading Auth utils...');
  const authUtils = require('./utils/authUtils');
  
  console.log('Loading Passport configuration...');
  const setupPassport = require('./config/passport');

  console.log('Loading Socket server configuration...');
  const setupSocket = require('./config/socket');
  
  console.log('✅ All backend imports completed successfully! No syntax errors.');
} catch (error) {
  console.error('❌ Loading modules failed:', error);
  process.exit(1);
}
