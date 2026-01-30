import { NextRequest, NextResponse } from 'next/server';
import { forks } from '@forks/db';

/**
 * GET /api/forks/[id] - Get a specific fork
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const fork = await forks.findById(id);

    if (!fork) {
      return NextResponse.json({ error: 'Fork not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: fork.id,
      alternateSelfName: fork.alternateSelfName,
      alternateSelfSummary: fork.alternateSelfSummary,
      status: fork.status,
      messageCount: fork.messageCount,
      lastMessageAt: fork.lastMessageAt,
      createdAt: fork.createdAt,
      forkDescription: fork.forkDescription,
    });
  } catch (error) {
    console.error('Failed to get fork:', error);
    return NextResponse.json({ error: 'Failed to get fork' }, { status: 500 });
  }
}

/**
 * DELETE /api/forks/[id] - Archive a fork
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await forks.archive(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to archive fork:', error);
    return NextResponse.json({ error: 'Failed to archive fork' }, { status: 500 });
  }
}
