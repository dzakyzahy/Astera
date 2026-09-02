import { type NextRequest, NextResponse } from 'next/server';
import { OutboxService } from '@/lib/services/outbox-service';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const secret = process.env.CRON_SECRET || 'dev-secret';
    
    // Check authorization to prevent unauthorized scraping/processing
    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const outboxService = new OutboxService();
    const result = await outboxService.processQueue();
    
    return NextResponse.json({
      success: true,
      processed: result.processed,
      failed: result.failed,
      message: `Processed ${result.processed} messages. Failed ${result.failed} messages.`
    });
  } catch (error) {
    console.error('Outbox processing failed:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
