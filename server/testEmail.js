require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function testEmail() {
  try {
    console.log("Sending with:", process.env.EMAIL_USER, process.env.EMAIL_PASS);
    const info = await transporter.sendMail({
      from: `"Micollab" <${process.env.EMAIL_USER}>`,
      to: 'swipeupdating@gmail.com',
      subject: 'Test Email',
      text: 'This is a test email to verify credentials.'
    });
    console.log("Email sent successfully: ", info.response);
  } catch (error) {
    console.error("Email error: ", error);
  }
}

testEmail();
