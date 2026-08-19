import { describe, expect, it } from 'vitest';
import { buildExportPayload, EXPORT_SCHEMA_VERSION, parseImportPayload } from './schema';

const habit = {
  id: '018f7f6e-0000-7000-8000-000000000001',
  name: 'Deep work',
  color: '#4B8A5E',
  interval: 'daily' as const,
  target: 1,
  startDate: '2026-08-01',
  order: 0,
  createdAt: '2026-08-01T00:00:00.000Z',
  updatedAt: '2026-08-01T00:00:00.000Z',
};

const checkin = {
  id: '018f7f6e-0000-7000-8000-000000000002',
  habitId: habit.id,
  date: '2026-08-19',
  count: 2,
  createdAt: '2026-08-19T00:00:00.000Z',
  updatedAt: '2026-08-19T00:00:00.000Z',
};

describe('export/import round-trip', () => {
  it('round-trips habits and check-ins byte-for-byte through JSON', () => {
    const payload = buildExportPayload([habit], [checkin]);
    expect(payload.schemaVersion).toBe(EXPORT_SCHEMA_VERSION);
    const json = JSON.stringify(payload);
    const parsed = parseImportPayload(JSON.parse(json));
    expect(parsed).toEqual(payload);
  });
});

describe('parseImportPayload — untrusted input', () => {
  it('rejects a payload missing required habit fields', () => {
    expect(() =>
      parseImportPayload({ schemaVersion: 1, habits: [{ id: 'x' }], checkins: [] }),
    ).toThrow();
  });

  it('rejects a payload with a check-in count below 1', () => {
    expect(() =>
      parseImportPayload({
        schemaVersion: 1,
        habits: [habit],
        checkins: [{ ...checkin, count: 0 }],
      }),
    ).toThrow();
  });

  it('rejects non-object input entirely', () => {
    expect(() => parseImportPayload('not an object')).toThrow();
    expect(() => parseImportPayload(null)).toThrow();
    expect(() => parseImportPayload(42)).toThrow();
  });

  it('rejects an unknown/future schema version', () => {
    expect(() => parseImportPayload({ schemaVersion: 999, habits: [], checkins: [] })).toThrow();
  });
});
