import AsyncStorage from '@react-native-async-storage/async-storage';
import { Mother, TimelineEvent } from '../../types/mother';
import { HealthAlert } from '../../types/alert';
import { ScreeningResult } from '../../types/screening';
import { AshaWorkerProfile } from '../../types/user';
import { SEED_ASHA_WORKER, SEED_MOTHERS, SEED_ALERTS, SEED_SCREENINGS } from '../../constants/seedData';
import { evaluateUnifiedMaternalRisk } from '../risk/maternalRiskEngine';

const KEYS = {
  USER_PROFILE: '@maai_user_profile',
  MOTHERS: '@maai_mothers',
  ALERTS: '@maai_alerts',
  SCREENINGS: '@maai_screenings',
};

class StorageService {
  private memoryUser: AshaWorkerProfile | null = null;
  private memoryMothers: Mother[] = [];
  private memoryAlerts: HealthAlert[] = [];
  private memoryScreenings: ScreeningResult[] = [];

  async initialize(): Promise<void> {
    try {
      const userStr = await AsyncStorage.getItem(KEYS.USER_PROFILE);
      if (!userStr) {
        await this.resetDemoData();
      } else {
        this.memoryUser = JSON.parse(userStr);
        const mStr = await AsyncStorage.getItem(KEYS.MOTHERS);
        const aStr = await AsyncStorage.getItem(KEYS.ALERTS);
        const sStr = await AsyncStorage.getItem(KEYS.SCREENINGS);

        this.memoryMothers = mStr ? JSON.parse(mStr) : SEED_MOTHERS;
        this.memoryAlerts = aStr ? JSON.parse(aStr) : SEED_ALERTS;
        this.memoryScreenings = sStr ? JSON.parse(sStr) : SEED_SCREENINGS;
      }
    } catch (e) {
      console.warn('Storage read error, using seed fallback:', e);
      this.memoryUser = SEED_ASHA_WORKER;
      this.memoryMothers = SEED_MOTHERS;
      this.memoryAlerts = SEED_ALERTS;
      this.memoryScreenings = SEED_SCREENINGS;
    }
  }

  async resetDemoData(): Promise<void> {
    this.memoryUser = SEED_ASHA_WORKER;
    this.memoryMothers = SEED_MOTHERS;
    this.memoryAlerts = SEED_ALERTS;
    this.memoryScreenings = SEED_SCREENINGS;

    try {
      await AsyncStorage.setItem(KEYS.USER_PROFILE, JSON.stringify(SEED_ASHA_WORKER));
      await AsyncStorage.setItem(KEYS.MOTHERS, JSON.stringify(SEED_MOTHERS));
      await AsyncStorage.setItem(KEYS.ALERTS, JSON.stringify(SEED_ALERTS));
      await AsyncStorage.setItem(KEYS.SCREENINGS, JSON.stringify(SEED_SCREENINGS));
    } catch (e) {
      console.warn('Storage reset write error:', e);
    }
  }

  async getUserProfile(): Promise<AshaWorkerProfile> {
    if (!this.memoryUser) await this.initialize();
    return this.memoryUser || SEED_ASHA_WORKER;
  }

  async updateUserProfile(partial: Partial<AshaWorkerProfile>): Promise<AshaWorkerProfile> {
    const current = await this.getUserProfile();
    const updated = { ...current, ...partial };
    this.memoryUser = updated;
    try {
      await AsyncStorage.setItem(KEYS.USER_PROFILE, JSON.stringify(updated));
    } catch (e) {
      console.warn('Storage user update error:', e);
    }
    return updated;
  }

  async getMothers(): Promise<Mother[]> {
    if (this.memoryMothers.length === 0) await this.initialize();
    return this.memoryMothers;
  }

  async saveMother(mother: Mother): Promise<Mother[]> {
    const existingIndex = this.memoryMothers.findIndex((m) => m.id === mother.id);
    let updatedMothers: Mother[];

    const initialTimeline: TimelineEvent = {
      id: `tl-${Date.now()}`,
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      title: 'Initial Field Registration',
      description: `Registered in ${mother.village}. Gestational age ${mother.gestationalAgeWeeks} weeks.`,
      type: 'REGISTRATION',
      riskLevel: mother.riskLevel,
    };

    const motherWithTimeline: Mother = {
      ...mother,
      timeline: mother.timeline ? mother.timeline : [initialTimeline],
    };

    if (existingIndex >= 0) {
      updatedMothers = [...this.memoryMothers];
      updatedMothers[existingIndex] = motherWithTimeline;
    } else {
      updatedMothers = [motherWithTimeline, ...this.memoryMothers];
    }

    this.memoryMothers = updatedMothers;
    try {
      await AsyncStorage.setItem(KEYS.MOTHERS, JSON.stringify(updatedMothers));
    } catch (e) {
      console.warn('Storage mother save error:', e);
    }

    await this.recalculateStats();
    return updatedMothers;
  }

  async getAlerts(): Promise<HealthAlert[]> {
    if (this.memoryAlerts.length === 0) await this.initialize();
    return this.memoryAlerts;
  }

  async resolveAlert(alertId: string): Promise<HealthAlert[]> {
    const updated = this.memoryAlerts.map((a) => (a.id === alertId ? { ...a, isResolved: true } : a));
    this.memoryAlerts = updated;
    try {
      await AsyncStorage.setItem(KEYS.ALERTS, JSON.stringify(updated));
    } catch (e) {
      console.warn('Storage alert resolve error:', e);
    }
    await this.recalculateStats();
    return updated;
  }

  async getScreenings(): Promise<ScreeningResult[]> {
    if (this.memoryScreenings.length === 0) await this.initialize();
    return this.memoryScreenings;
  }

  async saveScreening(screening: ScreeningResult): Promise<ScreeningResult[]> {
    const updatedScreenings = [screening, ...this.memoryScreenings];
    this.memoryScreenings = updatedScreenings;

    try {
      await AsyncStorage.setItem(KEYS.SCREENINGS, JSON.stringify(updatedScreenings));
    } catch (e) {
      console.warn('Storage screening save error:', e);
    }

    // Dynamic Risk Recalculation & Timeline Event Addition
    const motherIndex = this.memoryMothers.findIndex((m) => m.id === screening.motherId);
    if (motherIndex >= 0) {
      const mother = this.memoryMothers[motherIndex];

      const riskAssessment = evaluateUnifiedMaternalRisk({
        mother,
        visualScreeningRisk: screening.overallRisk,
        visualScreeningFinding: screening.anemiaReason,
      });

      const todayFormatted = new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });

      const newTimelineEvent: TimelineEvent = {
        id: `tl-scr-${Date.now()}`,
        date: todayFormatted,
        title: `${screening.type === 'VISUAL_ANEMIA' ? 'Visual Anemia Screening' : 'Maternal Risk Check'}`,
        description: screening.reasons.join(' • '),
        type: 'SCREENING',
        riskLevel: riskAssessment.overallRisk,
      };

      const updatedTimeline = [newTimelineEvent, ...(mother.timeline || [])];

      const updatedMother: Mother = {
        ...mother,
        riskLevel: riskAssessment.overallRisk,
        riskReason: riskAssessment.whyFlagged.join(' + '),
        lastScreeningDate: new Date().toISOString().split('T')[0],
        needsFollowUp: riskAssessment.followUpRequired,
        timeline: updatedTimeline,
      };

      this.memoryMothers[motherIndex] = updatedMother;
      try {
        await AsyncStorage.setItem(KEYS.MOTHERS, JSON.stringify(this.memoryMothers));
      } catch (e) {
        console.warn('Storage mother risk update error:', e);
      }

      // Automatically generate Urgent Alert if Risk is HIGH
      if (riskAssessment.overallRisk === 'HIGH') {
        const existingAlert = this.memoryAlerts.find(
          (a) => a.motherId === mother.id && !a.isResolved && a.priority === 'URGENT'
        );

        if (!existingAlert) {
          const newAlert: HealthAlert = {
            id: `alt-auto-${Date.now()}`,
            motherId: mother.id,
            motherName: mother.name,
            gestationalAgeWeeks: mother.gestationalAgeWeeks,
            priority: 'URGENT',
            title: `High Risk Flagged: ${mother.name}`,
            description: riskAssessment.whyFlagged.join(' + '),
            actionRequired: riskAssessment.recommendation,
            timestamp: todayFormatted,
            dateCreated: new Date().toISOString().split('T')[0],
            isResolved: false,
            category: 'VISUAL_PALLOR',
          };
          this.memoryAlerts = [newAlert, ...this.memoryAlerts];
          try {
            await AsyncStorage.setItem(KEYS.ALERTS, JSON.stringify(this.memoryAlerts));
          } catch (e) {
            console.warn('Storage auto alert save error:', e);
          }
        }
      }
    }

    await this.recalculateStats();
    return updatedScreenings;
  }

  private async recalculateStats(): Promise<void> {
    if (!this.memoryUser) return;
    const total = this.memoryMothers.length;
    const highRisk = this.memoryMothers.filter((m) => m.riskLevel === 'HIGH').length;
    const followUps = this.memoryAlerts.filter((a) => !a.isResolved).length;

    this.memoryUser = {
      ...this.memoryUser,
      totalMothersAssigned: total,
      highRiskCount: highRisk,
      followUpsDue: followUps,
    };

    try {
      await AsyncStorage.setItem(KEYS.USER_PROFILE, JSON.stringify(this.memoryUser));
    } catch (e) {
      console.warn('Storage user stat update error:', e);
    }
  }

  /**
   * Hackathon Demo Mode: Pre-loads high-risk case (Priya Sharma)
   */
  async loadHighRiskDemoCase(): Promise<{ mother: Mother; screening: ScreeningResult }> {
    let priya = this.memoryMothers.find((m) => m.name === 'Priya Sharma');
    if (!priya) {
      priya = SEED_MOTHERS[0];
    }

    const demoScreening: ScreeningResult = {
      id: `scr-demo-${Date.now()}`,
      motherId: priya.id,
      motherName: priya.name,
      gestationalAgeWeeks: priya.gestationalAgeWeeks,
      timestamp: new Date().toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' }),
      type: 'VISUAL_ANEMIA',
      overallRisk: 'HIGH',
      anemiaRisk: 'HIGH',
      anemiaReason: 'Possible visual pallor pattern detected in palpebral conjunctiva.',
      pregnancyRisk: 'HIGH',
      symptomRisk: 'MEDIUM',
      reasons: [
        'Possible visual pallor pattern detected in inner eyelid',
        'Hemoglobin (9.5 g/dL) recorded below 10.0 threshold',
        'ANC follow-up visit overdue',
        'History of postpartum anemia in previous delivery',
      ],
      recommendation: 'High priority referral: Clinical evaluation & laboratory Hb testing strongly recommended.',
      isPrototypeEngine: true,
    };

    await this.saveScreening(demoScreening);

    const refreshedMothers = await this.getMothers();
    const updatedPriya = refreshedMothers.find((m) => m.id === priya!.id) || priya;

    return { mother: updatedPriya, screening: demoScreening };
  }
}

export const storageService = new StorageService();
