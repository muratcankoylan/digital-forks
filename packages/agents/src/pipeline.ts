import type { InterviewOutput, ResearchOutput, PersonaOutput, ForkType } from '@forks/shared';
import { detectForkType, generateAlternateSelfName } from '@forks/shared';
import { runInterviewAgent } from './interview/agent';
import { runResearchAgent } from './research/agent';
import { runArchitectAgent, generateInitialGreeting } from './architect/agent';

export interface PersonaCreationResult {
  interviewOutput: InterviewOutput;
  researchOutput: ResearchOutput;
  personaOutput: PersonaOutput;
  personaPrompt: string;
  summary: string;
  name: string;
  initialGreeting: string;
}

export interface PipelineProgress {
  stage: 'interview' | 'research' | 'architect' | 'complete';
  status: 'started' | 'completed' | 'error';
  message: string;
  data?: unknown;
}

/**
 * Context Engineering Pipeline
 *
 * Orchestrates the three agents to create a rich, researched persona:
 * 1. Interview Agent - Extracts emotional context and hidden goals
 * 2. Research Agent - Gathers factual grounding
 * 3. Persona Architect - Synthesizes into character prompt
 *
 * @param forkDescription - The user's description of their fork
 * @param onProgress - Optional callback for progress updates
 * @returns Complete persona creation result
 */
export async function createPersona(
  forkDescription: string,
  onProgress?: (progress: PipelineProgress) => void
): Promise<PersonaCreationResult> {
  try {
    // Stage 1: Interview
    onProgress?.({
      stage: 'interview',
      status: 'started',
      message: 'Understanding your fork...',
    });

    const interviewOutput = await runInterviewAgent(forkDescription, (msg) => {
      onProgress?.({
        stage: 'interview',
        status: 'started',
        message: msg,
      });
    });

    onProgress?.({
      stage: 'interview',
      status: 'completed',
      message: 'Interview analysis complete',
      data: interviewOutput,
    });

    // Stage 2: Research
    onProgress?.({
      stage: 'research',
      status: 'started',
      message: 'Researching your alternate timeline...',
    });

    const forkType = detectForkType(interviewOutput);
    const researchOutput = await runResearchAgent(interviewOutput, forkType, (msg) => {
      onProgress?.({
        stage: 'research',
        status: 'started',
        message: msg,
      });
    });

    onProgress?.({
      stage: 'research',
      status: 'completed',
      message: 'Research complete',
      data: researchOutput,
    });

    // Stage 3: Architect
    onProgress?.({
      stage: 'architect',
      status: 'started',
      message: 'Crafting your alternate self...',
    });

    const personaOutput = await runArchitectAgent(interviewOutput, researchOutput, (msg) => {
      onProgress?.({
        stage: 'architect',
        status: 'started',
        message: msg,
      });
    });

    // Generate initial greeting
    const initialGreeting = await generateInitialGreeting(personaOutput, interviewOutput);

    onProgress?.({
      stage: 'architect',
      status: 'completed',
      message: 'Persona complete',
      data: personaOutput,
    });

    onProgress?.({
      stage: 'complete',
      status: 'completed',
      message: 'Your alternate self is ready',
    });

    return {
      interviewOutput,
      researchOutput,
      personaOutput,
      personaPrompt: personaOutput.fullPrompt,
      summary: personaOutput.summary,
      name: personaOutput.name,
      initialGreeting,
    };
  } catch (error) {
    const stage = error instanceof Error && error.message.includes('Interview')
      ? 'interview'
      : error instanceof Error && error.message.includes('Research')
        ? 'research'
        : 'architect';

    onProgress?.({
      stage,
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });

    throw error;
  }
}

/**
 * Quick persona creation (skips research for faster results)
 * Useful for testing or when speed matters more than depth
 */
export async function createPersonaQuick(
  forkDescription: string,
  onProgress?: (progress: PipelineProgress) => void
): Promise<PersonaCreationResult> {
  // Run interview
  onProgress?.({
    stage: 'interview',
    status: 'started',
    message: 'Analyzing your fork...',
  });

  const interviewOutput = await runInterviewAgent(forkDescription);

  onProgress?.({
    stage: 'interview',
    status: 'completed',
    message: 'Analysis complete',
  });

  // Create minimal research output
  const forkType = detectForkType(interviewOutput);
  const researchOutput: ResearchOutput = {
    factualGrounding: {
      timelineEvents: [],
      realisticOutcomes: {},
      statisticalContext: {},
    },
    voiceCues: {
      vocabulary: [],
      speechPatterns: 'Natural, conversational',
      emotionalExpression: 'Open and reflective',
    },
    worldDetails: {
      dailyLife: 'To be discovered through conversation',
      relationships: 'To be discovered through conversation',
      environment: 'To be discovered through conversation',
    },
    authenticityAnchors: [],
  };

  // Run architect
  onProgress?.({
    stage: 'architect',
    status: 'started',
    message: 'Creating persona...',
  });

  const personaOutput = await runArchitectAgent(interviewOutput, researchOutput);
  const initialGreeting = await generateInitialGreeting(personaOutput, interviewOutput);

  onProgress?.({
    stage: 'complete',
    status: 'completed',
    message: 'Ready',
  });

  return {
    interviewOutput,
    researchOutput,
    personaOutput,
    personaPrompt: personaOutput.fullPrompt,
    summary: personaOutput.summary,
    name: personaOutput.name,
    initialGreeting,
  };
}
