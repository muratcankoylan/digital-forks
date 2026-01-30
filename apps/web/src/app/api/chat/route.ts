import { NextRequest } from 'next/server';
import { createM2HerClient } from '@forks/m2her';
import { forks, messages } from '@forks/db';

/**
 * POST /api/chat - Send a message to the alternate self
 *
 * Streams the response as plain text chunks.
 */
export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();

  try {
    const { forkId, message } = await request.json();

    if (!forkId || !message) {
      return new Response('Missing forkId or message', { status: 400 });
    }

    // Get the fork
    const fork = await forks.findById(forkId);

    if (!fork) {
      return new Response('Fork not found', { status: 404 });
    }

    if (!fork.personaPrompt) {
      return new Response('Fork not ready - no persona', { status: 400 });
    }

    // Get conversation history
    const history = await messages.getRecentHistory(forkId, 50);

    // Create M2-Her client
    const m2her = createM2HerClient();

    // Build messages with alternate self name for better character consistency
    const m2herMessages = m2her.buildForkMessages(
      fork.personaPrompt,
      fork.userContext,
      history.map((m) => ({
        role: m.role as 'user' | 'alternate_self',
        content: m.content,
      })),
      message,
      {
        alternateSelfName: fork.alternateSelfName || undefined,
      }
    );

    // Track timing
    const startTime = Date.now();

    // Stream the response
    const stream = new ReadableStream({
      async start(controller) {
        let fullResponse = '';

        try {
          for await (const chunk of m2her.chatStream(m2herMessages)) {
            fullResponse += chunk;
            controller.enqueue(encoder.encode(chunk));
          }

          const latencyMs = Date.now() - startTime;

          // Save messages to database
          await messages.createPair(forkId, message, fullResponse, {
            platform: 'web',
            latencyMs,
          });
        } catch (error) {
          console.error('Chat error:', error);
          controller.enqueue(
            encoder.encode('\n\n[Error: Failed to generate response]')
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chat error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
