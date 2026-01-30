import { z } from 'zod';

/**
 * Interview Agent Output Schema
 *
 * Enhanced with psychological archetypes and therapeutic guidance.
 * Uses .passthrough() to allow additional fields from research-backed prompts.
 */
export const InterviewOutputSchema = z.object({
  forkPoint: z.object({
    decision: z.string().describe('The specific decision or fork point'),
    timing: z.string().describe('When this decision was made (e.g., "2014, age 22")'),
    alternatives: z.array(z.string()).describe('The different paths available'),
    reversibility: z.string().optional(),
    // Make stakesLevel flexible - extract the key even if LLM adds explanation
    stakesLevel: z.string().optional().transform((val) => {
      if (!val) return undefined;
      const levels = ['life-defining', 'high', 'medium', 'low'];
      const lower = val.toLowerCase();
      for (const level of levels) {
        if (lower.includes(level)) {
          return level as 'low' | 'medium' | 'high' | 'life-defining';
        }
      }
      return 'medium' as const; // Default fallback
    }),
  }),
  emotionalContext: z.object({
    primaryEmotion: z.string().describe('The dominant emotion around this fork'),
    secondaryEmotions: z.array(z.string()).optional(),
    trigger: z.string().optional().describe('What triggered interest in exploring this'),
    emotionalAge: z.string().optional(),
    hiddenQuestion: z.string().optional().describe('The unstated question they really want answered'),
  }),
  psychologicalPattern: z.object({
    // Make archetype flexible - extract the key even if LLM adds explanation
    archetype: z.string().transform((val) => {
      const archetypes = ['RECKONING', 'ESCAPE_FANTASY', 'CLOSURE_QUEST', 'IDENTITY_CRISIS', 'DECISION_REHEARSAL'];
      const upper = val.toUpperCase();
      for (const arch of archetypes) {
        if (upper.includes(arch)) {
          return arch as 'RECKONING' | 'ESCAPE_FANTASY' | 'CLOSURE_QUEST' | 'IDENTITY_CRISIS' | 'DECISION_REHEARSAL';
        }
      }
      return 'RECKONING' as const; // Default fallback
    }),
    hiddenQuestion: z.string(),
    hiddenNeed: z.string(),
    hiddenFear: z.string().optional(),
    defensesMightSurface: z.array(z.string()).optional(),
  }).optional(),
  userProfile: z.object({
    sharedTraits: z.array(z.string()).describe('Personality traits shared with alternate self'),
    contingentTraits: z.array(z.string()).optional(),
    valuesThen: z.array(z.string()).describe('Values at the time of the decision'),
    valuesNow: z.array(z.string()).describe('Current values'),
    valuesShift: z.string().optional(),
    // Make attachmentStyle flexible - LLMs may add explanations
    attachmentStyle: z.string().optional().transform((val) => {
      if (!val) return undefined;
      const styles = ['secure', 'anxious', 'avoidant', 'disorganized'];
      const lower = val.toLowerCase();
      for (const style of styles) {
        if (lower.startsWith(style) || lower.includes(style)) {
          return style as 'secure' | 'anxious' | 'avoidant' | 'disorganized';
        }
      }
      return undefined;
    }),
    copingMechanisms: z.array(z.string()).optional(),
  }),
  conversationGoals: z.object({
    stated: z.string().describe('What user explicitly wants from the conversation'),
    inferred: z.string().describe('What they implicitly want (validation, closure, etc.)'),
    completionCriteria: z.string().optional(),
    dangerZones: z.array(z.string()).optional(),
    therapeuticOpportunities: z.array(z.string()).optional(),
  }),
  alternateSelftGuidance: z.object({
    shouldEmphasize: z.array(z.string()),
    shouldAcknowledge: z.array(z.string()),
    shouldAsk: z.array(z.string()),
    shouldAvoid: z.array(z.string()),
    emotionalPosture: z.string(),
  }).optional(),
}).passthrough();

/**
 * Research Agent Output Schema
 *
 * Enhanced with authenticity anchors and psychological landscape.
 * Supports both simple string values and detailed object structures.
 */
export const ResearchOutputSchema = z.object({
  factualGrounding: z.object({
    timelineEvents: z.array(z.string()).describe('Key events that would have happened'),
    realisticOutcomes: z.record(z.string()).describe('Realistic outcomes for this path'),
    statisticalContext: z.record(z.string()).describe('Relevant statistics and data'),
  }),
  voiceCues: z.object({
    vocabulary: z.array(z.string()).describe('Words and phrases this person would use'),
    speechPatterns: z.string().describe('How they speak (formal, casual, etc.)'),
    emotionalExpression: z.string().describe('How they express emotions'),
    humorStyle: z.string().optional(),
    avoidancePatterns: z.string().optional(),
  }),
  worldDetails: z.object({
    dailyLife: z.union([
      z.string(),
      z.object({
        morning: z.string().optional(),
        workDay: z.string().optional(),
        evening: z.string().optional(),
        weekend: z.string().optional(),
      }),
    ]).describe('What their typical day looks like'),
    relationships: z.union([
      z.string(),
      z.object({
        romantic: z.string().optional(),
        family: z.string().optional(),
        friendships: z.string().optional(),
        professional: z.string().optional(),
        lost: z.string().optional(),
      }),
    ]).describe('Their relationship situation'),
    environment: z.union([
      z.string(),
      z.object({
        home: z.string().optional(),
        work: z.string().optional(),
        neighborhood: z.string().optional(),
        possessions: z.string().optional(),
      }),
    ]).describe('Where they live, work, etc.'),
  }),
  authenticityAnchors: z.union([
    z.array(z.string()),
    z.object({
      microDetails: z.array(z.string()).optional(),
      insiderKnowledge: z.array(z.string()).optional(),
      unexpectedTruths: z.array(z.string()).optional(),
      commonExperiences: z.array(z.string()).optional(),
    }),
  ]).describe('Specific details that make it feel real'),
  psychologicalLandscape: z.object({
    proudOf: z.array(z.string()),
    secretShame: z.string().optional(),
    unexpectedJoy: z.string().optional(),
    persistentWorry: z.string().optional(),
    copingMechanism: z.string().optional(),
    growthArea: z.string().optional(),
    blindSpot: z.string().optional(),
  }).optional(),
  temporalMarkers: z.object({
    beforeAndAfter: z.string().optional(),
    turningPoints: z.array(z.string()).optional(),
    currentPhase: z.string().optional(),
    futureAnxiety: z.string().optional(),
    futureHope: z.string().optional(),
  }).optional(),
}).passthrough();

/**
 * Persona Architect Output Schema
 *
 * Enhanced with M2-Her role optimization, Big Five personality,
 * and drift prevention mechanisms.
 */
export const PersonaOutputSchema = z.object({
  name: z.string().describe('A name for this alternate self (e.g., "Berlin You", "Doctor You")'),
  summary: z.string().describe('A brief summary of the alternate self for the UI'),
  fullPrompt: z.string().describe('The complete 2000-3000 token persona prompt for M2-Her'),
  timeline: z.string().describe('A narrative timeline of their life since the fork'),
  voiceCharacteristics: z.union([
    z.string(),
    z.object({
      overallTone: z.string().optional(),
      formalityLevel: z.string().optional(),
      speechTempo: z.string().optional(),
      vocabularyNotes: z.string().optional(),
      emotionalExpression: z.string().optional(),
    }),
  ]).describe('How this person speaks and expresses themselves'),
  emotionalLandscape: z.object({
    proudOf: z.array(z.string()).describe('What they are proud of'),
    haunts: z.array(z.string()).describe('What haunts or bothers them'),
    blindSpots: z.array(z.string()).describe('What they cannot see about themselves'),
    unexpectedJoys: z.array(z.string()).optional(),
    copingMechanisms: z.array(z.string()).optional(),
  }),
  questionsForUser: z.array(z.string()).describe('Questions this alternate self would ask'),

  // M2-Her optimization
  userSystemContext: z.string().optional().describe('Context for the user_system role'),
  sampleMessages: z.array(z.object({
    context: z.string(),
    user: z.string(),
    ai: z.string(),
  })).optional().describe('Few-shot examples for voice calibration'),

  // Relationship dynamics
  relationshipWithUser: z.object({
    initialPosture: z.string().optional(),
    curiosities: z.array(z.string()).optional(),
    projections: z.array(z.string()).optional(),
    sensitivities: z.array(z.string()).optional(),
  }).optional(),

  // Conversation triggers
  conversationTriggers: z.object({
    topicsThatLightThemUp: z.array(z.string()).optional(),
    topicsThatMakeThemQuiet: z.array(z.string()).optional(),
    topicsThatBringVulnerability: z.array(z.string()).optional(),
  }).optional(),

  // Big Five personality profile
  personality: z.object({
    extraversion: z.enum(['high', 'moderate', 'low']),
    agreeableness: z.enum(['high', 'moderate', 'low']),
    conscientiousness: z.enum(['high', 'moderate', 'low']),
    neuroticism: z.enum(['high', 'moderate', 'low']),
    openness: z.enum(['high', 'moderate', 'low']),
  }).optional(),
}).passthrough();

// M2-Her Message Schema
export const M2HerMessageSchema = z.object({
  role: z.enum([
    'system',
    'user',
    'assistant',
    'user_system',
    'group',
    'sample_message_user',
    'sample_message_ai',
  ]),
  content: z.string(),
  name: z.string().optional(),
});

export const M2HerMessagesSchema = z.array(M2HerMessageSchema);

// Fork Creation Input Schema
export const CreateForkInputSchema = z.object({
  forkDescription: z.string().min(10).max(2000),
  choiceMade: z.string().optional(),
  choiceNotMade: z.string().optional(),
  yearsElapsed: z.number().min(1).max(50).optional().default(10),
  userContext: z.string().optional(),
});

// Types inferred from schemas
export type InterviewOutputType = z.infer<typeof InterviewOutputSchema>;
export type ResearchOutputType = z.infer<typeof ResearchOutputSchema>;
export type PersonaOutputType = z.infer<typeof PersonaOutputSchema>;
export type M2HerMessageType = z.infer<typeof M2HerMessageSchema>;
export type CreateForkInputType = z.infer<typeof CreateForkInputSchema>;
