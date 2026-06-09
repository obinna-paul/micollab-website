const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'micollab.app@gmail.com',
    pass: process.env.EMAIL_PASS || 'vpkb brih clkv wisj',
  },
  connectionTimeout: 5000,
  greetingTimeout: 5000,
  socketTimeout: 5000,
});

exports.sendOTP = async (email, otp) => {
  try {
    const senderEmail = process.env.EMAIL_USER || 'micollab.app@gmail.com';
    const mailOptions = {
      from: `"Micollab" <${senderEmail}>`,
      to: email,
      subject: 'Verify your Micollab account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #7B5CFA; text-align: center;">Welcome to Micollab!</h2>
          <p style="font-size: 16px; color: #333;">Please use the verification code below to verify your email address and complete your registration:</p>
          <div style="background-color: #f4f4f4; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <h1 style="margin: 0; letter-spacing: 5px; color: #1a1a1a;">${otp}</h1>
          </div>
          <p style="font-size: 14px; color: #666; text-align: center;">This code will expire in 15 minutes.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
          <p style="font-size: 12px; color: #999; text-align: center;">If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Email sending failed:', error);
    return false;
  }
};
