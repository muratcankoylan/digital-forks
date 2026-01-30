import type { ForkType, InterviewOutput } from './types';

/**
 * Detect the type of fork based on interview output
 */
export function detectForkType(interview: InterviewOutput): ForkType {
  const decision = interview.forkPoint.decision.toLowerCase();
  const alternatives = interview.forkPoint.alternatives.join(' ').toLowerCase();
  const combined = `${decision} ${alternatives}`;

  // Career-related keywords
  if (
    combined.includes('job') ||
    combined.includes('career') ||
    combined.includes('profession') ||
    combined.includes('work') ||
    combined.includes('doctor') ||
    combined.includes('lawyer') ||
    combined.includes('engineer') ||
    combined.includes('business') ||
    combined.includes('startup')
  ) {
    return 'career';
  }

  // Relationship-related keywords
  if (
    combined.includes('married') ||
    combined.includes('relationship') ||
    combined.includes('dating') ||
    combined.includes('partner') ||
    combined.includes('divorced') ||
    combined.includes('love') ||
    combined.includes('girlfriend') ||
    combined.includes('boyfriend')
  ) {
    return 'relationship';
  }

  // Historical figure (if they mention a specific person)
  if (
    combined.includes('talk to') ||
    combined.includes('speak with') ||
    combined.includes('interview') ||
    combined.includes('what would') ||
    combined.includes('historical')
  ) {
    return 'historical';
  }

  // Default to life decision
  return 'life_decision';
}

/**
 * Generate a name for the alternate self based on fork description
 */
export function generateAlternateSelfName(
  forkDescription: string,
  choiceNotMade?: string
): string {
  const desc = (choiceNotMade || forkDescription).toLowerCase();

  // Extract location-based names
  const locationMatch = desc.match(
    /(?:moved? to|went to|lived? in|stayed? in)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i
  );
  if (locationMatch) {
    return `${locationMatch[1]} You`;
  }

  // Extract career-based names
  const careerMatch = desc.match(
    /(?:became|was|been|being)\s+(?:a|an)\s+(\w+)/i
  );
  if (careerMatch) {
    const career = careerMatch[1];
    return `${career.charAt(0).toUpperCase() + career.slice(1)} You`;
  }

  // Extract action-based names
  const actionMatch = desc.match(
    /(?:chose|decided|went|stayed|kept|left)/i
  );
  if (actionMatch) {
    // Use the first significant noun after the action
    const words = desc.split(/\s+/);
    const actionIndex = words.findIndex((w) =>
      w.match(/chose|decided|went|stayed|kept|left/i)
    );
    if (actionIndex >= 0 && actionIndex < words.length - 1) {
      const nextWord = words[actionIndex + 1];
      if (nextWord && nextWord.length > 2) {
        return `${nextWord.charAt(0).toUpperCase() + nextWord.slice(1)} You`;
      }
    }
  }

  return 'Alternate You';
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Format timestamp for display
 */
export function formatTimestamp(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 7) {
    return date.toLocaleDateString();
  }
  if (days > 0) {
    return `${days}d ago`;
  }
  if (hours > 0) {
    return `${hours}h ago`;
  }
  if (minutes > 0) {
    return `${minutes}m ago`;
  }
  return 'Just now';
}

/**
 * Generate a platform-specific ID
 */
export function createPlatformId(platform: string, identifier: string): string {
  return `${platform}:${identifier}`;
}

/**
 * Parse a platform ID into components
 */
export function parsePlatformId(platformId: string): {
  platform: string;
  identifier: string;
} | null {
  const [platform, ...rest] = platformId.split(':');
  if (!platform || rest.length === 0) return null;
  return { platform, identifier: rest.join(':') };
}
