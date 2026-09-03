import { evaluateUnifiedMaternalRisk, evaluateRiskFromRawInputs, DANGER_SIGNS, RISK_THRESHOLDS } from '../maternalRiskEngine';
import { Mother } from '../../../types/mother';

function baseMother(overrides: Partial<Mother> = {}): Mother {
  return {
    id: 'm1',
    name: 'Test Mother',
    age: 26,
    phone: '+91 90000 00000',
    village: 'Test Village',
    emergencyContact: '+91 90000 00001',
    gestationalAgeWeeks: 24,
    expectedDeliveryDate: '2026-12-01',
    gravida: 1,
    para: 0,
    riskLevel: 'LOW',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    ...overrides,
  };
}

describe('evaluateUnifiedMaternalRisk', () => {
  it('returns LOW risk for a healthy mother with no risk factors', () => {
    const result = evaluateUnifiedMaternalRisk({
      mother: baseMother({ hemoglobin: 12.5, bloodPressure: '110/70' }),
    });
    expect(result.overallRisk).toBe('LOW');
    expect(result.followUpRequired).toBe(false);
    expect(result.referralRecommended).toBe(false);
  });

  it('flags HIGH risk on severe low hemoglobin alone', () => {
    const result = evaluateUnifiedMaternalRisk({
      mother: baseMother({ hemoglobin: 8.5 }),
    });
    expect(result.score).toBeGreaterThanOrEqual(RISK_THRESHOLDS.high);
    expect(result.overallRisk).toBe('HIGH');
  });

  it('flags HIGH risk on hypertensive BP alone', () => {
    const result = evaluateUnifiedMaternalRisk({
      mother: baseMother({ bloodPressure: '150/95' }),
    });
    expect(result.overallRisk).toBe('HIGH');
  });

  it.each(DANGER_SIGNS)(
    'ALWAYS returns HIGH risk when the danger sign "%s" is present, even with an otherwise-low score',
    (sign) => {
      const result = evaluateUnifiedMaternalRisk({
        mother: baseMother({ hemoglobin: 12.5, bloodPressure: '110/70', currentSymptoms: [sign] }),
      });
      expect(result.overallRisk).toBe('HIGH');
      expect(result.whyFlagged.join(' ')).toContain(sign);
    }
  );

  it('does NOT treat a substring match as a danger sign (word-boundary safety)', () => {
    // "dard" (Hindi for "pain") appearing inside a symptom string that is
    // NOT one of the canonical danger-sign labels must not falsely trigger.
    const result = evaluateUnifiedMaternalRisk({
      mother: baseMother({ hemoglobin: 12.5, bloodPressure: '110/70', currentSymptoms: ['Mild upper abdominal discomfort'] }),
    });
    expect(result.overallRisk).toBe('LOW');
  });

  it('detects a declining Hb trajectory across readings and returns MEDIUM even if the latest single value looks fine', () => {
    const result = evaluateUnifiedMaternalRisk({
      mother: baseMother({
        hemoglobin: 11.2,
        readings: [
          { id: 'r1', week: 20, date: '2026-06-01', hemoglobin: 12.0, riskLevel: 'LOW', source: 'CLINICAL_VISIT' },
          { id: 'r2', week: 24, date: '2026-07-01', hemoglobin: 11.2, riskLevel: 'LOW', source: 'CLINICAL_VISIT' },
        ],
      }),
    });
    expect(result.trajectoryTrend).toBe('DECLINING');
    expect(result.overallRisk).not.toBe('LOW');
  });

  it('detects a rising BP trajectory', () => {
    const result = evaluateUnifiedMaternalRisk({
      mother: baseMother({
        readings: [
          { id: 'r1', week: 26, date: '2026-06-01', bloodPressure: '118/76', riskLevel: 'LOW', source: 'CLINICAL_VISIT' },
          { id: 'r2', week: 30, date: '2026-07-01', bloodPressure: '135/84', riskLevel: 'LOW', source: 'CLINICAL_VISIT' },
        ],
      }),
    });
    expect(result.riskFactors).toContain('Upward BP Trajectory');
  });

  it('handles a mother with no readings/vitals gracefully (missing-data edge case)', () => {
    const result = evaluateUnifiedMaternalRisk({ mother: baseMother() });
    expect(result.overallRisk).toBe('LOW');
    expect(result.whyFlagged.length).toBeGreaterThan(0);
  });

  it('accumulates multiple moderate factors into MEDIUM risk', () => {
    const result = evaluateUnifiedMaternalRisk({
      mother: baseMother({ hemoglobin: 10.5, bloodPressure: '132/86' }),
    });
    expect(result.overallRisk).toBe('MEDIUM');
  });

  it('always sets requiresClinicalConfirmation to true (never claims a final diagnosis)', () => {
    const result = evaluateUnifiedMaternalRisk({ mother: baseMother({ hemoglobin: 7.0 }) });
    expect(result.requiresClinicalConfirmation).toBe(true);
  });
});

describe('evaluateRiskFromRawInputs', () => {
  it('produces the same HIGH classification as the full-Mother path for equivalent inputs', () => {
    const result = evaluateRiskFromRawInputs({
      age: 26,
      gestationalAgeWeeks: 28,
      gravida: 2,
      para: 1,
      hemoglobin: 8.2,
    });
    expect(result.overallRisk).toBe('HIGH');
  });

  it('flags maternal age risk for teenage pregnancies', () => {
    const result = evaluateRiskFromRawInputs({ age: 16, gestationalAgeWeeks: 20, gravida: 1, para: 0 });
    expect(result.riskFactors).toContain('Maternal Age Risk');
  });
});
