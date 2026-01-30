import { chat, extractJson } from '../openrouter';
import { InterviewOutputSchema } from '@forks/shared';
import type { InterviewOutput } from '@forks/shared';
import { INTERVIEW_SYSTEM_PROMPT, INTERVIEW_OUTPUT_INSTRUCTIONS } from './prompts';

/**
 * Interview Agent
 *
 * Extracts emotional context, hidden motivations, and conversation goals
 * from the user's fork description.
 *
 * Uses Claude Opus 4.5 via OpenRouter for highest quality analysis.
 */
export async function runInterviewAgent(
  forkDescription: string,
  onProgress?: (message: string) => void
): Promise<InterviewOutput> {
  onProgress?.('Analyzing your fork description...');

  const response = await chat(
    [
      {
        role: 'user',
        content: `${INTERVIEW_SYSTEM_PROMPT}

${forkDescription}

${INTERVIEW_OUTPUT_INSTRUCTIONS}`,
      },
    ],
    {
      model: 'sonnet',
      maxTokens: 4096,
      jsonMode: true,
    }
  );

  // Parse JSON from response
  const parsed = extractJson<unknown>(response.content);
  const validated = InterviewOutputSchema.parse(parsed);

  onProgress?.('Interview analysis complete');

  return validated;
}

/**
 * Interactive interview mode (for future use)
 * Conducts a back-and-forth interview to gather more context
 */
export async function runInteractiveInterview(
  initialDescription: string,
  onQuestion: (question: string) => Promise<string>,
  onProgress?: (message: string) => void
): Promise<InterviewOutput> {
  // For MVP, we use the single-shot version
  // This can be expanded to do multi-turn interviews
  return runInterviewAgent(initialDescription, onProgress);
}
