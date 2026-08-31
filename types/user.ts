export interface AshaWorkerProfile {
  id: string;
  name: string;
  workerId: string;
  assignedArea: string;
  phone: string;
  totalMothersAssigned: number;
  followUpsDue: number;
  highRiskCount: number;
  language: 'English' | 'Hindi' | 'Bengali' | 'Marathi';
  notificationsEnabled: boolean;
  offlineModeEnabled?: boolean;
  offlineMode?: boolean;
}
