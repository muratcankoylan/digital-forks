'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Fork {
  id: string;
  alternateSelfName: string;
  alternateSelfSummary: string;
  status: 'creating' | 'active' | 'archived';
  messageCount: number;
  lastMessageAt: string | null;
  createdAt: string;
}

export default function ForksPage() {
  const [forks, setForks] = useState<Fork[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadForks() {
      try {
        const response = await fetch('/api/forks');
        if (response.ok) {
          setForks(await response.json());
        }
      } catch (error) {
        console.error('Failed to load forks:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadForks();
  }, []);

  const activeForks = forks.filter((f) => f.status === 'active');
  const archivedForks = forks.filter((f) => f.status === 'archived');

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="border-b border-neutral-800 px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold">
            Forks
          </Link>
          <Link
            href="/fork/new"
            className="px-4 py-2 bg-white text-black font-semibold rounded-lg hover:bg-neutral-200 transition-colors text-sm"
          >
            New Fork
          </Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Your Forks</h1>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-neutral-400 animate-pulse-slow">Loading...</p>
          </div>
        ) : forks.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-neutral-400 mb-4">You haven&apos;t created any forks yet.</p>
            <Link
              href="/fork/new"
              className="inline-block px-6 py-3 bg-white text-black font-semibold rounded-lg hover:bg-neutral-200 transition-colors"
            >
              Create Your First Fork
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Active Forks */}
            {activeForks.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold mb-4 text-neutral-400">Active</h2>
                <div className="space-y-3">
                  {activeForks.map((fork) => (
                    <ForkCard key={fork.id} fork={fork} />
                  ))}
                </div>
              </section>
            )}

            {/* Archived Forks */}
            {archivedForks.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold mb-4 text-neutral-400">Archived</h2>
                <div className="space-y-3 opacity-60">
                  {archivedForks.map((fork) => (
                    <ForkCard key={fork.id} fork={fork} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

function ForkCard({ fork }: { fork: Fork }) {
  return (
    <Link
      href={`/fork/${fork.id}`}
      className="block bg-neutral-900 border border-neutral-800 rounded-lg p-4 hover:border-neutral-700 transition-colors"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg truncate">{fork.alternateSelfName || 'Unnamed Fork'}</h3>
          <p className="text-neutral-400 text-sm mt-1 line-clamp-2">
            {fork.alternateSelfSummary || 'No summary available'}
          </p>
        </div>
        <div className="text-right ml-4 flex-shrink-0">
          <p className="text-neutral-500 text-sm">{fork.messageCount} messages</p>
          <p className="text-neutral-600 text-xs mt-1">
            {fork.lastMessageAt
              ? formatRelativeTime(new Date(fork.lastMessageAt))
              : formatRelativeTime(new Date(fork.createdAt))}
          </p>
        </div>
      </div>
    </Link>
  );
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 7) {
    return date.toLocaleDateString();
  }
  if (days > 0) {
    return `${days}d ago`;
  }
  if (hours > 0) {
    return `${hours}h ago`;
  }
  if (minutes > 0) {
    return `${minutes}m ago`;
  }
  return 'Just now';
}
