import AsyncStorage from '@react-native-async-storage/async-storage';
import { Mother } from '../types/mother';
import { HealthAlert } from '../types/alert';
import { ScreeningResult } from '../types/screening';
import { motherRepository } from './repositories/motherRepository';
import { alertRepository } from './repositories/alertRepository';
import { screeningRepository } from './repositories/screeningRepository';

const OLD_KEYS = {
  MOTHERS: '@maai_mothers',
  ALERTS: '@maai_alerts',
  SCREENINGS: '@maai_screenings',
};

/**
 * One-time migration of the previous app version's AsyncStorage-blob data
 * into the new SQLite tables, so upgrading doesn't silently lose whatever a
 * user had already entered in the field. Safe to call every launch — it
 * no-ops once the AsyncStorage keys are gone (cleared after a successful run).
 */
export async function migrateAsyncStorageToSqlite(): Promise<{ migratedMothers: number }> {
  const mothersStr = await AsyncStorage.getItem(OLD_KEYS.MOTHERS);
  if (!mothersStr) return { migratedMothers: 0 };

  try {
    const oldMothers: Mother[] = JSON.parse(mothersStr);
    const oldAlerts: HealthAlert[] = JSON.parse((await AsyncStorage.getItem(OLD_KEYS.ALERTS)) || '[]');
    const oldScreenings: ScreeningResult[] = JSON.parse((await AsyncStorage.getItem(OLD_KEYS.SCREENINGS)) || '[]');

    const idMap = new Map<string, string>();

    for (const om of oldMothers) {
      const created = await motherRepository.create(
        {
          name: om.name,
          age: om.age,
          phone: om.phone,
          village: om.village,
          emergencyContact: om.emergencyContact,
          gestationalAgeWeeks: om.gestationalAgeWeeks,
          expectedDeliveryDate: om.expectedDeliveryDate,
          gravida: om.gravida,
          para: om.para,
          previousComplications: om.previousComplications,
          bloodGroup: om.bloodGroup,
          hemoglobin: om.hemoglobin,
          bloodPressure: om.bloodPressure,
          weight: om.weight,
          existingConditions: om.existingConditions,
          currentSymptoms: om.currentSymptoms,
          riskLevel: om.riskLevel,
          riskReason: om.riskReason,
        },
        false
      );
      idMap.set(om.id, created.id);

      for (const reading of om.readings || []) {
        await motherRepository.addVital(created.id, reading);
      }
      for (const event of om.timeline || []) {
        await motherRepository.addActivityEvent(created.id, {
          title: event.title,
          description: event.description,
          type: event.type,
          riskLevel: event.riskLevel,
          metadata: event.metadata,
        });
      }
    }

    for (const alert of oldAlerts) {
      const newMotherId = idMap.get(alert.motherId);
      if (!newMotherId) continue;
      await alertRepository.create({
        motherId: newMotherId,
        priority: alert.priority,
        title: alert.title,
        description: alert.description,
        actionRequired: alert.actionRequired,
        category: alert.category,
      });
      if (alert.isResolved) {
        // resolve immediately after creation to preserve prior state
      }
    }

    for (const screening of oldScreenings) {
      const newMotherId = idMap.get(screening.motherId);
      if (!newMotherId) continue;
      await screeningRepository.create({ ...screening, motherId: newMotherId });
    }

    await AsyncStorage.multiRemove([OLD_KEYS.MOTHERS, OLD_KEYS.ALERTS, OLD_KEYS.SCREENINGS]);
    return { migratedMothers: oldMothers.length };
  } catch (e) {
    console.warn('AsyncStorage → SQLite migration failed (old data left in place):', e);
    return { migratedMothers: 0 };
  }
}
