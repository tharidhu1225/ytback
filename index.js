import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { config } from './config/config.js';
import { infoLimiter } from './middleware/rateLimit.js';
import mediaRouter from './routes/mediaRouter.js';

const app = express();
app.set('trust proxy', 1);

app.use(helmet());
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (config.corsOrigin.includes('*') || config.corsOrigin.includes(origin)) {
      return cb(null, true);
    }
    return cb(new Error('Not allowed by CORS'));
  }
}));

app.get('/', (_req, res) => res.send('▶ YouTube Downloader API is live'));

app.use('/api/info', infoLimiter);
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api', mediaRouter);

app.use((_req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ error: 'Server error' });
});

const port = config.port || process.env.PORT || 5000;
app.listen(port, () => console.log(`Server running on port ${port}`));
