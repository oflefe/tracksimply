import { z } from 'zod';
import type { UnitName } from '@calorie-tracker/contracts';

export const quantifiers = [
  'SOME',
  'HANDFUL',
  'SMALL',
  'MEDIUM',
  'LARGE',
  'SLICE',
  'BOWL',
  'CUP',
  'HALF',
  'QUARTER',
] as const;
export type Quantifier = (typeof quantifiers)[number];
export const parsedFoodMentionSchema = z.object({
  rawText: z.string(),
  normalizedFoodName: z.string(),
  quantity: z.number().nullable(),
  unit: z.string().nullable(),
  quantifier: z.enum(quantifiers).nullable(),
  preparationModifiers: z.array(z.string()),
});
export type ParsedFoodMention = z.infer<typeof parsedFoodMentionSchema>;

const unitAliases: Record<string, UnitName> = {
  g: 'GRAM',
  gram: 'GRAM',
  grams: 'GRAM',
  kg: 'KILOGRAM',
  kilogram: 'KILOGRAM',
  kilograms: 'KILOGRAM',
  ml: 'MILLILITRE',
  millilitre: 'MILLILITRE',
  millilitres: 'MILLILITRE',
  l: 'LITRE',
  litre: 'LITRE',
  litres: 'LITRE',
  tsp: 'TEASPOON',
  teaspoon: 'TEASPOON',
  teaspoons: 'TEASPOON',
  tbsp: 'TABLESPOON',
  tablespoon: 'TABLESPOON',
  tablespoons: 'TABLESPOON',
  cup: 'CUP',
  cups: 'CUP',
  pc: 'PIECE',
  pcs: 'PIECE',
  piece: 'PIECE',
  pieces: 'PIECE',
  slice: 'SLICE',
  slices: 'SLICE',
  handful: 'HANDFUL',
  bowl: 'BOWL',
  serving: 'SERVING',
};
const quantityPattern = new RegExp(
  `^(\\d+(?:\\.\\d+)?|\\d+\\/\\d+|[½¼¾⅓⅔]|one|two|three|four|five|half|quarter)(?=\\s|$|(?:${Object.keys(unitAliases).join('|')})\\b)\\s*`,
  'i',
);
const numberWords: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  half: 0.5,
  quarter: 0.25,
};
const unicodeFractions: Record<string, number> = {
  '½': 0.5,
  '¼': 0.25,
  '¾': 0.75,
  '⅓': 1 / 3,
  '⅔': 2 / 3,
};
const modifiers = [
  'raw',
  'cooked',
  'boiled',
  'fried',
  'grilled',
  'roasted',
  'baked',
  'steamed',
  'dry',
  'low-fat',
  'full-fat',
  'skinless',
  'boneless',
];

export function normalizeRawInput(rawText: string): string {
  return rawText
    .replace(/[\r\n]+/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n+/g, '\n')
    .trim();
}
export function splitInputIntoSegments(rawText: string): string[] {
  return normalizeRawInput(rawText)
    .split(/\n|;|,(?!\s*(?:and\b)?\d)/i)
    .flatMap((segment) => segment.split(/\s+and\s+/i))
    .map((segment) => segment.trim())
    .filter(Boolean);
}
function parseNumber(value: string): number | null {
  const lower = value.toLowerCase();
  if (numberWords[lower] !== undefined) {
    return numberWords[lower];
  }
  if (unicodeFractions[lower] !== undefined) {
    return unicodeFractions[lower];
  }
  if (/^\d+(?:\.\d+)?\/\d+(?:\.\d+)?$/.test(lower)) {
    const [left, right] = lower.split('/').map(Number);
    return right === 0 ? null : left / right;
  }
  const number = Number(lower);
  return Number.isFinite(number) ? number : null;
}
export function extractQuantity(text: string): {
  quantity: number | null;
  remainder: string;
} {
  const match = text.match(quantityPattern);
  if (!match || !match[1]) {
    return { quantity: null, remainder: text };
  }
  const quantity = parseNumber(match[1]);
  return { quantity, remainder: text.slice(match[0].length) };
}
export function extractUnit(text: string): {
  unit: UnitName | null;
  remainder: string;
} {
  const match = text.match(/^([a-z-]+)\b\s*/i);
  if (!match || !match[1]) {
    return { unit: null, remainder: text };
  }
  const unit = unitAliases[match[1].toLowerCase()];
  return unit
    ? { unit, remainder: text.slice(match[0].length) }
    : { unit: null, remainder: text };
}
export function extractQuantifier(text: string): {
  quantifier: Quantifier | null;
  remainder: string;
} {
  const match = text.match(
    /^(?:a\s+)?(handful|some|small|medium|large|slice|bowl|cup|half|quarter)\b\s*/i,
  );
  if (!match) {
    return { quantifier: null, remainder: text };
  }
  return {
    quantifier: match[1].toUpperCase() as Quantifier,
    remainder: text.slice(match[0].length),
  };
}
export function extractPreparationModifiers(text: string): {
  preparationModifiers: string[];
  remainder: string;
} {
  const found: string[] = [];
  let remainder = text;
  for (const modifier of modifiers) {
    const pattern = new RegExp(`\\b${modifier.replace('-', '\\-')}\\b`, 'i');
    if (pattern.test(remainder)) {
      found.push(modifier.toUpperCase());
      remainder = remainder.replace(pattern, ' ');
    }
  }
  return {
    preparationModifiers: found,
    remainder: remainder
      .replace(/\s*,\s*/g, ' ')
      .replace(/\s+/g, ' ')
      .trim(),
  };
}
export function normalizeFoodName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
export function buildParsedFoodMention(rawText: string): ParsedFoodMention {
  let remainder = rawText.trim().replace(/^[-*]\s*/, '');
  const quantityResult = extractQuantity(remainder);
  remainder = quantityResult.remainder;
  const unitResult = extractUnit(remainder);
  remainder = unitResult.remainder;
  const quantifierResult = extractQuantifier(remainder);
  remainder = quantifierResult.remainder.replace(/^of\s+/i, '');
  const preparationResult = extractPreparationModifiers(remainder);
  const normalizedFoodName = normalizeFoodName(preparationResult.remainder);
  return {
    rawText: rawText.trim(),
    normalizedFoodName,
    quantity: quantityResult.quantity,
    unit: unitResult.unit ?? null,
    quantifier: quantifierResult.quantifier,
    preparationModifiers: preparationResult.preparationModifiers,
  };
}
export function parseFoodInput(rawText: string): ParsedFoodMention[] {
  return splitInputIntoSegments(rawText).map(buildParsedFoodMention);
}
