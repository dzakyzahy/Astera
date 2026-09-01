import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { outboxEvents } from '@/lib/db/schema';
import { eq, and, lt } from 'drizzle-orm';

export async function POST(req: Request) {
  // Security check: Only allow authorized cron trigger or internal fetch
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET || 'dev-secret'}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. Fetch PENDING events
    const pendingEvents = await db
      .select()
      .from(outboxEvents)
      .where(and(eq(outboxEvents.status, 'PENDING'), lt(outboxEvents.attempts, 5)))
      .limit(10);

    if (pendingEvents.length === 0) {
      return NextResponse.json({ message: 'No pending events' });
    }

    const processedIds = [];

    // 2. Process events sequentially or in parallel
    for (const event of pendingEvents) {
      try {
        // Mark as PROCESSING
        await db.update(outboxEvents)
          .set({ status: 'PROCESSING', attempts: event.attempts + 1 })
          .where(eq(outboxEvents.id, event.id));

        // Simulate webhook dispatch for vendor.dispatch.webhook
        if (event.eventType === 'vendor.dispatch.webhook') {
          console.log(`[Outbox Worker] Dispatching webhook for event ${event.id}`, event.payload);
          // TODO: Replace with real fetch() to vendor API in commercial release
          await new Promise(resolve => setTimeout(resolve, 500)); 
        }

        // Mark as COMPLETED
        await db.update(outboxEvents)
          .set({ status: 'COMPLETED', processedAt: new Date() })
          .where(eq(outboxEvents.id, event.id));
          
        processedIds.push(event.id);
      } catch (error: any) {
        // Mark as FAILED
        await db.update(outboxEvents)
          .set({ status: 'FAILED', lastError: error.message })
          .where(eq(outboxEvents.id, event.id));
      }
    }

    return NextResponse.json({
      message: 'Processed events successfully',
      processedCount: processedIds.length,
      processedIds
    });
  } catch (error) {
    console.error('Outbox worker error:', error);
    return NextResponse.json({ error: 'Internal worker error' }, { status: 500 });
  }
}
