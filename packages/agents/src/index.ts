// Context Engineering Pipeline
export { createPersona, type PersonaCreationResult } from './pipeline';

// Individual agents (for advanced usage)
export { runInterviewAgent } from './interview/agent';
export { runResearchAgent } from './research/agent';
export { runArchitectAgent, generateInitialGreeting } from './architect/agent';

// Context Engineering utilities (research-backed)
export {
  BIG_FIVE_TRAITS,
  TRAIT_INTENSITY_QUALIFIERS,
  DRIFT_PREVENTION_TECHNIQUES,
  M2HER_ROLE_STRATEGY,
  EXTRAVERSION_CALIBRATION,
  EMOTIONAL_BALANCE_TEMPLATE,
  generatePersonalityDescription,
  generateFewShotExamples,
  generateTemporalAnchors,
  generateOptimizedPersonaPrompt,
  generateUserSystemContext,
} from './context-engineering';

// OpenRouter client
export { chat, complete, extractJson, MODELS } from './openrouter';

// Schemas
export {
  InterviewOutputSchema,
  ResearchOutputSchema,
  PersonaOutputSchema,
} from '@forks/shared';

// Types
export type {
  InterviewOutput,
  ResearchOutput,
  PersonaOutput,
  ForkType,
  BigFiveProfile,
  TemporalAnchor,
  PsychologicalArchetype,
  PipelineProgress,
  PipelineStage,
} from '@forks/shared';
