import { describe, expect, it } from 'vitest';
import { parseFoodInput } from './parser.js';

describe('deterministic food parser', () => {
  it('parses explicit quantities and modifiers', () => {
    expect(parseFoodInput('2 fried eggs\n100 g sourdough bread')).toEqual([
      {
        rawText: '2 fried eggs',
        normalizedFoodName: 'eggs',
        quantity: 2,
        unit: null,
        quantifier: null,
        preparationModifiers: ['FRIED'],
      },
      {
        rawText: '100 g sourdough bread',
        normalizedFoodName: 'sourdough bread',
        quantity: 100,
        unit: 'GRAM',
        quantifier: null,
        preparationModifiers: [],
      },
    ]);
  });
  it('parses fractions and vague portions', () => {
    expect(
      parseFoodInput('½ avocado; a handful of almonds; some cheese'),
    ).toEqual([
      {
        rawText: '½ avocado',
        normalizedFoodName: 'avocado',
        quantity: 0.5,
        unit: null,
        quantifier: null,
        preparationModifiers: [],
      },
      {
        rawText: 'a handful of almonds',
        normalizedFoodName: 'almonds',
        quantity: null,
        unit: null,
        quantifier: 'HANDFUL',
        preparationModifiers: [],
      },
      {
        rawText: 'some cheese',
        normalizedFoodName: 'cheese',
        quantity: null,
        unit: null,
        quantifier: 'SOME',
        preparationModifiers: [],
      },
    ]);
  });
});
