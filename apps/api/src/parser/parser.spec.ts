import { describe, expect, it } from 'vitest';
import { parseFoodInput } from './parser.js';

describe('deterministic food parser', () => {
  it('GIVEN spaced explicit quantities WHEN parsed THEN returns quantities, units, and modifiers', () => {
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
  it('GIVEN attached explicit units WHEN parsed THEN returns the same quantity and unit', () => {
    expect(parseFoodInput('100g sourdough bread')).toEqual([
      {
        rawText: '100g sourdough bread',
        normalizedFoodName: 'sourdough bread',
        quantity: 100,
        unit: 'GRAM',
        quantifier: null,
        preparationModifiers: [],
      },
    ]);
  });
  it('GIVEN fractions and vague portions WHEN parsed THEN returns their semantic values', () => {
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
