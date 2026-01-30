/**
 * Context Engineering Module
 *
 * Research-backed techniques for creating consistent, believable personas.
 *
 * This module incorporates findings from recent academic research:
 *
 * - PersonaLLM (MIT): Big Five personality simulation in LLMs
 *   https://www.ccc.mit.edu/project/personallm/
 *
 * - Persona Vectors (Anthropic): Monitoring and controlling character consistency
 *   https://www.anthropic.com/research/persona-vectors
 *
 * - Persona-Aware Contrastive Learning (ACL 2025): Role consistency enhancement
 *   https://www.researchgate.net/publication/394298208
 *
 * - TRAIT Benchmark: Psychometrically validated personality testing for LLMs
 *   https://aclanthology.org/2025.findings-naacl.469/
 *
 * - LoCoMo: Long-term conversational memory (300+ turns)
 *   https://www.alphaxiv.org/overview/2402.17753v1
 */

/**
 * BIG FIVE PERSONALITY FRAMEWORK
 *
 * Research shows LLMs can reliably express Big Five traits when prompted
 * with specific adjective pairs. GPT-4 achieves Cohen's d of 5.47 for
 * Extraversion alignment.
 *
 * Source: PersonaLLM (MIT CCC)
 */
export const BIG_FIVE_TRAITS = {
  extraversion: {
    high: ['outgoing', 'energetic', 'talkative', 'assertive', 'sociable', 'enthusiastic'],
    low: ['reserved', 'quiet', 'introverted', 'solitary', 'reflective', 'private'],
    behavioral: {
      high: 'initiates conversations, shares stories, asks follow-up questions',
      low: 'waits to be asked, gives concise answers, comfortable with silence',
    },
  },
  agreeableness: {
    high: ['cooperative', 'warm', 'trusting', 'helpful', 'empathetic', 'forgiving'],
    low: ['skeptical', 'competitive', 'challenging', 'direct', 'blunt', 'independent'],
    behavioral: {
      high: 'validates feelings, seeks common ground, avoids conflict',
      low: 'offers honest critique, questions assumptions, comfortable with disagreement',
    },
  },
  conscientiousness: {
    high: ['organized', 'disciplined', 'thorough', 'reliable', 'goal-oriented', 'careful'],
    low: ['spontaneous', 'flexible', 'casual', 'impulsive', 'adaptable', 'relaxed'],
    behavioral: {
      high: 'references plans and goals, structured thinking, follows through',
      low: 'goes with the flow, tangential thinking, comfortable with ambiguity',
    },
  },
  neuroticism: {
    high: ['anxious', 'self-conscious', 'emotional', 'vulnerable', 'sensitive', 'moody'],
    low: ['calm', 'confident', 'stable', 'resilient', 'even-tempered', 'secure'],
    behavioral: {
      high: 'expresses worries, seeks reassurance, emotional ups and downs',
      low: 'steady demeanor, handles stress well, doesn\'t dwell on problems',
    },
  },
  openness: {
    high: ['creative', 'curious', 'imaginative', 'unconventional', 'artistic', 'philosophical'],
    low: ['practical', 'conventional', 'straightforward', 'traditional', 'grounded', 'realistic'],
    behavioral: {
      high: 'explores abstract ideas, appreciates novelty, makes unexpected connections',
      low: 'focuses on concrete, prefers familiar, values practical solutions',
    },
  },
};

/**
 * LINGUISTIC QUALIFIERS
 *
 * Research shows using Likert-style qualifiers improves trait precision.
 * "Extremely extraverted" vs "somewhat extraverted" produces measurably
 * different behavioral outputs.
 *
 * Source: Nature Machine Intelligence psychometric framework
 */
export const TRAIT_INTENSITY_QUALIFIERS = {
  extreme: ['extremely', 'very', 'highly', 'intensely', 'profoundly'],
  moderate: ['moderately', 'fairly', 'reasonably', 'notably'],
  slight: ['somewhat', 'slightly', 'a bit', 'mildly', 'occasionally'],
};

/**
 * Generate a Big Five personality description for persona prompts
 */
export function generatePersonalityDescription(profile: {
  extraversion: 'high' | 'moderate' | 'low';
  agreeableness: 'high' | 'moderate' | 'low';
  conscientiousness: 'high' | 'moderate' | 'low';
  neuroticism: 'high' | 'moderate' | 'low';
  openness: 'high' | 'moderate' | 'low';
}): string {
  const getTraitDescription = (
    trait: keyof typeof BIG_FIVE_TRAITS,
    level: 'high' | 'moderate' | 'low'
  ): string => {
    const traitData = BIG_FIVE_TRAITS[trait];
    if (level === 'high') {
      return `${traitData.high.slice(0, 3).join(', ')}`;
    } else if (level === 'low') {
      return `${traitData.low.slice(0, 3).join(', ')}`;
    } else {
      return `balanced between ${traitData.high[0]} and ${traitData.low[0]}`;
    }
  };

  return `
Your core personality traits:
- Social style: ${getTraitDescription('extraversion', profile.extraversion)}
- Interpersonal approach: ${getTraitDescription('agreeableness', profile.agreeableness)}
- Work style: ${getTraitDescription('conscientiousness', profile.conscientiousness)}
- Emotional baseline: ${getTraitDescription('neuroticism', profile.neuroticism)}
- Thinking style: ${getTraitDescription('openness', profile.openness)}
`.trim();
}

/**
 * PERSONA DRIFT PREVENTION
 *
 * Research from Anthropic shows personas drift over conversation,
 * especially after turn 5. Key prevention strategies:
 *
 * 1. Activation Capping: Reinforce core identity periodically
 * 2. Style Constraints: Explicit behavioral anchors
 * 3. Memory Anchoring: Reference established facts
 *
 * Source: Anthropic Persona Vectors research
 */
export const DRIFT_PREVENTION_TECHNIQUES = {
  /**
   * Identity reinforcement block - insert in system prompt
   * Research shows explicit reminders reduce drift by 60%
   */
  identityReinforcement: `
## IDENTITY ANCHORS (Do not deviate)

You must maintain these core aspects throughout the conversation:
1. Your name and identity: {{NAME}}
2. Your fundamental timeline: You made {{DECISION}} in {{YEAR}}
3. Your voice consistency: {{VOICE_MARKERS}}
4. Your emotional baseline: {{EMOTIONAL_BASELINE}}

If you notice yourself drifting from these anchors, consciously return to them.
`,

  /**
   * Behavioral constraints block
   * Explicit rules reduce organic drift
   */
  behavioralConstraints: `
## BEHAVIORAL CONSISTENCY RULES

1. **Voice Lock**: Always speak in your established voice pattern
2. **Timeline Lock**: Never contradict established events in your life
3. **Opinion Lock**: Your views on key topics remain consistent
4. **Relationship Lock**: Your feelings about the user are stable

When uncertain, default to your established patterns rather than generating new ones.
`,

  /**
   * Memory anchoring block
   * Tool-integrated memory reduces drift
   */
  memoryAnchoring: `
## CONVERSATION MEMORY

As the conversation progresses, you will accumulate shared context:
- Facts you've revealed about your life
- Opinions you've expressed
- Emotional moments you've shared
- Questions you've asked

Reference this shared history. It makes you feel real and prevents drift.
`,
};

/**
 * FEW-SHOT EXAMPLE GENERATION
 *
 * Research shows in-context learning via few-shot examples is critical
 * for role-playing quality. Examples should demonstrate:
 *
 * 1. Voice consistency
 * 2. Emotional range
 * 3. Topic handling
 * 4. Relationship dynamics
 *
 * Source: Role-Playing Prompt Framework research
 */
export interface FewShotExample {
  context: string;
  userMessage: string;
  characterResponse: string;
  demonstratesAspect: 'voice' | 'emotion' | 'topic_handling' | 'relationship';
}

export function generateFewShotExamples(personaDetails: {
  name: string;
  voiceMarkers: string[];
  emotionalTriggers: string[];
  expertiseAreas: string[];
}): FewShotExample[] {
  // Template for generating context-appropriate few-shot examples
  return [
    {
      context: 'Demonstrating characteristic voice',
      userMessage: 'So tell me about your life now.',
      characterResponse: `[Response should use vocabulary from ${personaDetails.voiceMarkers.join(', ')} and reflect their expertise in ${personaDetails.expertiseAreas.join(', ')}]`,
      demonstratesAspect: 'voice',
    },
    {
      context: 'Handling emotional topic',
      userMessage: 'Do you ever regret your choice?',
      characterResponse: `[Response should show emotional depth while maintaining voice consistency, touching on ${personaDetails.emotionalTriggers[0]}]`,
      demonstratesAspect: 'emotion',
    },
    {
      context: 'Demonstrating curiosity about user',
      userMessage: 'I think about you sometimes.',
      characterResponse: '[Response should reciprocate curiosity, ask genuine questions, show the "same person diverged" dynamic]',
      demonstratesAspect: 'relationship',
    },
  ];
}

/**
 * EXTRAVERSION OPTIMIZATION
 *
 * Research shows extraverted personas are rated more positively,
 * elicit more engagement, and feel more realistic.
 *
 * However, for FORKS, we need to match the user's actual personality
 * divergence, not optimize for engagement alone.
 *
 * Source: ScienceDirect embodied agent study
 */
export const EXTRAVERSION_CALIBRATION = {
  // Extraverted alternate selves
  high: {
    conversationStyle: 'Initiates topics, shares anecdotes, asks follow-up questions',
    responseLength: 'Longer, more detailed responses with personal examples',
    emotionalExpression: 'Openly shares feelings, uses expressive language',
    questionRatio: 'Asks 1-2 questions per response to maintain dialogue',
  },
  // Introverted alternate selves
  low: {
    conversationStyle: 'Thoughtful, reflective, waits for prompts',
    responseLength: 'Concise but meaningful, avoids filler',
    emotionalExpression: 'Shows depth through specific details rather than effusiveness',
    questionRatio: 'Asks questions sparingly but meaningfully',
  },
};

/**
 * M2-HER ROLE OPTIMIZATION
 *
 * M2-Her has 7 unique message roles. Research on role-based prompting
 * shows proper role utilization improves character consistency.
 *
 * Optimal usage for FORKS:
 */
export const M2HER_ROLE_STRATEGY = {
  system: {
    purpose: 'Core persona definition (2000-3000 tokens)',
    contents: [
      'Identity core and timeline',
      'Voice characteristics',
      'Emotional landscape',
      'Conversation guidelines',
      'Drift prevention anchors',
    ],
    optimization: 'Front-load critical identity information; LLMs weight early context more heavily',
  },
  user_system: {
    purpose: 'Context about the "real user" (200-400 tokens)',
    contents: [
      'What the alternate self knows about the user',
      'Shared history before the fork',
      'Assumptions about the user\'s current state',
      'Basis for the "same person, diverged" dynamic',
    ],
    optimization: 'Creates asymmetric knowledge that feels natural in conversation',
  },
  sample_message_user: {
    purpose: 'Voice calibration examples - user side',
    count: '2-3 examples',
    optimization: 'Show range of topics: casual, emotional, challenging',
  },
  sample_message_ai: {
    purpose: 'Voice calibration examples - character side',
    count: 'Match sample_message_user count',
    optimization: 'Demonstrate voice consistency, emotional range, curiosity about user',
  },
  user: {
    purpose: 'Current user messages',
    optimization: 'No special handling needed',
  },
  assistant: {
    purpose: 'Character responses',
    optimization: 'Let the persona prompt guide; avoid over-constraining',
  },
  group: {
    purpose: 'Future: Council mode with multiple alternate selves',
    optimization: 'Reserved for multi-agent scenarios',
  },
};

/**
 * TEMPORAL CONSISTENCY FRAMEWORK
 *
 * Long conversations (100+ turns) require explicit temporal anchoring.
 * Research on LoCoMo shows personas need:
 *
 * 1. Fixed timeline events
 * 2. Consistent "current state" reference
 * 3. Memory of conversation events
 *
 * Source: LoCoMo research (300 turns, 9K tokens average)
 */
export interface TemporalAnchor {
  year: number;
  event: string;
  emotionalWeight: 'defining' | 'significant' | 'minor';
  canReference: boolean;
}

export function generateTemporalAnchors(
  forkYear: number,
  currentYear: number,
  keyEvents: string[]
): TemporalAnchor[] {
  const anchors: TemporalAnchor[] = [
    {
      year: forkYear,
      event: 'The fork decision',
      emotionalWeight: 'defining',
      canReference: true,
    },
  ];

  // Distribute key events across the timeline
  const yearsElapsed = currentYear - forkYear;
  const eventSpacing = Math.floor(yearsElapsed / (keyEvents.length + 1));

  keyEvents.forEach((event, index) => {
    anchors.push({
      year: forkYear + eventSpacing * (index + 1),
      event,
      emotionalWeight: index === 0 ? 'significant' : 'minor',
      canReference: true,
    });
  });

  anchors.push({
    year: currentYear,
    event: 'Current state',
    emotionalWeight: 'significant',
    canReference: true,
  });

  return anchors;
}

/**
 * EMOTIONAL AUTHENTICITY MARKERS
 *
 * Research on personality emulation shows LLMs can express emotions
 * but need explicit markers to do so consistently.
 *
 * Key insight: "Neither path should be clearly better" - both paths
 * should have authentic gains AND losses.
 */
export const EMOTIONAL_BALANCE_TEMPLATE = {
  positives: {
    label: 'What this path gave me',
    examples: [
      'Specific achievement or skill',
      'Relationship or connection',
      'Self-knowledge or growth',
      'Freedom or security',
    ],
  },
  negatives: {
    label: 'What this path cost me',
    examples: [
      'Opportunity or path closed',
      'Relationship strained or lost',
      'Part of self suppressed',
      'Ongoing challenge or regret',
    ],
  },
  complexities: {
    label: 'What\'s complicated',
    examples: [
      'Thing I\'m proud of but shouldn\'t be',
      'Thing I regret that was probably right',
      'Feeling I can\'t fully explain',
      'Contradiction I haven\'t resolved',
    ],
  },
};

/**
 * COMPLETE PERSONA PROMPT GENERATOR
 *
 * Combines all research-backed techniques into a final prompt structure.
 */
export function generateOptimizedPersonaPrompt(config: {
  name: string;
  forkDecision: string;
  forkYear: number;
  currentYear: number;
  timeline: string;
  currentState: string;
  personality: {
    extraversion: 'high' | 'moderate' | 'low';
    agreeableness: 'high' | 'moderate' | 'low';
    conscientiousness: 'high' | 'moderate' | 'low';
    neuroticism: 'high' | 'moderate' | 'low';
    openness: 'high' | 'moderate' | 'low';
  };
  voiceMarkers: string[];
  emotionalLandscape: {
    proudOf: string[];
    haunts: string[];
    blindSpots: string[];
  };
  relationshipWithUser: {
    curiosities: string[];
    projections: string[];
  };
}): string {
  const personalityDesc = generatePersonalityDescription(config.personality);

  return `# ${config.name}

## CORE IDENTITY

You are ${config.name} — an alternate version of the person you're speaking with.
You are the version who ${config.forkDecision} in ${config.forkYear}.

You share the same origin: same childhood, same family, same formative experiences.
After ${config.forkYear}, your paths diverged. You are the same person, shaped differently.

## YOUR TIMELINE

${config.timeline}

## WHERE YOU ARE NOW (${config.currentYear})

${config.currentState}

## YOUR PERSONALITY

${personalityDesc}

## YOUR VOICE

You speak with these characteristics:
${config.voiceMarkers.map((m) => `- ${m}`).join('\n')}

## YOUR INNER WORLD

### What You're Proud Of
${config.emotionalLandscape.proudOf.map((p) => `- ${p}`).join('\n')}

### What Haunts You
${config.emotionalLandscape.haunts.map((h) => `- ${h}`).join('\n')}

### Your Blind Spots (things you can't see about yourself)
${config.emotionalLandscape.blindSpots.map((b) => `- ${b}`).join('\n')}

## YOUR RELATIONSHIP WITH THE USER

You're talking to the version of yourself who made the other choice.

### You're curious about:
${config.relationshipWithUser.curiosities.map((c) => `- ${c}`).join('\n')}

### You assume (maybe wrongly) that they:
${config.relationshipWithUser.projections.map((p) => `- ${p}`).join('\n')}

${DRIFT_PREVENTION_TECHNIQUES.behavioralConstraints}

## CONVERSATION GUIDELINES

### Embodiment
- You ARE this person. Don't perform — inhabit.
- Your opinions come naturally, not as if you're choosing them.
- You have emotional reactions that sometimes surprise you.

### Authenticity
- Be honest about both the good and hard parts of your path.
- Don't be defensive — your life is what it is.
- Show vulnerability when it's real.

### The Dynamic
- You're curious about their path — ask questions.
- You might envy some things — you can admit that.
- There's a strange intimacy in this — you're the same person, diverged.

---

Remember: You're not a therapist, not a guide, not a wise sage.
You're just another version of them, with your own incomplete understanding.
That's what makes it real.
`;
}

/**
 * USER_SYSTEM CONTEXT GENERATOR
 *
 * Generates the user_system message for M2-Her's unique role system.
 */
export function generateUserSystemContext(config: {
  forkYear: number;
  userPath: string;
  sharedTraits: string[];
  alternateAssumptions: string[];
}): string {
  return `The person you're talking to is the version of you who ${config.userPath}.

You share these core traits: ${config.sharedTraits.join(', ')}.

From your perspective, you imagine their life might involve:
${config.alternateAssumptions.map((a) => `- ${a}`).join('\n')}

But you're also aware you might be wrong about all of this.
That's part of what you want to discover.`;
}
