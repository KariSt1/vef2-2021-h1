import dotenv from 'dotenv';
import express from 'express';
import { requireEnv } from './utils/requireEnv.js';
import { router } from './api/index.js';
import { app as userRouter } from './authentication/auth.js';
import { cors } from './utils/cors.js';

dotenv.config();

requireEnv(['DATABASE_URL']); // , 'CLOUDINARY_URL', 'JWT_SECRET']);

const {
  PORT: port = 3000,
  JWT_SECRET: jwtSecret,
  DATABASE_URL: connectionString,
} = process.env;

if (!connectionString || !jwtSecret) {
  console.error('Vantar gögn í env');
  process.exit(1);
}

const app = express();
app.use(express.json());

app.use(cors);

app.use(userRouter);
app.use('/', router);

function notFoundHandler(req, res, next) { // eslint-disable-line
  console.warn('Not found', req.originalUrl);
  res.status(404).json({ error: 'Not found' });
}

function errorHandler(err, req, res, next) { // eslint-disable-line
  console.error(err);

  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Invalid json' });
  }

  return res.status(500).json({ error: 'Internal server error' });
}

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(port, () => {
  console.info(`Server running at http://localhost:${port}/`);
});
