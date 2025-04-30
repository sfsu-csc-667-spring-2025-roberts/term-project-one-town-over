import dotenv from 'dotenv';
dotenv.config(); 

import pgPromise from 'pg-promise';

const pgp = pgPromise();


if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set in environment variables");
}

const connection = pgp(process.env.DATABASE_URL);

export default connection;