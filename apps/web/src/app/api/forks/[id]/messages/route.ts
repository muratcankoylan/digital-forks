import { NextRequest, NextResponse } from 'next/server';
import { messages } from '@forks/db';

/**
 * GET /api/forks/[id]/messages - Get messages for a fork
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const forkMessages = await messages.getRecentHistory(id, limit);

    return NextResponse.json(
      forkMessages.map((msg) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        createdAt: msg.createdAt,
      }))
    );
  } catch (error) {
    console.error('Failed to get messages:', error);
    return NextResponse.json({ error: 'Failed to get messages' }, { status: 500 });
  }
}
