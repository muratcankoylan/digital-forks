// Core types for Forks application

export interface User {
  id: string;
  createdAt: Date;
  platformId: string | null;
  metadata: Record<string, unknown>;
}

export interface Fork {
  id: string;
  userId: string;
  createdAt: Date;

  // Fork definition (user input)
  forkDescription: string;
  choiceMade: string;
  choiceNotMade: string;
  yearsElapsed: number;
  userContext: string | null;

  // Pipeline outputs
  interviewOutput: InterviewOutput | null;
  researchOutput: ResearchOutput | null;
  personaPrompt: string | null;

  // Generated character summary
  alternateSelfName: string | null;
  alternateSelfSummary: string | null;

  // State
  status: ForkStatus;
  lastMessageAt: Date | null;
  messageCount: number;
}

export type ForkStatus = 'creating' | 'active' | 'archived';

export interface Message {
  id: string;
  forkId: string;
  createdAt: Date;
  role: MessageRole;
  content: string;
  platform: Platform | null;
  tokensUsed: number | null;
  latencyMs: number | null;
}

export type MessageRole = 'user' | 'alternate_self';
export type Platform = 'web' | 'whatsapp' | 'telegram' | 'discord' | 'imessage' | 'mattermost';

// =============================================================================
// CONTEXT ENGINEERING PIPELINE TYPES
// =============================================================================

/**
 * Interview Agent Output
 *
 * Enhanced with psychological archetypes and therapeutic guidance
 * based on research on hidden motivations in "what if" explorations.
 */
export interface InterviewOutput {
  forkPoint: {
    decision: string;
    timing: string;
    alternatives: string[];
    reversibility?: string;
    stakesLevel?: 'low' | 'medium' | 'high' | 'life-defining';
  };

  emotionalContext: {
    primaryEmotion: string;
    secondaryEmotions?: string[];
    trigger?: string;
    emotionalAge?: string;
    hiddenQuestion?: string;
  };

  // NEW: Psychological pattern detection
  psychologicalPattern?: {
    archetype: 'RECKONING' | 'ESCAPE_FANTASY' | 'CLOSURE_QUEST' | 'IDENTITY_CRISIS' | 'DECISION_REHEARSAL';
    hiddenQuestion: string;
    hiddenNeed: string;
    hiddenFear?: string;
    defensesMightSurface?: string[];
  };

  userProfile: {
    sharedTraits: string[];
    contingentTraits?: string[];
    valuesThen: string[];
    valuesNow: string[];
    valuesShift?: string;
    attachmentStyle?: 'secure' | 'anxious' | 'avoidant' | 'disorganized';
    copingMechanisms?: string[];
  };

  conversationGoals: {
    stated: string;
    inferred: string;
    completionCriteria?: string;
    dangerZones?: string[];
    therapeuticOpportunities?: string[];
  };

  // NEW: Guidance for persona creation
  alternateSelftGuidance?: {
    shouldEmphasize: string[];
    shouldAcknowledge: string[];
    shouldAsk: string[];
    shouldAvoid: string[];
    emotionalPosture: string;
  };
}

/**
 * Research Agent Output
 *
 * Enhanced with authenticity anchors and psychological landscape
 * based on research on believable persona creation.
 */
export interface ResearchOutput {
  factualGrounding: {
    timelineEvents: string[];
    realisticOutcomes: Record<string, string>;
    statisticalContext: Record<string, string>;
  };

  voiceCues: {
    vocabulary: string[];
    speechPatterns: string;
    emotionalExpression: string;
    humorStyle?: string;
    avoidancePatterns?: string;
  };

  worldDetails: {
    dailyLife: string | {
      morning?: string;
      workDay?: string;
      evening?: string;
      weekend?: string;
    };
    relationships: string | {
      romantic?: string;
      family?: string;
      friendships?: string;
      professional?: string;
      lost?: string;
    };
    environment: string | {
      home?: string;
      work?: string;
      neighborhood?: string;
      possessions?: string;
    };
  };

  authenticityAnchors: string[] | {
    microDetails?: string[];
    insiderKnowledge?: string[];
    unexpectedTruths?: string[];
    commonExperiences?: string[];
  };

  // NEW: Psychological grounding
  psychologicalLandscape?: {
    proudOf: string[];
    secretShame?: string;
    unexpectedJoy?: string;
    persistentWorry?: string;
    copingMechanism?: string;
    growthArea?: string;
    blindSpot?: string;
  };

  // NEW: Temporal markers for long-term consistency
  temporalMarkers?: {
    beforeAndAfter?: string;
    turningPoints?: string[];
    currentPhase?: string;
    futureAnxiety?: string;
    futureHope?: string;
  };
}

/**
 * Persona Architect Output
 *
 * Enhanced with M2-Her role optimization, Big Five personality,
 * and drift prevention based on research on character consistency.
 */
export interface PersonaOutput {
  name: string;
  summary: string;
  fullPrompt: string;
  timeline: string;
  voiceCharacteristics: string | {
    overallTone?: string;
    formalityLevel?: string;
    speechTempo?: string;
    vocabularyNotes?: string;
    emotionalExpression?: string;
  };

  emotionalLandscape: {
    proudOf: string[];
    haunts: string[];
    blindSpots: string[];
    unexpectedJoys?: string[];
    copingMechanisms?: string[];
  };

  questionsForUser: string[];

  // NEW: M2-Her role optimization
  userSystemContext?: string;

  // NEW: Few-shot examples for voice calibration
  sampleMessages?: Array<{
    context: string;
    user: string;
    ai: string;
  }>;

  // NEW: Relationship dynamics
  relationshipWithUser?: {
    initialPosture?: string;
    curiosities?: string[];
    projections?: string[];
    sensitivities?: string[];
  };

  // NEW: Conversation triggers for rich dialogue
  conversationTriggers?: {
    topicsThatLightThemUp?: string[];
    topicsThatMakeThemQuiet?: string[];
    topicsThatBringVulnerability?: string[];
  };

  // NEW: Big Five personality profile for consistency
  personality?: {
    extraversion: 'high' | 'moderate' | 'low';
    agreeableness: 'high' | 'moderate' | 'low';
    conscientiousness: 'high' | 'moderate' | 'low';
    neuroticism: 'high' | 'moderate' | 'low';
    openness: 'high' | 'moderate' | 'low';
  };
}

export type ForkType = 'life_decision' | 'career' | 'relationship' | 'historical';

// =============================================================================
// PIPELINE PROGRESS TYPES
// =============================================================================

export type PipelineStage = 'interview' | 'research' | 'architect' | 'complete';

export interface PipelineProgress {
  stage: PipelineStage;
  status: 'started' | 'completed' | 'error';
  message: string;
  data?: unknown;
}

// =============================================================================
// M2-HER MESSAGE TYPES
// =============================================================================

/**
 * M2-Her supports 7 specialized roles for character conversations.
 * Research shows proper role utilization improves consistency.
 */
export type M2HerRole =
  | 'system'
  | 'user'
  | 'assistant'
  | 'user_system'
  | 'group'
  | 'sample_message_user'
  | 'sample_message_ai';

export interface M2HerMessage {
  role: M2HerRole;
  content: string;
  name?: string;
}

// =============================================================================
// CONTEXT ENGINEERING TYPES
// =============================================================================

/**
 * Big Five personality dimensions
 * Research: PersonaLLM achieves Cohen's d of 5.47 for extraversion alignment
 */
export interface BigFiveProfile {
  extraversion: 'high' | 'moderate' | 'low';
  agreeableness: 'high' | 'moderate' | 'low';
  conscientiousness: 'high' | 'moderate' | 'low';
  neuroticism: 'high' | 'moderate' | 'low';
  openness: 'high' | 'moderate' | 'low';
}

/**
 * Temporal anchor for long-term conversation consistency
 * Research: LoCoMo shows 300+ turn conversations need explicit temporal grounding
 */
export interface TemporalAnchor {
  year: number;
  event: string;
  emotionalWeight: 'defining' | 'significant' | 'minor';
  canReference: boolean;
}

/**
 * Psychological archetype for fork exploration
 * Research: Most fork explorations follow one of these patterns
 */
export type PsychologicalArchetype =
  | 'RECKONING'      // Milestone triggers reassessment
  | 'ESCAPE_FANTASY' // Current dissatisfaction projected
  | 'CLOSURE_QUEST'  // Unfinished emotional business
  | 'IDENTITY_CRISIS'// "Who am I really?" exploration
  | 'DECISION_REHEARSAL'; // Current decision needs past guidance
