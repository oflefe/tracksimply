import { describe, expect, it } from 'vitest';
import { extractCandidateSegments } from './candidate-extractor.js';

describe('NLP ingredient candidate extraction', () => {
  it('GIVEN structured ingredient lines WHEN extracted THEN preserves each line', () => {
    expect(
      extractCandidateSegments('2 fried eggs\n100g sourdough bread'),
    ).toEqual(['2 fried eggs', '100g sourdough bread']);
  });

  it('GIVEN conversational input WHEN extracted THEN returns noun-phrase food candidates', () => {
    expect(
      extractCandidateSegments(
        'I had two fried eggs with sourdough, some feta and a small latte',
      ),
    ).toEqual(['two fried eggs', 'sourdough', 'some feta', 'a small latte']);
  });

  it('GIVEN a meal-context noun WHEN extracted THEN excludes the context noun', () => {
    expect(extractCandidateSegments('I had breakfast with two eggs')).toEqual([
      'two eggs',
    ]);
  });
});
