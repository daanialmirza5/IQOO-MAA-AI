import { Mother } from '../../types/mother';
import { ScreeningResult } from '../../types/screening';
import { Visit, Referral } from '../../types/domain';

/**
 * Deterministic compiler that assembles a mother's full stored record into
 * one structured, shareable report. Every line here is drawn directly from
 * data already in SQLite — nothing is invented or summarized by an LLM. If a
 * future AI validation pass wants to add plain-language explanation on top,
 * it explains this structured output; it never replaces it (see
 * services/ai/aiValidationService.ts).
 */

export interface MotherReportSection {
  title: string;
  lines: string[];
}

export interface MotherReport {
  motherName: string;
  generatedAt: string;
  generatedBy: string;
  sections: MotherReportSection[];
}

const SOURCE_LABELS: Record<string, string> = {
  REPORT_OCR: 'Lab report (OCR)',
  CLINICAL_VISIT: 'Clinical visit',
  VISUAL_SCREENING: 'Camera screening',
  VOICE_CHECKIN: 'Voice check-in',
  REGISTRATION: 'Registration',
};

const SCREENING_TYPE_LABELS: Record<string, string> = {
  VISUAL_ANEMIA: 'Vision — Pallor Screening',
  REPORT_OCR: 'Lab Report OCR',
  VOICE_CHECKIN: 'Voice Check-in',
  PREGNANCY_RISK: 'Risk Assessment',
  SYMPTOM_CHECK: 'Danger Sign Checklist',
  COMBINED: 'Combined Screening',
};

export function buildMotherReport(
  mother: Mother,
  screenings: ScreeningResult[],
  visits: Visit[],
  referrals: Referral[],
  generatedBy: string
): MotherReport {
  const sections: MotherReportSection[] = [];

  sections.push({
    title: 'Identity & Pregnancy',
    lines: [
      `Name: ${mother.name} (${mother.age} years)`,
      `Village/Area: ${mother.village}`,
      `Phone: ${mother.phone}`,
      `Emergency Contact: ${mother.emergencyContact}`,
      `Gestational Age: ${mother.gestationalAgeWeeks} weeks`,
      `Expected Delivery Date: ${mother.expectedDeliveryDate || 'Not set'}`,
      `Obstetric History: Gravida ${mother.gravida}, Para ${mother.para}`,
      mother.previousComplications ? `Previous Complications: ${mother.previousComplications}` : 'Previous Complications: None recorded',
      `Blood Group: ${mother.bloodGroup || 'Not tested'}`,
    ],
  });

  sections.push({
    title: 'Current Risk Status',
    lines: [
      `Overall Risk: ${mother.riskLevel}`,
      mother.riskReason || 'No specific reason recorded.',
      mother.hbTrend ? `Hemoglobin Trend: ${mother.hbTrend}` : '',
      mother.bpTrend ? `Blood Pressure Trend: ${mother.bpTrend}` : '',
    ].filter(Boolean),
  });

  if (mother.readings && mother.readings.length > 0) {
    sections.push({
      title: 'Vitals History',
      lines: mother.readings.map((r) => {
        const parts = [`Week ${r.week}`, r.date];
        if (r.hemoglobin != null) parts.push(`Hb ${r.hemoglobin} g/dL`);
        if (r.bloodPressure) parts.push(`BP ${r.bloodPressure}`);
        if (r.weight != null) parts.push(`Weight ${r.weight} kg`);
        parts.push(`[${SOURCE_LABELS[r.source] || r.source}]`);
        return parts.join(' · ');
      }),
    });
  }

  if (mother.currentSymptoms && mother.currentSymptoms.length > 0) {
    sections.push({
      title: 'Reported Symptoms',
      lines: mother.currentSymptoms,
    });
  }

  if (screenings.length > 0) {
    sections.push({
      title: 'Screening History',
      lines: screenings.map(
        (s) => `${SCREENING_TYPE_LABELS[s.type] || s.type} — ${s.timestamp} — ${s.overallRisk} risk — ${s.reasons[0] || ''}`
      ),
    });
  }

  if (visits.length > 0) {
    sections.push({
      title: 'Visits',
      lines: visits.map((v) => `${v.visitType.replace('_', ' ')} — ${v.createdAt}${v.notes ? ` — ${v.notes}` : ''}`),
    });
  }

  if (referrals.length > 0) {
    sections.push({
      title: 'Referral History',
      lines: referrals.map((r) => `${r.createdAt} — ${r.riskLevel} risk — ${r.recommendation}`),
    });
  }

  sections.push({
    title: 'Disclaimer',
    lines: [
      'This report compiles field-recorded and screening data for clinical handoff. It is decision support for frontline health workers, not a medical diagnosis. All findings should be confirmed with clinical or laboratory assessment.',
    ],
  });

  return {
    motherName: mother.name,
    generatedAt: new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }),
    generatedBy,
    sections,
  };
}

export function formatMotherReportAsText(report: MotherReport): string {
  const header = `*MaAI Maternal Health Summary*\n${report.motherName}\nGenerated ${report.generatedAt} by ${report.generatedBy}\n${'='.repeat(42)}`;
  const body = report.sections
    .map((s) => `*${s.title.toUpperCase()}*\n${s.lines.map((l) => `• ${l}`).join('\n')}`)
    .join('\n\n');
  return `${header}\n\n${body}`;
}
