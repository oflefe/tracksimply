import nlp from 'compromise';

const CONTEXT_ONLY_NOUNS = new Set([
  'i',
  'we',
  'breakfast',
  'lunch',
  'dinner',
  'snack',
  'meal',
]);

const NLP_TRIGGER =
  /\b(?:i|we)\s+(?:had|ate|drank|consumed)\b|\b(?:with|plus|alongside)\b|\s+and\s+/i;

function cleanCandidate(value: string): string {
  return value
    .replace(/^[-*]\s*/, '')
    .replace(/^[,.;:!?]+|[,.;:!?]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

export function extractCandidateSegments(rawText: string): string[] {
  const coarseSegments = rawText
    .split(/\n|;/)
    .flatMap((segment) => segment.split(/,(?!\s*(?:and\b)?\d)/i))
    .map(cleanCandidate)
    .filter(Boolean);

  return coarseSegments.flatMap((segment) => {
    if (!NLP_TRIGGER.test(segment)) {
      return [segment];
    }

    const candidates = unique(
      (nlp(segment).nouns().out('array') as string[])
        .map(cleanCandidate)
        .filter(Boolean)
        .filter(
          (candidate) => !CONTEXT_ONLY_NOUNS.has(candidate.toLowerCase()),
        ),
    );

    return candidates.length > 0 ? candidates : [segment];
  });
}
