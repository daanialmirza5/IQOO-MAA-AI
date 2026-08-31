export type AlertPriority = 'URGENT' | 'HIGH_PRIORITY' | 'FOLLOW_UP';

export interface HealthAlert {
  id: string;
  motherId: string;
  motherName: string;
  gestationalAgeWeeks?: number;
  priority: AlertPriority;
  title: string;
  description: string;
  actionRequired: string;
  timestamp: string;
  dateCreated?: string;
  isResolved: boolean;
  category?: string;
}
