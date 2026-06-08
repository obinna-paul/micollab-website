const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

exports.sendResetPasswordEmail = async (toEmail, resetUrl) => {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn('SMTP Credentials missing. Check console for reset link.');
      console.log('RESET LINK:', resetUrl);
      return;
    }

    const mailOptions = {
      from: `"Micollab" <${process.env.SMTP_USER}>`,
      to: toEmail,
      subject: 'Reset Your Micollab Password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <h2 style="color: #6a5acd;">Reset Your Password</h2>
          <p>We received a request to reset the password for your Micollab account.</p>
          <p>Click the button below to choose a new password:</p>
          <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; margin: 20px 0; background-color: #6a5acd; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">Reset Password</a>
          <p>This link will expire in 1 hour.</p>
          <p>If you did not request a password reset, you can safely ignore this email. Your account is secure.</p>
          <hr style="border: none; border-top: 1px solid #eaeaea; margin: 30px 0;" />
          <p style="font-size: 12px; color: #888;">The Micollab Team</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Reset email sent: %s', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending reset email:', error);
    throw new Error('Failed to send email');
  }
};

exports.sendUnreadMessageEmail = async (toEmail, senderName, previewText, link) => {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return;

    const mailOptions = {
      from: `"Micollab" <${process.env.SMTP_USER}>`,
      to: toEmail,
      subject: `New Message from ${senderName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333; border: 1px solid #eaeaea; border-radius: 12px;">
          <h2 style="color: #7B5CFA;">You have a new message!</h2>
          <p><strong>${senderName}</strong> sent you a message while you were away:</p>
          <div style="padding: 15px; background-color: #f9f9f9; border-left: 4px solid #7B5CFA; font-style: italic; margin: 20px 0;">
            "${previewText}"
          </div>
          <a href="${link}" style="display: inline-block; padding: 12px 24px; background-color: #7B5CFA; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">Reply on Micollab</a>
          <hr style="border: none; border-top: 1px solid #eaeaea; margin: 30px 0;" />
          <p style="font-size: 12px; color: #888;">The Micollab Team</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Unread message email sent: %s', info.messageId);
  } catch (error) {
    console.error('Error sending unread message email:', error);
  }
};

exports.sendNotificationEmail = async (toEmail, title, content, link) => {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return;

    const mailOptions = {
      from: `"Micollab" <${process.env.SMTP_USER}>`,
      to: toEmail,
      subject: `Micollab: ${title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333; border: 1px solid #eaeaea; border-radius: 12px;">
          <h2 style="color: #7B5CFA;">${title}</h2>
          <p style="font-size: 16px; line-height: 1.5;">${content}</p>
          <a href="${link}" style="display: inline-block; padding: 12px 24px; margin: 20px 0; background-color: #7B5CFA; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">View Details</a>
          <hr style="border: none; border-top: 1px solid #eaeaea; margin: 30px 0;" />
          <p style="font-size: 12px; color: #888;">The Micollab Team</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Notification email sent: %s', info.messageId);
  } catch (error) {
    console.error('Error sending notification email:', error);
  }
};
