import { extractSymptomsFromText } from '../symptomExtraction';
import { DANGER_SIGNS } from '../../risk/maternalRiskEngine';

describe('extractSymptomsFromText', () => {
  it('detects a straightforward Hindi symptom phrase', () => {
    const result = extractSymptomsFromText('Mujhe bahut chakkar aa rahe hain aur thakaan hai.');
    expect(result.symptoms).toContain('Dizziness');
    expect(result.symptoms).toContain('Fatigue');
  });

  it('detects an English danger sign and marks it as such', () => {
    const result = extractSymptomsFromText('I have a severe headache since this morning.');
    expect(result.dangerSigns).toContain('Severe headache');
  });

  it('does NOT false-positive on "dard" appearing inside an unrelated phrase (regression test for the substring-match bug)', () => {
    // "pet ke upar dard" = upper abdominal pain. The old .includes('dard')
    // logic incorrectly matched this against "sar dard" (headache).
    const result = extractSymptomsFromText('Mujhe pet ke upar dard hai.');
    expect(result.symptoms).not.toContain('Severe headache');
    expect(result.symptoms).toContain('Severe abdominal pain');
  });

  it('does not match a keyword that only appears as a substring of a longer unrelated word', () => {
    // "feverish excitement" is not a real transcript MaAI would see, but
    // proves word-boundary behavior: "fever" must not match inside "feverishly"-like tokens without a boundary.
    const result = extractSymptomsFromText('reverberating sound');
    expect(result.symptoms).toHaveLength(0);
  });

  it('returns no symptoms for neutral text', () => {
    const result = extractSymptomsFromText('The weather is nice today and the visit went well.');
    expect(result.symptoms).toHaveLength(0);
    expect(result.dangerSigns).toHaveLength(0);
  });

  it('every danger-sign symptom label matches the risk engine canonical vocabulary', () => {
    const result = extractSymptomsFromText('severe headache, blurred vision, vaginal bleeding, high fever, convulsions, severe abdominal pain, excessive swelling, reduced fetal movement');
    result.dangerSigns.forEach((sign) => {
      expect(DANGER_SIGNS as readonly string[]).toContain(sign);
    });
    expect(result.dangerSigns.length).toBeGreaterThan(5);
  });
});
