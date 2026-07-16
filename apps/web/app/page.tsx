'use client';
import { useState } from 'react';
import {
  confirmFoodLog,
  previewFoodLog,
  ApiClientError,
} from '../lib/api-client';
import type { PreviewResponse, MealType } from '@calorie-tracker/contracts';

const demoUserId = 'demo-user-id';
const mealTypes: MealType[] = [
  'BREAKFAST',
  'LUNCH',
  'DINNER',
  'SNACK',
  'CUSTOM',
];
export default function HomePage() {
  const [mealType, setMealType] = useState<MealType>('BREAKFAST');
  const [input, setInput] = useState(
    '2 fried eggs\n100g sourdough bread\nsome feta cheese',
  );
  const [response, setResponse] = useState<PreviewResponse | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const occurredAt = new Date().toISOString();
  async function preview() {
    setLoading(true);
    setError('');
    try {
      setResponse(
        await previewFoodLog({
          userId: demoUserId,
          mealType,
          occurredAt,
          input,
        }),
      );
    } catch (caught) {
      setError(
        caught instanceof ApiClientError ? caught.message : 'Preview failed',
      );
    } finally {
      setLoading(false);
    }
  }
  async function confirm() {
    if (!response || response.status !== 'READY') {
      return;
    }
    setLoading(true);
    setError('');
    try {
      await confirmFoodLog(
        {
          userId: demoUserId,
          mealType,
          occurredAt,
          input,
          items: response.items.map((item) => ({
            foodId: item.food?.id ?? '',
            rawText: item.rawText,
            normalizedFoodName: item.normalizedFoodName,
            preparationState: null,
            quantity: item.quantity,
            unit: item.unit,
            grams: item.grams ?? 0,
            assumed: item.assumed,
            quantitySource: item.quantitySource,
          })),
        },
        crypto.randomUUID(),
      );
    } catch (caught) {
      setError(
        caught instanceof ApiClientError ? caught.message : 'Save failed',
      );
    } finally {
      setLoading(false);
    }
  }
  return (
    <main>
      <h1>Semantic Calorie Tracker</h1>
      <section className="panel">
        <label>
          Meal type
          <select
            value={mealType}
            onChange={(event) => setMealType(event.target.value as MealType)}
          >
            {mealTypes.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
        </label>
        <label>
          Foods
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            rows={8}
          />
        </label>
        <button onClick={preview} disabled={loading || !input.trim()}>
          {loading ? 'Working…' : 'Preview'}
        </button>
        {error && <p className="error">{error}</p>}
      </section>
      {response && (
        <section className="panel">
          <h2>{response.status}</h2>
          <table>
            <thead>
              <tr>
                {[
                  'Input',
                  'Resolved food',
                  'Quantity',
                  'Unit',
                  'Grams',
                  'Calories',
                  'Protein',
                  'Carbs',
                  'Fat',
                  'Fibre',
                  'Assumed',
                  'Confidence',
                  'Source',
                ].map((column) => (
                  <th key={column}>{column}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {response.items.map((item) => (
                <tr key={item.index}>
                  <td>{item.rawText}</td>
                  <td>{item.food?.name ?? 'Needs review'}</td>
                  <td>{item.quantity ?? '—'}</td>
                  <td>{item.unit ?? '—'}</td>
                  <td>{item.grams ?? '—'}</td>
                  <td>{item.nutrition?.calories ?? '—'}</td>
                  <td>{item.nutrition?.protein ?? '—'}</td>
                  <td>{item.nutrition?.carbohydrates ?? '—'}</td>
                  <td>{item.nutrition?.fat ?? '—'}</td>
                  <td>{item.nutrition?.fibre ?? '—'}</td>
                  <td>{item.assumed ? 'yes' : 'no'}</td>
                  <td>{item.resolutionConfidence.toFixed(2)}</td>
                  <td>{item.quantitySource}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <h2>Totals</h2>
          <p>
            {Object.entries(response.totals).map(([key, value]) => (
              <span className="total" key={key}>
                {key}: {value}
              </span>
            ))}
          </p>
          <button
            onClick={confirm}
            disabled={loading || response.status !== 'READY'}
          >
            Confirm and save
          </button>
          <details>
            <summary>Raw response</summary>
            <pre>{JSON.stringify(response, null, 2)}</pre>
          </details>
        </section>
      )}
    </main>
  );
}
