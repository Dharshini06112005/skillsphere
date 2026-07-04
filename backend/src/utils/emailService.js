const nodemailer = require('nodemailer');

let transporter = null;

// Initialize mail transporter
const initTransporter = async () => {
  if (transporter) return transporter;

  // Check if SMTP environment variables are defined
  if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    console.log('Using configured SMTP provider...');
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '587', 10),
      secure: process.env.EMAIL_PORT === '465', // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  } else {
    console.log('No SMTP config found. Creating temporary Ethereal Mail account...');
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      console.log(`Ethereal Test Account Created!`);
      console.log(`User: ${testAccount.user}`);
      console.log(`Pass: ${testAccount.pass}`);
    } catch (err) {
      console.error('Failed to create Ethereal Mail account:', err);
      throw err;
    }
  }
  return transporter;
};

/**
 * Send email helper
 * @param {Object} options - Email options
 * @param {string} options.email - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text content
 * @param {string} options.html - HTML content
 */
const sendEmail = async (options) => {
  const mailTransporter = await initTransporter();

  const mailOptions = {
    from: process.env.EMAIL_USER || '"SkillSphere Team" <noreply@skillsphere.com>',
    to: options.email,
    subject: options.subject,
    text: options.text,
    html: options.html,
  };

  const info = await mailTransporter.sendMail(mailOptions);
  console.log(`Message sent: ${info.messageId}`);

  // If using Ethereal mail, log preview URL
  if (!process.env.EMAIL_HOST) {
    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log(`Email Preview URL: ${previewUrl}`);
    return { ...info, previewUrl };
  }

  return info;
};

/**
 * Send verification email
 */
const sendVerificationEmail = async (email, name, token) => {
  const verifyUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/verify-email/${token}`;
  
  const text = `Hi ${name},\n\nPlease verify your email by clicking the link: ${verifyUrl}\n\nThank you,\nSkillSphere Team`;
  const html = `
    <div style="font-family: sans-serif; padding: 20px; color: #111827; background-color: #f9fafb;">
      <h2 style="color: #4f46e5;">Welcome to SkillSphere!</h2>
      <p>Hi ${name},</p>
      <p>Thank you for registering. Please verify your email address to activate your account:</p>
      <p style="margin: 24px 0;">
        <a href="${verifyUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Verify Email</a>
      </p>
      <p>Or copy and paste this link in your browser:</p>
      <p style="word-break: break-all; color: #6b7280;">${verifyUrl}</p>
      <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
      <p style="font-size: 0.875rem; color: #6b7280;">If you did not request this, please ignore this email.</p>
    </div>
  `;

  return await sendEmail({ email, subject: 'SkillSphere - Email Verification', text, html });
};

/**
 * Send password reset email
 */
const sendPasswordResetEmail = async (email, name, token) => {
  const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password/${token}`;
  
  const text = `Hi ${name},\n\nYou requested a password reset. Reset your password by clicking the link: ${resetUrl}\n\nThank you,\nSkillSphere Team`;
  const html = `
    <div style="font-family: sans-serif; padding: 20px; color: #111827; background-color: #f9fafb;">
      <h2 style="color: #4f46e5;">Reset Your Password</h2>
      <p>Hi ${name},</p>
      <p>You requested a password reset. Click the button below to set a new password:</p>
      <p style="margin: 24px 0;">
        <a href="${resetUrl}" style="background-color: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
      </p>
      <p>Or copy and paste this link in your browser:</p>
      <p style="word-break: break-all; color: #6b7280;">${resetUrl}</p>
      <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
      <p style="font-size: 0.875rem; color: #6b7280;">If you did not request a password reset, please ignore this email.</p>
    </div>
  `;

  return await sendEmail({ email, subject: 'SkillSphere - Password Reset', text, html });
};

module.exports = {
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
};
