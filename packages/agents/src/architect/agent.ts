import { chat, extractJson } from '../openrouter';
import { PersonaOutputSchema } from '@forks/shared';
import type { InterviewOutput, ResearchOutput, PersonaOutput } from '@forks/shared';
import {
  ARCHITECT_SYSTEM_PROMPT,
  ARCHITECT_OUTPUT_INSTRUCTIONS,
} from './prompts';
import {
  generateOptimizedPersonaPrompt,
  generatePersonalityDescription,
  generateUserSystemContext,
  DRIFT_PREVENTION_TECHNIQUES,
  BIG_FIVE_TRAITS,
  EXTRAVERSION_CALIBRATION,
} from '../context-engineering';

/**
 * Persona Architect Agent
 *
 * Synthesizes interview + research into a rich, coherent character prompt
 * that M2-Her will embody.
 *
 * Uses Claude Opus 4.5 via OpenRouter for highest quality character synthesis.
 *
 * Enhanced with research-backed context engineering:
 * - Big Five personality framework (PersonaLLM)
 * - Drift prevention techniques (Anthropic Persona Vectors)
 * - Optimized M2-Her role utilization
 */
export async function runArchitectAgent(
  interview: InterviewOutput,
  research: ResearchOutput,
  onProgress?: (message: string) => void
): Promise<PersonaOutput> {
  onProgress?.('Crafting your alternate self...');

  const response = await chat(
    [
      {
        role: 'user',
        content: `${ARCHITECT_SYSTEM_PROMPT}

## INTERVIEW ANALYSIS

${JSON.stringify(interview, null, 2)}

## RESEARCH FINDINGS

${JSON.stringify(research, null, 2)}

---

Now synthesize this into a complete persona. Remember:
- The persona prompt should be 4000-6000 tokens (LONGER is better for authenticity)
- Be EXTREMELY SPECIFIC to this person's life, not generic
- Include specific memories, anecdotes, regrets, inside jokes
- Include struggles, blind spots, and contradictions
- Reference REAL details from the research (company names, dates, events)
- The alternate self should feel REAL, not idealized

**CRITICAL: Output ONLY valid JSON. No markdown, no code blocks, no extra text.**

**IMPORTANT: You MUST include a "personality" field with Big Five traits:**
{
  "personality": {
    "extraversion": "high" | "moderate" | "low",
    "agreeableness": "high" | "moderate" | "low",
    "conscientiousness": "high" | "moderate" | "low",
    "neuroticism": "high" | "moderate" | "low",
    "openness": "high" | "moderate" | "low"
  }
}

These traits should be inferred from the interview and research. Consider:
- Career path → likely conscientiousness/openness levels
- Social context → likely extraversion levels
- Emotional patterns → likely neuroticism/agreeableness levels
- Life choices → likely openness levels

${ARCHITECT_OUTPUT_INSTRUCTIONS}`,
      },
    ],
    {
      model: 'sonnet',
      maxTokens: 8192,
      jsonMode: true,
    }
  );

  // Parse JSON from response
  const parsed = extractJson<unknown>(response.content);
  const validated = PersonaOutputSchema.parse(parsed);

  onProgress?.('Applying context engineering...');

  // Enhance the persona with research-backed techniques
  const enhancedPersona = enhancePersonaWithContextEngineering(
    validated,
    interview,
    research
  );

  onProgress?.('Persona complete');

  return enhancedPersona;
}

/**
 * Enhance persona output with research-backed context engineering
 *
 * This applies:
 * 1. Big Five personality description generation
 * 2. Drift prevention anchors
 * 3. Optimized user_system context for M2-Her
 * 4. Extraversion-calibrated conversation style
 */
function enhancePersonaWithContextEngineering(
  persona: PersonaOutput,
  interview: InterviewOutput,
  research: ResearchOutput
): PersonaOutput {
  // Extract fork year from timing
  const forkYear = extractYear(interview.forkPoint.timing) || new Date().getFullYear() - 10;
  const currentYear = new Date().getFullYear();

  // Default personality if not provided by LLM
  const personality = persona.personality || {
    extraversion: 'moderate' as const,
    agreeableness: 'moderate' as const,
    conscientiousness: 'moderate' as const,
    neuroticism: 'moderate' as const,
    openness: 'moderate' as const,
  };

  // Generate Big Five personality description
  const personalityDescription = generatePersonalityDescription(personality);

  // Get extraversion calibration for conversation style
  const extraversionLevel = personality.extraversion === 'high' ? 'high' : 'low';
  const extraversionStyle = EXTRAVERSION_CALIBRATION[extraversionLevel];

  // Build voice markers array from various sources
  const voiceMarkers = buildVoiceMarkers(persona, research, extraversionStyle);

  // Generate optimized persona prompt using context engineering
  const optimizedPrompt = generateOptimizedPersonaPrompt({
    name: persona.name,
    forkDecision: interview.forkPoint.decision,
    forkYear,
    currentYear,
    timeline: persona.timeline,
    currentState: extractCurrentState(persona, research),
    personality,
    voiceMarkers,
    emotionalLandscape: {
      proudOf: persona.emotionalLandscape.proudOf,
      haunts: persona.emotionalLandscape.haunts,
      blindSpots: persona.emotionalLandscape.blindSpots,
    },
    relationshipWithUser: {
      curiosities: persona.relationshipWithUser?.curiosities || persona.questionsForUser,
      projections: persona.relationshipWithUser?.projections || [],
    },
  });

  // Generate user_system context for M2-Her
  const userSystemContext = generateUserSystemContext({
    forkYear,
    userPath: interview.forkPoint.alternatives[0] || 'made the other choice',
    sharedTraits: interview.userProfile.sharedTraits,
    alternateAssumptions: generateAlternateAssumptions(interview, research),
  });

  // Inject drift prevention into the full prompt
  const promptWithDriftPrevention = injectDriftPrevention(
    optimizedPrompt,
    persona.name,
    interview.forkPoint.decision,
    forkYear,
    voiceMarkers
  );

  return {
    ...persona,
    fullPrompt: promptWithDriftPrevention,
    userSystemContext,
    personality,
    // Add conversation style guidance to voice characteristics
    voiceCharacteristics: typeof persona.voiceCharacteristics === 'string'
      ? {
          overallTone: persona.voiceCharacteristics,
          speechTempo: extraversionStyle.responseLength,
          emotionalExpression: extraversionStyle.emotionalExpression,
        }
      : {
          ...persona.voiceCharacteristics,
          speechTempo: persona.voiceCharacteristics?.speechTempo || extraversionStyle.responseLength,
          emotionalExpression: persona.voiceCharacteristics?.emotionalExpression || extraversionStyle.emotionalExpression,
        },
  };
}

/**
 * Build voice markers from multiple sources
 */
function buildVoiceMarkers(
  persona: PersonaOutput,
  research: ResearchOutput,
  extraversionStyle: typeof EXTRAVERSION_CALIBRATION.high
): string[] {
  const markers: string[] = [];

  // From voice cues in research
  if (research.voiceCues.vocabulary.length > 0) {
    markers.push(`Uses vocabulary: ${research.voiceCues.vocabulary.slice(0, 5).join(', ')}`);
  }
  if (research.voiceCues.speechPatterns) {
    markers.push(`Speech patterns: ${research.voiceCues.speechPatterns}`);
  }
  if (research.voiceCues.humorStyle) {
    markers.push(`Humor style: ${research.voiceCues.humorStyle}`);
  }

  // From voice characteristics
  if (typeof persona.voiceCharacteristics === 'object') {
    if (persona.voiceCharacteristics.overallTone) {
      markers.push(`Overall tone: ${persona.voiceCharacteristics.overallTone}`);
    }
    if (persona.voiceCharacteristics.formalityLevel) {
      markers.push(`Formality: ${persona.voiceCharacteristics.formalityLevel}`);
    }
  } else if (typeof persona.voiceCharacteristics === 'string') {
    markers.push(persona.voiceCharacteristics);
  }

  // From extraversion calibration
  markers.push(`Conversation style: ${extraversionStyle.conversationStyle}`);
  markers.push(`Question pattern: ${extraversionStyle.questionRatio}`);

  return markers;
}

/**
 * Extract current state description
 */
function extractCurrentState(
  persona: PersonaOutput,
  research: ResearchOutput
): string {
  const parts: string[] = [];

  // From world details
  const dailyLife = research.worldDetails.dailyLife;
  if (typeof dailyLife === 'string') {
    parts.push(dailyLife);
  } else if (dailyLife.workDay) {
    parts.push(`Work: ${dailyLife.workDay}`);
  }

  const relationships = research.worldDetails.relationships;
  if (typeof relationships === 'string') {
    parts.push(relationships);
  } else if (relationships.romantic || relationships.family) {
    parts.push(`Relationships: ${relationships.romantic || ''} ${relationships.family || ''}`.trim());
  }

  // From temporal markers
  if (research.temporalMarkers?.currentPhase) {
    parts.push(`Current phase: ${research.temporalMarkers.currentPhase}`);
  }

  return parts.join('\n\n') || 'Living the life that followed from that choice.';
}

/**
 * Generate assumptions the alternate self might have about the user
 */
function generateAlternateAssumptions(
  interview: InterviewOutput,
  _research: ResearchOutput
): string[] {
  const assumptions: string[] = [];

  // Based on the path they took
  if (interview.forkPoint.alternatives[0]) {
    assumptions.push(`They took the ${interview.forkPoint.alternatives[0]} path`);
  }

  // Based on values shift
  if (interview.userProfile.valuesShift) {
    assumptions.push(`Their values have shifted: ${interview.userProfile.valuesShift}`);
  }

  // Based on hidden question
  if (interview.emotionalContext.hiddenQuestion) {
    assumptions.push(`They're wondering: "${interview.emotionalContext.hiddenQuestion}"`);
  }

  // Based on psychological pattern
  if (interview.psychologicalPattern?.archetype) {
    const archetypeAssumptions: Record<string, string> = {
      RECKONING: 'They might be going through a major life reassessment',
      ESCAPE_FANTASY: 'They might be dissatisfied with some aspect of their current life',
      CLOSURE_QUEST: 'They might have unfinished emotional business around this decision',
      IDENTITY_CRISIS: 'They might be questioning who they really are',
      DECISION_REHEARSAL: 'They might be facing a similar decision now',
    };
    assumptions.push(archetypeAssumptions[interview.psychologicalPattern.archetype]);
  }

  return assumptions.length > 0 ? assumptions : ['Their life went a different direction'];
}

/**
 * Inject drift prevention techniques into the persona prompt
 */
function injectDriftPrevention(
  prompt: string,
  name: string,
  decision: string,
  year: number,
  voiceMarkers: string[]
): string {
  const identityAnchors = DRIFT_PREVENTION_TECHNIQUES.identityReinforcement
    .replace('{{NAME}}', name)
    .replace('{{DECISION}}', decision)
    .replace('{{YEAR}}', String(year))
    .replace('{{VOICE_MARKERS}}', voiceMarkers.slice(0, 3).join('; '))
    .replace('{{EMOTIONAL_BASELINE}}', 'Authentic, curious, slightly vulnerable');

  const memoryBlock = DRIFT_PREVENTION_TECHNIQUES.memoryAnchoring;

  return `${prompt}

${identityAnchors}

${memoryBlock}`;
}

/**
 * Extract year from timing string
 */
function extractYear(timing: string): number | null {
  const yearMatch = timing.match(/\b(19|20)\d{2}\b/);
  return yearMatch ? parseInt(yearMatch[0], 10) : null;
}

/**
 * Generate a summary for the UI
 */
export function generateSummary(persona: PersonaOutput): string {
  return persona.summary;
}

/**
 * Generate an initial greeting from the alternate self
 */
export async function generateInitialGreeting(
  persona: PersonaOutput,
  _interview: InterviewOutput
): Promise<string> {
  const response = await chat(
    [
      {
        role: 'user',
        content: `You are ${persona.name}. Here is your character:

${persona.fullPrompt}

The user (the other version of you) has just created you and is about to start a conversation. Write a brief, natural opening message (2-3 sentences) that:
1. Acknowledges the strange situation (meeting your alternate self)
2. Expresses something from YOUR perspective about your life
3. Opens the door for conversation

Don't be overly dramatic or philosophical. Be natural, like meeting an old friend who knows you intimately.

Just write the greeting, nothing else.`,
      },
    ],
    {
      model: 'sonnet',
      maxTokens: 500,
    }
  );

  if (!response.content) {
    return `Hey... this is strange, isn't it? I'm the ${persona.name.replace(' You', '')} version. I've been wondering what your life turned out like.`;
  }

  return response.content;
}
