// scripts/db-migrate.ts
import dotenv from 'dotenv';
dotenv.config();
import pgmigrate from 'node-pg-migrate';

console.log("DATABASE_URL =", process.env.DATABASE_URL); 

pgmigrate({
  databaseUrl: process.env.DATABASE_URL!,
  dir: 'src/server/db/migrations', // adjust this path as needed
  migrationsTable: 'pgmigrations',
  direction: 'up',
  log: console.log,
});