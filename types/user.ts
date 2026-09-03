export interface AshaWorkerProfile {
  id: string;
  name: string;
  workerId: string;
  assignedArea: string;
  phone: string;
  totalMothersAssigned: number;
  followUpsDue: number;
  highRiskCount: number;
  ancDueCount?: number;
  stableCount?: number;
  language: 'English' | 'Hindi' | 'Bengali' | 'Marathi';
  notificationsEnabled: boolean;
  offlineModeEnabled?: boolean;
  offlineMode?: boolean;
}

