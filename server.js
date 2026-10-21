require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const nodemailer = require('nodemailer');
app.set("trust proxy", 1);
const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || '*', // Restrict to your domain in production
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json({ limit: '10kb' }));

// Rate limit: 5 requests per 15 minutes per IP (prevent spam)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many submissions. Try again later.' }
});
app.use('/api/contact', limiter);

// Nodemailer transporter (Gmail SMTP)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,    // your Gmail address
    pass: process.env.EMAIL_PASS     // Gmail App Password (NOT your regular password)
  }
});

// Verify transporter on startup
transporter.verify().then(() => {
  console.log('[MAIL] SMTP connection verified');
}).catch(err => {
  console.error('[MAIL] SMTP verification failed:', err.message);
});

// Contact form endpoint
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    // Validation
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email address.' });
    }

    // Email to YOU (portfolio owner)
    const ownerMail = {
      from: `"Portfolio Contact" <${process.env.EMAIL_USER}>`,
      to: process.env.OWNER_EMAIL || process.env.EMAIL_USER,
      subject: `[Portfolio] New Contact: ${subject}`,
      text: `
New contact form submission:

Name: ${name}
Email: ${email}
Subject: ${subject}

Message:
${message}

---
Sent from your portfolio contact form.
      `,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <hr>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
        <hr>
        <small>Sent from your portfolio contact form.</small>
      `
    };

    // Auto-reply to the visitor (optional)
    const visitorMail = {
      from: `"Portfolio" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Thanks for reaching out, ${name}`,
      text: `
Hi ${name},

Thanks for contacting me. I received your message and will get back to you soon.

Your message:
"${message}"

Best regards,
Portfolio Owner
      `,
      html: `
        <h2>Thanks for reaching out, ${name}</h2>
        <p>I received your message and will get back to you soon.</p>
        <hr>
        <p><strong>Your message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
        <hr>
        <p>Best regards,<br>Portfolio Owner</p>
      `
    };

    await transporter.sendMail(ownerMail);
    await transporter.sendMail(visitorMail);

    res.status(200).json({ success: true, message: 'Message sent successfully.' });
  } catch (err) {
    console.error('[CONTACT] Error:', err);
    res.status(500).json({ error: 'Failed to send message. Try again later.' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'portfolio-contact' });
});

app.listen(PORT, () => {
  console.log(`[SERVER] Running on port ${PORT}`);
});
