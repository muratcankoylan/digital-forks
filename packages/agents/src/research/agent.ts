import { chat, extractJson } from '../openrouter';
import { ResearchOutputSchema } from '@forks/shared';
import type { InterviewOutput, ResearchOutput, ForkType } from '@forks/shared';
import {
  RESEARCH_SYSTEM_PROMPT,
  RESEARCH_TASK_TEMPLATES,
  RESEARCH_OUTPUT_INSTRUCTIONS,
} from './prompts';

/**
 * Research Agent
 *
 * Gathers factual grounding for the alternate timeline using web search.
 * Makes the persona feel realistic rather than fantasy.
 *
 * Uses Claude Opus 4.5 via OpenRouter.
 */
export async function runResearchAgent(
  interview: InterviewOutput,
  forkType: ForkType,
  onProgress?: (message: string) => void
): Promise<ResearchOutput> {
  onProgress?.('Researching your alternate timeline...');

  // Build research task based on fork type
  const researchTask = buildResearchTask(interview, forkType);

  const response = await chat(
    [
      {
        role: 'user',
        content: `${RESEARCH_SYSTEM_PROMPT}

INTERVIEW CONTEXT:
${JSON.stringify(interview, null, 2)}

RESEARCH TASK:
${researchTask}

Based on your knowledge (and imagine you have access to web search), provide detailed, factual grounding for this alternate timeline.

${RESEARCH_OUTPUT_INSTRUCTIONS}`,
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
  const validated = ResearchOutputSchema.parse(parsed);

  onProgress?.('Research complete');

  return validated;
}

/**
 * Build a research task based on interview output and fork type
 */
function buildResearchTask(interview: InterviewOutput, forkType: ForkType): string {
  const { forkPoint } = interview;
  const startYear = extractYear(forkPoint.timing) || new Date().getFullYear() - 10;

  switch (forkType) {
    case 'career':
      return RESEARCH_TASK_TEMPLATES.career
        .replace('{{career}}', forkPoint.alternatives[1] || forkPoint.decision)
        .replace('{{startYear}}', String(startYear));

    case 'relationship':
      return RESEARCH_TASK_TEMPLATES.relationship
        .replace('{{situation}}', forkPoint.decision)
        .replace('{{startYear}}', String(startYear));

    case 'historical':
      return RESEARCH_TASK_TEMPLATES.historical
        .replace('{{figure}}', forkPoint.decision)
        .replace('{{period}}', forkPoint.timing);

    case 'life_decision':
    default:
      return RESEARCH_TASK_TEMPLATES.life_decision
        .replace('{{decision}}', forkPoint.alternatives[1] || forkPoint.decision)
        .replace('{{location}}', extractLocation(forkPoint.decision) || 'unknown')
        .replace('{{startYear}}', String(startYear));
  }
}

/**
 * Extract year from timing string
 */
function extractYear(timing: string): number | null {
  const yearMatch = timing.match(/\b(19|20)\d{2}\b/);
  return yearMatch ? parseInt(yearMatch[0], 10) : null;
}

/**
 * Extract location from decision string
 */
function extractLocation(decision: string): string | null {
  const locationMatch = decision.match(
    /(?:to|in|at)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/
  );
  return locationMatch ? locationMatch[1] : null;
}

/**
 * Research with actual web search (for production)
 * This would integrate with a web search API
 */
export async function runResearchAgentWithSearch(
  interview: InterviewOutput,
  forkType: ForkType,
  onProgress?: (message: string) => void
): Promise<ResearchOutput> {
  // For MVP, we fall back to the non-search version
  // In production, this could use a search API or MCP tool
  return runResearchAgent(interview, forkType, onProgress);
}
