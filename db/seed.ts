import { motherRepository } from './repositories/motherRepository';
import { alertRepository } from './repositories/alertRepository';
import { Mother } from '../types/mother';

/**
 * Realistic DEMO data only — every mother created here is flagged
 * `isDemoData: true` at the storage layer so it can never be confused with
 * real field data, and so a future "clear demo data" action can target it
 * precisely. Five mothers, five distinct clinically-realistic trajectories,
 * matching what an ASHA worker's caseload actually looks like.
 */

type SeedMother = Omit<Mother, 'id' | 'createdAt' | 'updatedAt' | 'timeline' | 'readings'> & {
  vitals: { week: number; date: string; hemoglobin?: number; bloodPressure?: string; weight?: number; riskLevel: Mother['riskLevel']; notes: string; source: 'CLINICAL_VISIT' | 'REPORT_OCR' | 'VISUAL_SCREENING' | 'VOICE_CHECKIN' | 'REGISTRATION' }[];
  alert?: { priority: 'URGENT' | 'HIGH_PRIORITY' | 'FOLLOW_UP'; title: string; description: string; actionRequired: string; category: string };
};

const SEED_MOTHERS: SeedMother[] = [
  {
    // A — stable pregnancy
    name: 'Meena Kumari',
    age: 26,
    phone: '+91 98567 89012',
    village: 'Rampur',
    emergencyContact: '+91 98567 55555 (Husband)',
    gestationalAgeWeeks: 22,
    expectedDeliveryDate: '2026-12-28',
    gravida: 1,
    para: 0,
    bloodGroup: 'B+',
    riskLevel: 'LOW',
    riskReason: 'All vitals within normal range across three visits.',
    vitals: [
      { week: 14, date: '2026-05-25', hemoglobin: 12.3, bloodPressure: '112/74', weight: 52, riskLevel: 'LOW', notes: 'Routine first ANC visit.', source: 'CLINICAL_VISIT' },
      { week: 18, date: '2026-06-22', hemoglobin: 12.1, bloodPressure: '116/76', weight: 54, riskLevel: 'LOW', notes: 'Vitals stable.', source: 'CLINICAL_VISIT' },
      { week: 22, date: '2026-07-20', hemoglobin: 12.1, bloodPressure: '120/78', weight: 55.5, riskLevel: 'LOW', notes: 'All vitals normal.', source: 'CLINICAL_VISIT' },
    ],
  },
  {
    // B — slow Hb decline
    name: 'Priya Sharma',
    age: 24,
    phone: '+91 98123 45678',
    village: 'Rampur',
    emergencyContact: '+91 98123 99999 (Husband - Ramesh)',
    gestationalAgeWeeks: 28,
    expectedDeliveryDate: '2026-11-20',
    gravida: 2,
    para: 1,
    previousComplications: 'Postpartum anemia after first delivery',
    bloodGroup: 'B+',
    existingConditions: ['Mild anemia history'],
    riskLevel: 'MEDIUM',
    riskReason: 'Hemoglobin declining across three consecutive readings (10.4 → 9.8 → 9.1 g/dL).',
    vitals: [
      { week: 20, date: '2026-06-15', hemoglobin: 10.4, bloodPressure: '118/76', weight: 51, riskLevel: 'LOW', notes: 'Routine ANC checkup.', source: 'CLINICAL_VISIT' },
      { week: 24, date: '2026-07-14', hemoglobin: 9.8, bloodPressure: '122/78', weight: 52.5, riskLevel: 'LOW', notes: 'Lab report shows mild Hb drop.', source: 'REPORT_OCR' },
      { week: 28, date: '2026-08-28', hemoglobin: 9.1, bloodPressure: '124/80', weight: 54, riskLevel: 'MEDIUM', notes: 'Continued decline; fatigue reported.', source: 'VOICE_CHECKIN' },
    ],
    alert: {
      priority: 'FOLLOW_UP',
      title: 'Declining hemoglobin trend',
      description: 'Hb has dropped from 10.4 to 9.1 g/dL over three visits (8 weeks).',
      actionRequired: 'Schedule a home visit and repeat Hb test; reinforce daily IFA compliance.',
      category: 'ANEMIA_TREND',
    },
  },
  {
    // C — elevated BP trend
    name: 'Anita Verma',
    age: 29,
    phone: '+91 98234 56789',
    village: 'Sector 4',
    emergencyContact: '+91 98234 88888 (Husband)',
    gestationalAgeWeeks: 34,
    expectedDeliveryDate: '2026-10-10',
    gravida: 3,
    para: 2,
    previousComplications: 'Pre-eclampsia in first pregnancy',
    bloodGroup: 'O+',
    existingConditions: ['Gestational hypertension'],
    currentSymptoms: ['Swelling in feet'],
    riskLevel: 'HIGH',
    riskReason: 'Blood pressure has risen from 122/80 to 142/92 mmHg with a prior pre-eclampsia history.',
    vitals: [
      { week: 26, date: '2026-06-20', hemoglobin: 11.4, bloodPressure: '122/80', weight: 58, riskLevel: 'LOW', notes: 'BP within normal range.', source: 'CLINICAL_VISIT' },
      { week: 30, date: '2026-07-25', hemoglobin: 11.0, bloodPressure: '132/86', weight: 60, riskLevel: 'MEDIUM', notes: 'BP trending upward; advised rest and salt restriction.', source: 'CLINICAL_VISIT' },
      { week: 34, date: '2026-08-25', hemoglobin: 10.8, bloodPressure: '142/92', weight: 62, riskLevel: 'HIGH', notes: 'BP crossed pre-eclampsia threshold.', source: 'CLINICAL_VISIT' },
    ],
    alert: {
      priority: 'URGENT',
      title: 'Elevated blood pressure with pre-eclampsia history',
      description: 'BP recorded at 142/92 mmHg at 34 weeks with prior pre-eclampsia in first pregnancy.',
      actionRequired: 'Urgent referral to Medical Officer at District Hospital.',
      category: 'HIGH_BP',
    },
  },
  {
    // D — danger symptom, immediate high risk
    name: 'Kavita Yadav',
    age: 31,
    phone: '+91 98456 78901',
    village: 'Sector 4',
    emergencyContact: '+91 98456 66666 (Husband)',
    gestationalAgeWeeks: 30,
    expectedDeliveryDate: '2026-11-05',
    gravida: 2,
    para: 1,
    bloodGroup: 'AB+',
    currentSymptoms: ['Severe headache', 'Blurred vision'],
    riskLevel: 'HIGH',
    riskReason: 'Danger symptom reported: severe headache with blurred vision — immediate evaluation required regardless of other vitals.',
    vitals: [
      { week: 26, date: '2026-07-01', hemoglobin: 11.6, bloodPressure: '124/80', weight: 57, riskLevel: 'LOW', notes: 'Routine visit, normal.', source: 'CLINICAL_VISIT' },
      { week: 30, date: '2026-08-27', hemoglobin: 11.2, bloodPressure: '128/84', weight: 58, riskLevel: 'HIGH', notes: 'Reported severe headache and blurred vision during voice check-in.', source: 'VOICE_CHECKIN' },
    ],
    alert: {
      priority: 'URGENT',
      title: 'Danger symptom reported: severe headache + blurred vision',
      description: 'Voice check-in captured a maternal danger sign. Immediate clinical evaluation required.',
      actionRequired: 'Contact mother immediately and arrange transport to the nearest facility.',
      category: 'DANGER_SIGN',
    },
  },
  {
    // E — ANC overdue
    name: 'Sunita Devi',
    age: 22,
    phone: '+91 98345 67890',
    village: 'Rampur',
    emergencyContact: '+91 98345 77777',
    gestationalAgeWeeks: 18,
    expectedDeliveryDate: '2027-01-30',
    gravida: 1,
    para: 0,
    bloodGroup: 'A+',
    riskLevel: 'LOW',
    riskReason: 'Vitals normal at registration, but the scheduled 16-week ANC visit was missed.',
    vitals: [
      { week: 12, date: '2026-06-01', hemoglobin: 11.8, bloodPressure: '118/76', weight: 48, riskLevel: 'LOW', notes: 'First pregnancy registered. Normal baseline.', source: 'REGISTRATION' },
    ],
    alert: {
      priority: 'FOLLOW_UP',
      title: '16-week ANC visit overdue',
      description: 'Scheduled follow-up visit was missed by 9 days.',
      actionRequired: 'Perform home visit and reschedule ANC checkup.',
      category: 'ANC_DUE',
    },
  },
];

export async function seedDemoData(): Promise<void> {
  for (const seed of SEED_MOTHERS) {
    const { vitals, alert, ...motherInput } = seed;
    const mother = await motherRepository.create(
      {
        ...motherInput,
        // Deliberately omit hemoglobin/bloodPressure/weight here: create()
        // would otherwise insert its own "initial vital" tagged at the
        // mother's CURRENT gestational age, which is wrong for seed data
        // where the full historical trajectory (including the first visit,
        // at an earlier week) is about to be inserted explicitly below.
      },
      true
    );

    for (const v of vitals) {
      await motherRepository.addVital(mother.id, v);
      // create() already logged one REGISTRATION activity entry; only add
      // events for the subsequent visits to avoid a duplicate first entry.
      if (v.source !== 'REGISTRATION') {
        await motherRepository.addActivityEvent(
          mother.id,
          {
            title: `ANC Visit — Week ${v.week}`,
            description: v.notes,
            type: 'ANC_VISIT',
            riskLevel: v.riskLevel,
          },
          v.date
        );
      }
    }

    if (seed.currentSymptoms?.length) {
      await motherRepository.addSymptoms(mother.id, seed.currentSymptoms, 'MANUAL', seed.riskLevel === 'HIGH' ? seed.currentSymptoms : []);
    }

    await motherRepository.updateRisk(mother.id, seed.riskLevel, seed.riskReason || '');

    if (alert) {
      await alertRepository.create({
        motherId: mother.id,
        priority: alert.priority,
        title: alert.title,
        description: alert.description,
        actionRequired: alert.actionRequired,
        category: alert.category,
      });
    }
  }
}
