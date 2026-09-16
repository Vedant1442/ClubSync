const nodemailer = require('nodemailer');

let transporter;

async function setupTransporter() {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    // Use production SMTP
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_PORT == 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Use Ethereal for testing
    console.log('No SMTP credentials found. Generating Ethereal test account...');
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
  }
}

// Initialize on startup (promise)
let initPromise = setupTransporter();

async function sendEmail({ to, subject, text, html }) {
  await initPromise;
  
  if (!transporter) {
    console.error('Transporter not initialized yet.');
    return;
  }
  
  try {
    const info = await transporter.sendMail({
      from: '"ClubSync Admin" <noreply@clubsync.app>',
      to,
      subject,
      text,
      html: html || text,
    });
    
    console.log(`Email sent: ${info.messageId}`);
    // If using ethereal, this logs the preview URL
    if (info.messageId && transporter.options.host === 'smtp.ethereal.email') {
      console.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    }
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

module.exports = { sendEmail };
