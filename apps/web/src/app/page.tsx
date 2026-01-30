import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-20">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-neutral-300 to-neutral-500 bg-clip-text text-transparent">
            Meet the you who made the other choice
          </h1>

          <p className="text-xl md:text-2xl text-neutral-400 mb-12 max-w-2xl mx-auto">
            What if you&apos;d taken that job? Moved to that city? Stayed with them?
            <br />
            <span className="text-neutral-300">Talk to your alternate self and find out.</span>
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/fork/new"
              className="px-8 py-4 bg-white text-black font-semibold rounded-lg hover:bg-neutral-200 transition-colors text-lg"
            >
              Create Your First Fork
            </Link>
            <Link
              href="/forks"
              className="px-8 py-4 border border-neutral-700 text-white font-semibold rounded-lg hover:bg-neutral-900 transition-colors text-lg"
            >
              View Your Forks
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 border-t border-neutral-800">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2">Describe Your Fork</h3>
              <p className="text-neutral-400">
                Tell us about a decision you made and the path you didn&apos;t take.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2">We Build Your Other Self</h3>
              <p className="text-neutral-400">
                Our AI researches and creates a detailed, authentic alternate version of you.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2">Have the Conversation</h3>
              <p className="text-neutral-400">
                Ask questions, share perspectives, and explore what might have been.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Example */}
      <section className="py-20 px-4 border-t border-neutral-800 bg-neutral-900/50">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">A Glimpse</h2>

          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 space-y-4">
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold">
                Y
              </div>
              <div className="bg-neutral-800 rounded-lg p-3 max-w-[80%]">
                <p>Do you ever regret becoming a doctor?</p>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <div className="bg-neutral-700 rounded-lg p-3 max-w-[80%]">
                <p className="text-neutral-200">
                  Regret? That&apos;s complicated. I&apos;ve held people&apos;s lives in my hands.
                  I&apos;ve told families their loved ones didn&apos;t make it. That changes you.
                  <br /><br />
                  But I wonder about your path sometimes. You got to build things, create.
                  I just... maintain. Fix what&apos;s broken. Do you ever feel like you&apos;re
                  actually making a difference?
                </p>
              </div>
              <div className="w-8 h-8 bg-emerald-600 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold">
                D
              </div>
            </div>
          </div>

          <p className="text-center text-neutral-500 mt-4 text-sm">
            An actual conversation with &quot;Doctor You&quot;
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-neutral-800 text-center text-neutral-500">
        <p>
          Built with{' '}
          <a href="https://minimax.io" className="text-neutral-400 hover:text-white" target="_blank" rel="noopener noreferrer">
            MiniMax M2-Her
          </a>
          {' '}&{' '}
          <a href="https://openclaw.ai" className="text-neutral-400 hover:text-white" target="_blank" rel="noopener noreferrer">
            OpenClaw
          </a>
        </p>
        <p className="mt-2">Open Source on GitHub</p>
      </footer>
    </main>
  );
}
