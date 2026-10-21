require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const nodemailer = require('nodemailer');

const app = express();
const PORT = Number(process.env.PORT) || 3000;

const SMTP_USER = process.env.EMAIL_USER;
const SMTP_PASS = process.env.EMAIL_PASS;
const OWNER_EMAIL = process.env.OWNER_EMAIL || SMTP_USER;

app.set('trust proxy', 1);

app.use(helmet());

const allowedOrigins = [
  'https://vivek-3004.github.io',
  'http://localhost:3000',
  'http://localhost:5173'
];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (!origin || allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
  }
  next();
});

app.options('/api/contact', (req, res) => {
  res.sendStatus(204);
});

app.use(express.json({ limit: '10kb' }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many submissions. Try again later.' }
});

app.use('/api/contact', limiter);

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Gmail SMTP
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

transporter.verify()
  .then(() => console.log('[MAIL] SMTP connection verified'))
  .catch((err) => console.error('[MAIL] SMTP verification failed:', err.message || err));

app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    const trimmedName = String(name).trim();
    const trimmedEmail = String(email).trim();
    const trimmedSubject = String(subject).trim();
    const trimmedMessage = String(message).trim();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({ error: 'Invalid email address.' });
    }

    if (!SMTP_USER || !SMTP_PASS) {
      return res.status(503).json({
        error: 'Email service is not configured.'
      });
    }

    const safeName = escapeHtml(trimmedName);
    const safeEmail = escapeHtml(trimmedEmail);
    const safeSubject = escapeHtml(trimmedSubject);
    const safeMessage = escapeHtml(trimmedMessage);

    const ownerMail = {
      from: `"Portfolio Contact" <${SMTP_USER}>`,
      to: OWNER_EMAIL,
      subject: `[Portfolio] New Contact: ${trimmedSubject}`,
      text: `
New contact form submission:

Name: ${trimmedName}
Email: ${trimmedEmail}
Subject: ${trimmedSubject}

Message:
${trimmedMessage}
      `,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${safeName}</p>
        <p><strong>Email:</strong> ${safeEmail}</p>
        <p><strong>Subject:</strong> ${safeSubject}</p>
        <hr>
        <p><strong>Message:</strong></p>
        <p>${safeMessage.replace(/\n/g, '<br>')}</p>
      `
    };

    const visitorMail = {
      from: `"Portfolio" <${SMTP_USER}>`,
      to: trimmedEmail,
      subject: `Thanks for reaching out, ${trimmedName}`,
      text: `
Hi ${trimmedName},

Thanks for contacting me. I received your message and will get back to you soon.
      `,
      html: `
        <h2>Thanks for reaching out, ${safeName}</h2>
        <p>I received your message and will get back to you soon.</p>
      `
    };

    await transporter.sendMail(ownerMail);
    await transporter.sendMail(visitorMail);

    return res.status(200).json({
      success: true,
      message: 'Message sent successfully.'
    });
  } catch (err) {
    console.error('[CONTACT] Error:', err);
    return res.status(500).json({
      error: 'Failed to send message. Try again later.'
    });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'portfolio-contact' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[SERVER] Running on port ${PORT}`);
});
