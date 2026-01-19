import dotenv from 'dotenv';
dotenv.config();

export const CONFIG = {
  PORT: process.env.PORT || 3000,
  // envs will be provided on Render
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/postgres',
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379'
};