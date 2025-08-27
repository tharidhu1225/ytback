import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { getInfo, downloadMp4, downloadMp3 } from './controllers/mediaController.js';

const app = express();

// Trust proxy for rate limiting behind proxies (like Render)
app.set('trust proxy', 1);

// Middleware
app.use(helmet());
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));
app.use(cors());

// Rate limit for info route (adjust as needed)
const infoLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 mins
  max: 10,
  message: { error: 'Too many requests, slow down.' },
});
app.use('/api/info', infoLimiter);

// Routes
app.get('/api/info', getInfo);
app.get('/api/download/mp4', downloadMp4);
app.get('/api/download/mp3', downloadMp3);

app.get('/', (req, res) => res.json({ status: 'ok' }));

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
