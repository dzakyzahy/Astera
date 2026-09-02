import { NextResponse } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api-response';
import { runDatabaseSeed } from '@/lib/db/seeder';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export async function POST() {
  try {
    // 1. Reset Database State
    await db.execute(sql`
      TRUNCATE TABLE 
        "audit_events", 
        "outbox_events", 
        "approvals", 
        "work_orders", 
        "quotes", 
        "incidents", 
        "vendors", 
        "assets", 
        "estates", 
        "organizations" 
      CASCADE;
    `);

    // 2. Reseed initial mock data
    await runDatabaseSeed();

    // 3. Return synthetic metadata envelope
    return NextResponse.json(
      apiSuccess({
        success: true,
        message: 'Contest demo state successfully restored to initial seed.',
        resetAt: new Date().toISOString(),
        seededIncidents: 1, // Defined by our seed script
        seededQuotes: 2, // Defined by our seed script
      })
    );
  } catch (error) {
    console.error('Demo reset failed:', error);
    return apiError(
      'Demo Reset Failed',
      error instanceof Error ? error.message : 'Unknown error during reset',
      500
    );
  }
}
