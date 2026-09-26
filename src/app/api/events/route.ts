import { globalEventBus } from '@/lib/events';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      const sendEvent = (data: string) => {
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
      };

      const unsubscribe = globalEventBus.subscribe(sendEvent);

      // Send initial heartbeat message
      sendEvent(JSON.stringify({ type: 'CONNECTED', message: 'SSE connection established' }));

      // Heartbeat interval to keep connection alive
      const heartbeat = setInterval(() => {
        try {
          sendEvent(JSON.stringify({ type: 'PING', timestamp: new Date().toISOString() }));
        } catch (e) {
          clearInterval(heartbeat);
          unsubscribe();
        }
      }, 15000);

      req.signal.addEventListener('abort', () => {
        clearInterval(heartbeat);
        unsubscribe();
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
