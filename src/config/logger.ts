import winston from 'winston';
import { env } from './env';

const { combine, timestamp, errors, json, colorize, simple } = winston.format;

// In production (Vercel serverless) the filesystem is read-only — use console only.
// In development, also write to log files.
const logger = winston.createLogger({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    json()
  ),
  defaultMeta: { service: 'smart-ops-api' },
  transports:
    env.NODE_ENV === 'production'
      ? [new winston.transports.Console()]
      : [
          new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
          new winston.transports.File({ filename: 'logs/combined.log' }),
          new winston.transports.Console({ format: combine(colorize(), simple()) }),
        ],
});

export default logger;
