import { NextRequest, NextResponse } from 'next/server';
import { createPersona } from '@forks/agents';
import { users, forks } from '@forks/db';

// For demo purposes, use a fixed user ID
// In production, this would come from authentication
const DEMO_USER_ID = 'demo-user';

/**
 * GET /api/forks - List all forks for the current user
 */
export async function GET() {
  try {
    // Get or create demo user
    let user = await users.findByPlatformId(`web:${DEMO_USER_ID}`);
    if (!user) {
      user = await users.create(`web:${DEMO_USER_ID}`);
    }

    const userForks = await forks.findByUserId(user.id);

    return NextResponse.json(
      userForks.map((fork) => ({
        id: fork.id,
        alternateSelfName: fork.alternateSelfName,
        alternateSelfSummary: fork.alternateSelfSummary,
        status: fork.status,
        messageCount: fork.messageCount,
        lastMessageAt: fork.lastMessageAt,
        createdAt: fork.createdAt,
      }))
    );
  } catch (error) {
    console.error('Failed to list forks:', error);
    return NextResponse.json({ error: 'Failed to list forks' }, { status: 500 });
  }
}

/**
 * POST /api/forks - Create a new fork
 *
 * Streams progress updates as SSE, then returns the final result.
 */
export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();

  try {
    const { forkDescription } = await request.json();

    if (!forkDescription || typeof forkDescription !== 'string') {
      return NextResponse.json(
        { error: 'forkDescription is required' },
        { status: 400 }
      );
    }

    // Get or create demo user
    let user = await users.findByPlatformId(`web:${DEMO_USER_ID}`);
    if (!user) {
      user = await users.create(`web:${DEMO_USER_ID}`);
    }

    // Create the fork record first
    const fork = await forks.create({
      userId: user.id,
      forkDescription,
      choiceMade: '', // Will be filled by pipeline
      choiceNotMade: '', // Will be filled by pipeline
    });

    // Create a streaming response
    const stream = new ReadableStream({
      async start(controller) {
        const send = (data: object) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        };

        try {
          // Run the persona creation pipeline with progress updates
          const result = await createPersona(forkDescription, (progress) => {
            send({ type: 'progress', progress });
          });

          // Update the fork with pipeline results
          const updatedFork = await forks.updatePipelineOutputs(fork.id, {
            interviewOutput: result.interviewOutput,
            researchOutput: result.researchOutput,
            personaPrompt: result.personaPrompt,
            alternateSelfName: result.name,
            alternateSelfSummary: result.summary,
          });

          // Send the final result
          send({
            type: 'result',
            result: {
              forkId: updatedFork.id,
              name: result.name,
              summary: result.summary,
              initialGreeting: result.initialGreeting,
            },
          });

          send({ type: 'done' });
        } catch (error) {
          console.error('Pipeline error:', error);
          send({
            type: 'error',
            error: error instanceof Error ? error.message : 'Pipeline failed',
          });

          // Mark fork as failed (or delete it)
          await forks.archive(fork.id);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Failed to create fork:', error);
    return NextResponse.json(
      { error: 'Failed to create fork' },
      { status: 500 }
    );
  }
}
