import dotenv from 'dotenv';
dotenv.config(); 

import pgPromise from 'pg-promise';

const pgp = pgPromise();


if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set in environment variables");
}

const db = pgp({
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
});

export default db;