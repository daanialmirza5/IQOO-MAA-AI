import { DANGER_SIGNS } from '../risk/maternalRiskEngine';

export interface SymptomKeywordEntry {
  /** Word-boundary-matched keywords/phrases (Hindi and English), never loose substrings. */
  keywords: string[];
  symptom: string;
  isDangerSign: boolean;
}

/**
 * Transparent, testable keyword dictionary — deliberately NOT presented to
 * users as "AI" or "NLP". Every keyword is matched with a word-boundary
 * regex, not `.includes()`, which previously caused false positives (e.g.
 * the Hindi word "dard" alone matching inside unrelated phrases like "pet ke
 * upar dard" — upper abdominal pain — and incorrectly firing "Severe
 * headache"). Danger signs use the exact same canonical vocabulary as the
 * risk engine (DANGER_SIGNS) so a symptom detected here is guaranteed to be
 * recognized by the risk engine too.
 */
const KEYWORD_DICTIONARY: SymptomKeywordEntry[] = [
  { keywords: ['thakaan', 'thakan', 'fatigue', 'tired', 'kamzori', 'kamzor'], symptom: 'Fatigue', isDangerSign: false },
  { keywords: ['chakkar', 'dizziness', 'dizzy', 'fainting', 'behosh'], symptom: 'Dizziness', isDangerSign: false },
  { keywords: ['sujan', 'swelling', 'edema', 'sooj'], symptom: 'Excessive swelling', isDangerSign: true },
  { keywords: ['sar dard', 'sar mein dard', 'headache', 'severe headache'], symptom: 'Severe headache', isDangerSign: true },
  { keywords: ['dhundhla', 'dhundla', 'blurred vision', 'blurry vision', 'vision problem'], symptom: 'Blurred vision', isDangerSign: true },
  { keywords: ['khoon', 'bleeding', 'blood loss', 'raktsraav'], symptom: 'Vaginal bleeding', isDangerSign: true },
  { keywords: ['bukhar', 'fever', 'high fever', 'tez bukhar'], symptom: 'High fever', isDangerSign: true },
  { keywords: ['baby not moving', 'no movement', 'reduced movement', 'bachcha nahi hil raha'], symptom: 'Reduced fetal movement', isDangerSign: true },
  { keywords: ['convulsion', 'seizure', 'jhatke', 'daure'], symptom: 'Convulsions', isDangerSign: true },
  { keywords: ['pet dard', 'pet mein dard', 'pet ke upar dard', 'pet me dard', 'abdominal pain', 'stomach pain', 'severe abdominal pain'], symptom: 'Severe abdominal pain', isDangerSign: true },
  { keywords: ['saans', 'breathless', 'breathlessness', 'shortness of breath'], symptom: 'Breathlessness', isDangerSign: false },
];

// Sanity check at module load: every danger-sign symptom label here must
// exist in the canonical DANGER_SIGNS vocabulary used by the risk engine,
// so a match here is never silently ignored by risk scoring.
KEYWORD_DICTIONARY.filter((e) => e.isDangerSign).forEach((entry) => {
  if (!(DANGER_SIGNS as readonly string[]).includes(entry.symptom)) {
    console.warn(`Symptom "${entry.symptom}" is marked as a danger sign but is not in the risk engine's DANGER_SIGNS list.`);
  }
});

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export interface SymptomExtractionResult {
  symptoms: string[];
  dangerSigns: string[];
  matchedPhrases: { symptom: string; matchedText: string }[];
}

/**
 * Word-boundary matching against the dictionary above. `\b` correctly
 * handles both English words and the transliterated Hindi phrases here
 * since they're stored as plain Latin-script tokens.
 */
export function extractSymptomsFromText(text: string): SymptomExtractionResult {
  const lower = text.toLowerCase();
  const symptoms = new Set<string>();
  const dangerSigns = new Set<string>();
  const matchedPhrases: { symptom: string; matchedText: string }[] = [];

  for (const entry of KEYWORD_DICTIONARY) {
    for (const keyword of entry.keywords) {
      const pattern = new RegExp(`\\b${escapeRegExp(keyword)}\\b`, 'i');
      const match = lower.match(pattern);
      if (match) {
        symptoms.add(entry.symptom);
        if (entry.isDangerSign) dangerSigns.add(entry.symptom);
        matchedPhrases.push({ symptom: entry.symptom, matchedText: match[0] });
        break;
      }
    }
  }

  return { symptoms: Array.from(symptoms), dangerSigns: Array.from(dangerSigns), matchedPhrases };
}

/** All symptoms selectable in the native quick-select picker (danger signs first). */
export const QUICK_SELECT_SYMPTOMS = KEYWORD_DICTIONARY.map((e) => ({ symptom: e.symptom, isDangerSign: e.isDangerSign })).sort(
  (a, b) => Number(b.isDangerSign) - Number(a.isDangerSign)
);
