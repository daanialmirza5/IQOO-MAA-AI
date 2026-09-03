import { isAiValidationConfigured, explainRiskAssessment, validateOcrFields } from '../aiValidationService';

describe('aiValidationService — unconfigured (default, no backend proxy in this build)', () => {
  const originalEnv = process.env.EXPO_PUBLIC_AI_VALIDATION_ENDPOINT;

  afterEach(() => {
    process.env.EXPO_PUBLIC_AI_VALIDATION_ENDPOINT = originalEnv;
  });

  it('reports itself as not configured when no endpoint env var is set', () => {
    delete process.env.EXPO_PUBLIC_AI_VALIDATION_ENDPOINT;
    expect(isAiValidationConfigured()).toBe(false);
  });

  it('explainRiskAssessment resolves to a typed NOT_CONFIGURED result instead of throwing or faking a response', async () => {
    delete process.env.EXPO_PUBLIC_AI_VALIDATION_ENDPOINT;
    const result = await explainRiskAssessment({ overallRisk: 'HIGH', reasons: ['Danger symptom reported'] });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('NOT_CONFIGURED');
    }
  });

  it('validateOcrFields resolves to a typed NOT_CONFIGURED result instead of throwing or faking a response', async () => {
    delete process.env.EXPO_PUBLIC_AI_VALIDATION_ENDPOINT;
    const result = await validateOcrFields('Hb: 9.1 g/dL', { hemoglobin: 9.1 });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('NOT_CONFIGURED');
    }
  });

  it('reports itself as configured once an endpoint env var is set', () => {
    process.env.EXPO_PUBLIC_AI_VALIDATION_ENDPOINT = 'https://example.com/ai/validate';
    expect(isAiValidationConfigured()).toBe(true);
  });
});
