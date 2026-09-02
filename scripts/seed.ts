import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { runDatabaseSeed } from '../lib/db/seeder.js';

async function seed() {
  console.log('Seeding database...');
  try {
    await runDatabaseSeed();
    console.log('Seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

void seed();
