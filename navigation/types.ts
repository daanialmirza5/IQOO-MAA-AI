import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreeningResult } from '../types/screening';

export type AppTabParamList = {
  HomeTab: undefined;
  MothersTab: undefined;
  ScreenTab: undefined;
  AlertsTab: undefined;
  ProfileTab: undefined;
};

export type AuthStackParamList = {
  Onboarding: undefined;
  Login: undefined;
};

/**
 * Every full-screen flow lives as a sibling of the bottom-tab navigator in
 * one root stack (not duplicated per tab) — simpler than nested per-tab
 * stacks, still gives real native back-gesture/hardware-back support, and
 * matches how the previous Modal-based flows were reachable from anywhere.
 */
export type RootStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  Tabs: undefined;
  MotherDetail: { motherId: string };
  NewMother: undefined;
  CameraScreening: { motherId?: string };
  ReportScanner: { motherId?: string };
  VoiceCheckIn: { motherId?: string };
  RiskCheck: { motherId?: string };
  SymptomScreening: { motherId?: string };
  ScreeningResultScreen: { screening: ScreeningResult; viewOnly?: boolean };
  ReferralSummary: { motherId: string; screening?: ScreeningResult };
  AiPipelineInfo: undefined;
  Reports: undefined;
  MotherReport: { motherId: string };
  HealthInfo: undefined;
};

export type RootScreenProps<Screen extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  Screen
>;

declare global {
  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- official React Navigation declaration-merging pattern
    interface RootParamList extends RootStackParamList {}
  }
}
