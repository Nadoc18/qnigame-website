const nodemailer = require('nodemailer');

async function test() {
  const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false,
    auth: {
      user: 'b53fb0001@smtp-brevo.com',
      pass: process.env.BREVO_SMTP_PASS || '',
    },
  });

  try {
    await transporter.verify();
    console.log('SMTP connection successful!');
  } catch (err) {
    console.error('SMTP connection failed:', err);
  }
}

test();
