import { buildMotherReport, formatMotherReportAsText } from '../motherReportGenerator';
import { Mother } from '../../../types/mother';
import { ScreeningResult } from '../../../types/screening';
import { Visit, Referral } from '../../../types/domain';

const baseMother: Mother = {
  id: 'moth-1',
  name: 'Priya Sharma',
  age: 24,
  phone: '+91 98123 45678',
  village: 'Rampur',
  emergencyContact: '+91 98123 99999',
  gestationalAgeWeeks: 28,
  expectedDeliveryDate: '2026-11-20',
  gravida: 2,
  para: 1,
  riskLevel: 'MEDIUM',
  riskReason: 'Hemoglobin declining across three readings.',
  createdAt: '2026-06-01T00:00:00.000Z',
  updatedAt: '2026-08-28T00:00:00.000Z',
  readings: [
    { id: 'v1', week: 20, date: '2026-06-15', hemoglobin: 10.4, riskLevel: 'LOW', source: 'CLINICAL_VISIT' },
    { id: 'v2', week: 28, date: '2026-08-28', hemoglobin: 9.1, riskLevel: 'MEDIUM', source: 'REPORT_OCR' },
  ],
  currentSymptoms: ['Fatigue'],
};

describe('buildMotherReport', () => {
  it('includes identity, risk, and vitals history sections drawn from real data', () => {
    const report = buildMotherReport(baseMother, [], [], [], 'Test Worker');
    const titles = report.sections.map((s) => s.title);
    expect(titles).toContain('Identity & Pregnancy');
    expect(titles).toContain('Current Risk Status');
    expect(titles).toContain('Vitals History');

    const vitalsSection = report.sections.find((s) => s.title === 'Vitals History')!;
    expect(vitalsSection.lines.some((l) => l.includes('9.1 g/dL'))).toBe(true);
    expect(vitalsSection.lines.some((l) => l.includes('Lab report (OCR)'))).toBe(true);
  });

  it('omits sections for data that does not exist rather than showing empty ones', () => {
    const motherWithNoExtras: Mother = { ...baseMother, readings: undefined, currentSymptoms: undefined };
    const report = buildMotherReport(motherWithNoExtras, [], [], [], 'Test Worker');
    const titles = report.sections.map((s) => s.title);
    expect(titles).not.toContain('Vitals History');
    expect(titles).not.toContain('Reported Symptoms');
  });

  it('includes screening, visit, and referral history when present', () => {
    const screening: ScreeningResult = {
      id: 'scr-1', motherId: 'moth-1', motherName: 'Priya Sharma', gestationalAgeWeeks: 28,
      timestamp: '8/28/2026', type: 'VISUAL_ANEMIA', overallRisk: 'MEDIUM', anemiaRisk: 'MEDIUM',
      pregnancyRisk: 'MEDIUM', symptomRisk: 'LOW', reasons: ['Elevated pallor detected'],
      recommendation: 'Confirm with lab test.', isPrototypeEngine: true,
    };
    const visit: Visit = { id: 'vis-1', motherId: 'moth-1', visitType: 'ANC', createdAt: '2026-08-01T00:00:00.000Z' };
    const referral: Referral = { id: 'ref-1', motherId: 'moth-1', riskLevel: 'MEDIUM', findings: ['Hb declining'], recommendation: 'Refer to PHC', createdAt: '2026-08-29T00:00:00.000Z' };

    const report = buildMotherReport(baseMother, [screening], [visit], [referral], 'Test Worker');
    const titles = report.sections.map((s) => s.title);
    expect(titles).toContain('Screening History');
    expect(titles).toContain('Visits');
    expect(titles).toContain('Referral History');
  });

  it('always includes a non-diagnostic disclaimer section', () => {
    const report = buildMotherReport(baseMother, [], [], [], 'Test Worker');
    const disclaimer = report.sections.find((s) => s.title === 'Disclaimer');
    expect(disclaimer).toBeDefined();
    expect(disclaimer!.lines[0]).toMatch(/not a medical diagnosis/i);
  });
});

describe('formatMotherReportAsText', () => {
  it('renders the mother name and every section title into the text output', () => {
    const report = buildMotherReport(baseMother, [], [], [], 'Test Worker');
    const text = formatMotherReportAsText(report);
    expect(text).toContain('Priya Sharma');
    for (const section of report.sections) {
      expect(text).toContain(section.title.toUpperCase());
    }
  });
});
