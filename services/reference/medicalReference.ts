/**
 * Static, offline maternal-health reference content — curated summaries of
 * publicly published WHO and India MoHFW (Ministry of Health & Family
 * Welfare) maternal-care guidance, bundled into the app itself.
 *
 * This is deliberately NOT a live API integration: no external medical
 * database credential is available in this environment, and rather than
 * fake a network call, this module ships a small, honestly-labeled static
 * reference set. `docs/INTEGRATIONS.md` documents exactly what a real
 * live-lookup adapter (with a real credential) would replace this with.
 *
 * This content is general education, never a substitute for a clinician,
 * and is presented as such everywhere it's shown (see HealthInfoScreen).
 */

export interface ReferenceEntry {
  id: string;
  question: string;
  answer: string;
  source: string;
}

export const MATERNAL_HEALTH_REFERENCE: ReferenceEntry[] = [
  {
    id: 'hb-normal-range',
    question: 'What is a normal hemoglobin (Hb) level during pregnancy?',
    answer:
      'WHO defines anemia in pregnancy as Hb below 11 g/dL. 10–10.9 g/dL is typically classed mild, 7–9.9 g/dL moderate, and below 7 g/dL severe anemia requiring urgent care. Hb below 7 g/dL, or any sudden sharp drop, needs immediate clinical evaluation.',
    source: 'WHO Haemoglobin thresholds for anaemia (2011, reaffirmed guidance)',
  },
  {
    id: 'bp-thresholds',
    question: 'What blood pressure reading is concerning in pregnancy?',
    answer:
      'A systolic reading of 140 mmHg or higher, or diastolic 90 mmHg or higher, on two occasions is classed as hypertension in pregnancy and needs clinical review. 160/110 mmHg or higher is a danger sign requiring urgent/emergency care, especially with headache, blurred vision, or swelling.',
    source: 'WHO recommendations on antenatal care & hypertensive disorders of pregnancy',
  },
  {
    id: 'anc-visit-schedule',
    question: 'How many ANC (antenatal care) visits are recommended, and when?',
    answer:
      "India's Ministry of Health & Family Welfare recommends at least 4 ANC visits: the first within 12 weeks, then in the second trimester, and two more in the third trimester (around 32 and 36 weeks). WHO's newer model recommends 8 total contacts for the best outcomes.",
    source: 'MoHFW India ANC guidelines; WHO Antenatal Care Recommendations (2016)',
  },
  {
    id: 'danger-signs',
    question: 'What symptoms during pregnancy need urgent medical attention?',
    answer:
      'Severe headache, blurred or dimmed vision, severe abdominal pain, heavy vaginal bleeding, reduced or absent fetal movement, high fever, convulsions, and severe swelling of the face/hands are all danger signs. Any one of these warrants immediate transport to a health facility, regardless of other readings.',
    source: 'WHO / MoHFW maternal danger-sign guidance used in ASHA/ANM field training',
  },
  {
    id: 'ifa-supplementation',
    question: 'Why are iron-folic acid (IFA) tablets given during pregnancy?',
    answer:
      "Iron and folic acid supplementation is recommended throughout pregnancy to prevent and treat anemia and reduce the risk of neural tube defects. India's Anemia Mukt Bharat programme recommends daily IFA tablets for all pregnant women, with dose review if Hb is already low.",
    source: 'MoHFW Anemia Mukt Bharat strategy; WHO antenatal iron supplementation guidance',
  },
  {
    id: 'gestational-age-meaning',
    question: 'What does "gestational age in weeks" mean?',
    answer:
      'Gestational age is the length of pregnancy, usually counted in weeks from the first day of the last menstrual period. A full-term pregnancy is about 37–40 weeks. It is used to judge whether growth, vitals, and screening findings are on track for that stage.',
    source: 'Standard obstetric definition (WHO / MoHFW ANC training materials)',
  },
];

export function searchReference(query: string): ReferenceEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return MATERNAL_HEALTH_REFERENCE;
  return MATERNAL_HEALTH_REFERENCE.filter(
    (e) => e.question.toLowerCase().includes(q) || e.answer.toLowerCase().includes(q)
  );
}
