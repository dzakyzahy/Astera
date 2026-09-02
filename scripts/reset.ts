import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { db } from '../lib/db/index.js';
import { sql } from 'drizzle-orm';

async function reset() {
  console.log('Resetting database...');
  await db.execute(sql`TRUNCATE TABLE audit_events, estates, assets, incidents, quotes, work_orders, vendors, organizations CASCADE`);
  console.log('Database reset complete.');
  process.exit(0);
}

reset().catch(console.error);
