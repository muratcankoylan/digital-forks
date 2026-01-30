'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface Message {
  id: string;
  role: 'user' | 'alternate_self';
  content: string;
  createdAt: string;
}

interface Fork {
  id: string;
  alternateSelfName: string;
  alternateSelfSummary: string;
  messageCount: number;
}

export default function ForkConversationPage() {
  const params = useParams();
  const forkId = params.id as string;

  const [fork, setFork] = useState<Fork | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load fork and messages
  useEffect(() => {
    async function loadFork() {
      try {
        const [forkRes, messagesRes] = await Promise.all([
          fetch(`/api/forks/${forkId}`),
          fetch(`/api/forks/${forkId}/messages`),
        ]);

        if (forkRes.ok) {
          setFork(await forkRes.json());
        }

        if (messagesRes.ok) {
          setMessages(await messagesRes.json());
        }
      } catch (error) {
        console.error('Failed to load fork:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadFork();
  }, [forkId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();

    if (!input.trim() || isSending) return;

    const userMessage = input.trim();
    setInput('');
    setIsSending(true);
    setStreamingContent('');

    // Optimistically add user message
    const tempUserMessage: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: userMessage,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMessage]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ forkId, message: userMessage }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      let fullResponse = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        fullResponse += chunk;
        setStreamingContent(fullResponse);
      }

      // Add assistant message
      const assistantMessage: Message = {
        id: `temp-${Date.now()}-assistant`,
        role: 'alternate_self',
        content: fullResponse,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setStreamingContent('');
    } catch (error) {
      console.error('Failed to send message:', error);
      // Remove optimistic message on error
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMessage.id));
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse-slow text-neutral-400">Loading...</div>
      </main>
    );
  }

  if (!fork) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center">
        <p className="text-neutral-400 mb-4">Fork not found</p>
        <Link href="/forks" className="text-blue-400 hover:underline">
          View your forks
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-neutral-800 px-4 py-4 flex-shrink-0">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/forks" className="text-neutral-400 hover:text-white">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="font-semibold">{fork.alternateSelfName}</h1>
              <p className="text-sm text-neutral-500">{fork.messageCount} messages</p>
            </div>
          </div>
          <button className="text-neutral-400 hover:text-white p-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
          {messages.length === 0 && !streamingContent && (
            <div className="text-center py-12">
              <p className="text-neutral-500 mb-4">Start your conversation with {fork.alternateSelfName}</p>
              <p className="text-neutral-600 text-sm max-w-md mx-auto">
                {fork.alternateSelfSummary}
              </p>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 animate-fade-in ${
                message.role === 'user' ? '' : 'flex-row-reverse'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold ${
                  message.role === 'user' ? 'bg-blue-600' : 'bg-emerald-600'
                }`}
              >
                {message.role === 'user' ? 'Y' : fork.alternateSelfName.charAt(0)}
              </div>
              <div
                className={`rounded-lg p-4 max-w-[80%] ${
                  message.role === 'user'
                    ? 'bg-neutral-800'
                    : 'bg-neutral-900 border border-neutral-800'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}

          {/* Streaming response */}
          {streamingContent && (
            <div className="flex gap-3 flex-row-reverse animate-fade-in">
              <div className="w-8 h-8 bg-emerald-600 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold">
                {fork.alternateSelfName.charAt(0)}
              </div>
              <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 max-w-[80%]">
                <p className="whitespace-pre-wrap">{streamingContent}</p>
                <span className="inline-block w-2 h-4 bg-neutral-500 ml-1 animate-pulse" />
              </div>
            </div>
          )}

          {/* Typing indicator */}
          {isSending && !streamingContent && (
            <div className="flex gap-3 flex-row-reverse animate-fade-in">
              <div className="w-8 h-8 bg-emerald-600 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold">
                {fork.alternateSelfName.charAt(0)}
              </div>
              <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-neutral-500 rounded-full typing-dot" />
                  <div className="w-2 h-2 bg-neutral-500 rounded-full typing-dot" />
                  <div className="w-2 h-2 bg-neutral-500 rounded-full typing-dot" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-neutral-800 px-4 py-4 flex-shrink-0">
        <form onSubmit={handleSend} className="max-w-3xl mx-auto">
          <div className="flex gap-3">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              rows={1}
              className="flex-1 bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 resize-none focus:outline-none focus:border-neutral-600"
              disabled={isSending}
            />
            <button
              type="submit"
              disabled={!input.trim() || isSending}
              className="px-4 py-3 bg-white text-black font-semibold rounded-lg hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
