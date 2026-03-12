require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');

const threadsRouter            = require('./routes/threads');
const adminRouter              = require('./routes/admin');
const { router: captchaRouter } = require('./routes/captcha');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/threads', threadsRouter);
app.use('/api/admin',   adminRouter);
app.use('/api/captcha', captchaRouter);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => console.log(`Backend: http://localhost:${PORT}`));
