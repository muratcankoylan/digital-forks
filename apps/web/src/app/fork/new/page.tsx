'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Stage = 'input' | 'processing' | 'review';
type PipelineStage = 'interview' | 'research' | 'architect' | 'complete';

interface Progress {
  stage: PipelineStage;
  status: 'started' | 'completed' | 'error';
  message: string;
}

interface PersonaResult {
  forkId: string;
  name: string;
  summary: string;
  initialGreeting: string;
}

export default function NewForkPage() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>('input');
  const [forkDescription, setForkDescription] = useState('');
  const [progress, setProgress] = useState<Progress | null>(null);
  const [result, setResult] = useState<PersonaResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!forkDescription.trim()) return;

    setStage('processing');
    setError(null);

    try {
      const response = await fetch('/api/forks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ forkDescription }),
      });

      if (!response.ok) {
        throw new Error('Failed to create fork');
      }

      // Handle streaming progress
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim() || !line.startsWith('data: ')) continue;

          const data = line.slice(6).trim();
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);

            if (parsed.type === 'progress') {
              setProgress(parsed.progress);
            } else if (parsed.type === 'result') {
              setResult(parsed.result);
              setStage('review');
            } else if (parsed.type === 'error') {
              throw new Error(parsed.error);
            }
          } catch {
            // Skip malformed JSON
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setStage('input');
    }
  }

  function handleStartConversation() {
    if (result?.forkId) {
      router.push(`/fork/${result.forkId}`);
    }
  }

  return (
    <main className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-neutral-800 px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold">
            Forks
          </Link>
          <Link href="/forks" className="text-neutral-400 hover:text-white">
            Your Forks
          </Link>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          {/* Input Stage */}
          {stage === 'input' && (
            <div className="animate-fade-in">
              <h1 className="text-3xl font-bold mb-2">Create a Fork</h1>
              <p className="text-neutral-400 mb-8">
                Describe a decision you made and the path you didn&apos;t take.
              </p>

              <form onSubmit={handleSubmit}>
                <textarea
                  value={forkDescription}
                  onChange={(e) => setForkDescription(e.target.value)}
                  placeholder="10 years ago, I chose to stay in my hometown instead of moving to Berlin for a startup job. I often wonder what my life would be like if I had taken that leap..."
                  className="w-full h-48 bg-neutral-900 border border-neutral-800 rounded-lg p-4 text-lg resize-none focus:outline-none focus:border-neutral-600"
                  autoFocus
                />

                {error && (
                  <p className="text-red-400 mt-4">{error}</p>
                )}

                <div className="mt-6 flex gap-4">
                  <button
                    type="submit"
                    disabled={!forkDescription.trim()}
                    className="px-6 py-3 bg-white text-black font-semibold rounded-lg hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Create Fork
                  </button>
                  <Link
                    href="/"
                    className="px-6 py-3 border border-neutral-700 rounded-lg hover:bg-neutral-900 transition-colors"
                  >
                    Cancel
                  </Link>
                </div>
              </form>

              {/* Examples */}
              <div className="mt-12">
                <p className="text-neutral-500 text-sm mb-3">Try these:</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    'I chose tech over medical school',
                    'I stayed instead of moving abroad',
                    'I ended the relationship',
                    'I didn\'t start that business',
                  ].map((example) => (
                    <button
                      key={example}
                      onClick={() => setForkDescription(example)}
                      className="px-3 py-1 bg-neutral-900 border border-neutral-800 rounded-full text-sm text-neutral-400 hover:text-white hover:border-neutral-700 transition-colors"
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Processing Stage */}
          {stage === 'processing' && (
            <div className="animate-fade-in text-center">
              <h1 className="text-3xl font-bold mb-8">Creating Your Alternate Self</h1>

              <div className="space-y-4 max-w-md mx-auto">
                <PipelineStep
                  label="Understanding your fork"
                  status={getStepStatus('interview', progress)}
                />
                <PipelineStep
                  label="Researching the timeline"
                  status={getStepStatus('research', progress)}
                />
                <PipelineStep
                  label="Crafting the persona"
                  status={getStepStatus('architect', progress)}
                />
              </div>

              {progress && (
                <p className="text-neutral-400 mt-8 animate-pulse-slow">
                  {progress.message}
                </p>
              )}
            </div>
          )}

          {/* Review Stage */}
          {stage === 'review' && result && (
            <div className="animate-fade-in">
              <h1 className="text-3xl font-bold mb-2">Meet {result.name}</h1>
              <p className="text-neutral-400 mb-8">{result.summary}</p>

              <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 mb-8">
                <p className="text-neutral-500 text-sm mb-2">Their first words to you:</p>
                <p className="text-lg italic">&quot;{result.initialGreeting}&quot;</p>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleStartConversation}
                  className="px-6 py-3 bg-white text-black font-semibold rounded-lg hover:bg-neutral-200 transition-colors"
                >
                  Start Conversation
                </button>
                <button
                  onClick={() => {
                    setStage('input');
                    setResult(null);
                  }}
                  className="px-6 py-3 border border-neutral-700 rounded-lg hover:bg-neutral-900 transition-colors"
                >
                  Start Over
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function PipelineStep({
  label,
  status,
}: {
  label: string;
  status: 'pending' | 'active' | 'completed';
}) {
  return (
    <div className="flex items-center gap-4">
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
          status === 'completed'
            ? 'bg-emerald-600'
            : status === 'active'
              ? 'bg-blue-600 animate-pulse-slow'
              : 'bg-neutral-800'
        }`}
      >
        {status === 'completed' ? (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : status === 'active' ? (
          <div className="w-3 h-3 bg-white rounded-full" />
        ) : (
          <div className="w-2 h-2 bg-neutral-600 rounded-full" />
        )}
      </div>
      <span className={status === 'pending' ? 'text-neutral-500' : 'text-white'}>
        {label}
      </span>
    </div>
  );
}

function getStepStatus(
  step: PipelineStage,
  progress: Progress | null
): 'pending' | 'active' | 'completed' {
  if (!progress) return step === 'interview' ? 'active' : 'pending';

  const order: PipelineStage[] = ['interview', 'research', 'architect', 'complete'];
  const currentIndex = order.indexOf(progress.stage);
  const stepIndex = order.indexOf(step);

  if (stepIndex < currentIndex) return 'completed';
  if (stepIndex === currentIndex) {
    return progress.status === 'completed' ? 'completed' : 'active';
  }
  return 'pending';
}
