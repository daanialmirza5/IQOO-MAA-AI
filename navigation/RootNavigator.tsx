import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { useAuth } from '../auth/useAuth';
import { RootStackParamList } from './types';
import { COLORS } from '../constants/theme';
import { LoadingState } from '../components/LoadingState';
import { AppTabs } from './AppTabs';
import { OnboardingScreen } from '../screens/auth/OnboardingScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { MotherDetailScreen } from '../screens/MotherDetailScreen';
import { NewMotherScreen } from '../screens/NewMotherScreen';
import { CameraScreeningModal } from '../screens/CameraScreeningModal';
import { ReportScannerModal } from '../screens/ReportScannerModal';
import { VoiceCheckInModal } from '../screens/VoiceCheckInModal';
import { RiskCheckModal } from '../screens/RiskCheckModal';
import { SymptomScreeningModal } from '../screens/SymptomScreeningModal';
import { ScreeningResultScreen } from '../screens/ScreeningResultScreen';
import { ReferralSummaryScreen } from '../screens/ReferralSummaryScreen';
import { AiPipelineModal } from '../screens/AiPipelineModal';
import { ReportsScreen } from '../screens/ReportsScreen';
import { MotherReportScreen } from '../screens/MotherReportScreen';
import { HealthInfoScreen } from '../screens/HealthInfoScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: COLORS.background,
    card: COLORS.cardBg,
    text: COLORS.textPrimary,
    border: COLORS.border,
    primary: COLORS.primary,
  },
};

export const RootNavigator: React.FC = () => {
  const { session, isLoading, isRegistered } = useAuth();

  if (isLoading) {
    return <LoadingState message="Preparing MaAI..." />;
  }

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!session ? (
          <>
            {!isRegistered ? (
              <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            ) : (
              <Stack.Screen name="Login" component={LoginScreen} />
            )}
          </>
        ) : (
          <>
            <Stack.Screen name="Tabs" component={AppTabs} />
            <Stack.Screen name="MotherDetail" component={MotherDetailScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="NewMother" component={NewMotherScreen} options={{ presentation: 'modal' }} />
            <Stack.Screen name="CameraScreening" component={CameraScreeningModal} options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen name="ReportScanner" component={ReportScannerModal} options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen name="VoiceCheckIn" component={VoiceCheckInModal} options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen name="RiskCheck" component={RiskCheckModal} options={{ presentation: 'modal' }} />
            <Stack.Screen name="SymptomScreening" component={SymptomScreeningModal} options={{ presentation: 'modal' }} />
            <Stack.Screen name="ScreeningResultScreen" component={ScreeningResultScreen} options={{ animation: 'slide_from_bottom', gestureEnabled: false }} />
            <Stack.Screen name="ReferralSummary" component={ReferralSummaryScreen} options={{ presentation: 'modal' }} />
            <Stack.Screen name="AiPipelineInfo" component={AiPipelineModal} options={{ presentation: 'modal' }} />
            <Stack.Screen name="Reports" component={ReportsScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="MotherReport" component={MotherReportScreen} options={{ presentation: 'modal' }} />
            <Stack.Screen name="HealthInfo" component={HealthInfoScreen} options={{ presentation: 'modal' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
