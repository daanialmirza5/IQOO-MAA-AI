import { searchReference, MATERNAL_HEALTH_REFERENCE } from '../medicalReference';

describe('searchReference', () => {
  it('returns every entry for an empty query', () => {
    expect(searchReference('')).toHaveLength(MATERNAL_HEALTH_REFERENCE.length);
  });

  it('matches a query against the question text', () => {
    const results = searchReference('hemoglobin');
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((r) => r.question.toLowerCase().includes('hemoglobin') || r.answer.toLowerCase().includes('hemoglobin'))).toBe(true);
  });

  it('matches a query against the answer text even if not in the question', () => {
    const results = searchReference('140 mmhg');
    expect(results.some((r) => r.id === 'bp-thresholds')).toBe(true);
  });

  it('is case-insensitive', () => {
    expect(searchReference('ANC VISIT')).toEqual(searchReference('anc visit'));
  });

  it('returns an empty array for a query matching nothing', () => {
    expect(searchReference('xyz-nonexistent-topic')).toHaveLength(0);
  });

  it('every entry cites a source', () => {
    expect(MATERNAL_HEALTH_REFERENCE.every((e) => e.source.length > 0)).toBe(true);
  });
});
