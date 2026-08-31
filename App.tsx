import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Mother } from './types/mother';
import { HealthAlert } from './types/alert';
import { ScreeningResult } from './types/screening';
import { AshaWorkerProfile } from './types/user';

import { storageService } from './services/storage/storageService';

import { HomeScreen } from './screens/HomeScreen';
import { MothersScreen } from './screens/MothersScreen';
import { ScreenTab } from './screens/ScreenTab';
import { AlertsScreen } from './screens/AlertsScreen';
import { ProfileScreen } from './screens/ProfileScreen';

import { MotherDetailModal } from './screens/MotherDetailModal';
import { NewMotherModal } from './screens/NewMotherModal';
import { CameraScreeningModal } from './screens/CameraScreeningModal';
import { RiskCheckModal } from './screens/RiskCheckModal';
import { SymptomScreeningModal } from './screens/SymptomScreeningModal';
import { ResultScreen } from './screens/ResultScreen';
import { ReferralSummaryModal } from './screens/ReferralSummaryModal';
import { LoadingState } from './components/LoadingState';

import { COLORS, SHADOWS, SPACING } from './constants/theme';

type TabName = 'home' | 'mothers' | 'screen' | 'alerts' | 'profile';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabName>('home');
  const [isLoading, setIsLoading] = useState(true);

  // App Data State
  const [user, setUser] = useState<AshaWorkerProfile | null>(null);
  const [mothers, setMothers] = useState<Mother[]>([]);
  const [alerts, setAlerts] = useState<HealthAlert[]>([]);
  const [screenings, setScreenings] = useState<ScreeningResult[]>([]);

  // Modal States
  const [selectedMother, setSelectedMother] = useState<Mother | null>(null);
  const [isMotherDetailVisible, setIsMotherDetailVisible] = useState(false);

  const [isNewMotherVisible, setIsNewMotherVisible] = useState(false);
  const [isCameraVisible, setIsCameraVisible] = useState(false);
  const [isRiskCheckVisible, setIsRiskCheckVisible] = useState(false);
  const [isSymptomCheckVisible, setIsSymptomCheckVisible] = useState(false);

  const [activeScreeningResult, setActiveScreeningResult] = useState<ScreeningResult | null>(null);
  const [isResultVisible, setIsResultVisible] = useState(false);

  const [isReferralVisible, setIsReferralVisible] = useState(false);

  // Load storage data on startup
  useEffect(() => {
    async function loadData() {
      await storageService.initialize();
      const u = await storageService.getUserProfile();
      const m = await storageService.getMothers();
      const a = await storageService.getAlerts();
      const s = await storageService.getScreenings();

      setUser(u);
      setMothers(m);
      setAlerts(a);
      setScreenings(s);
      setIsLoading(false);
    }
    loadData();
  }, []);

  // Handlers for storage actions
  const handleSaveMother = async (newMother: Mother) => {
    const updated = await storageService.saveMother(newMother);
    setMothers(updated);
    const u = await storageService.getUserProfile();
    setUser(u);
  };

  const handleScreeningComplete = (result: ScreeningResult) => {
    setIsCameraVisible(false);
    setIsRiskCheckVisible(false);
    setIsSymptomCheckVisible(false);

    setActiveScreeningResult(result);
    setIsResultVisible(true);
  };

  const handleSaveScreeningRecord = async (result: ScreeningResult) => {
    const updatedScreenings = await storageService.saveScreening(result);
    setScreenings(updatedScreenings);

    // Refresh state dynamically across app
    const m = await storageService.getMothers();
    const a = await storageService.getAlerts();
    const u = await storageService.getUserProfile();

    setMothers(m);
    setAlerts(a);
    setUser(u);

    setIsResultVisible(false);
    setActiveTab('alerts'); // Move directly to Alerts tab to show created case
  };

  const handleResolveAlert = async (alertId: string) => {
    const updated = await storageService.resolveAlert(alertId);
    setAlerts(updated);
  };

  const handleUpdateProfile = async (partial: Partial<AshaWorkerProfile>) => {
    const updated = await storageService.updateUserProfile(partial);
    setUser(updated);
  };

  const handleResetDemoData = async () => {
    setIsLoading(true);
    await storageService.resetDemoData();
    const u = await storageService.getUserProfile();
    const m = await storageService.getMothers();
    const a = await storageService.getAlerts();
    const s = await storageService.getScreenings();
    setUser(u);
    setMothers(m);
    setAlerts(a);
    setScreenings(s);
    setIsLoading(false);
  };

  // One-Tap Hackathon Demo Flow
  const handleStartDemoFlow = () => {
    const priya = mothers.find((m) => m.name === 'Priya Sharma') || mothers[0];
    if (priya) {
      setSelectedMother(priya);
    }
    setIsCameraVisible(true);
  };

  const handleLoadHighRiskDemo = async () => {
    setIsLoading(true);
    const res = await storageService.loadHighRiskDemoCase();
    const u = await storageService.getUserProfile();
    const m = await storageService.getMothers();
    const a = await storageService.getAlerts();
    const s = await storageService.getScreenings();
    setUser(u);
    setMothers(m);
    setAlerts(a);
    setScreenings(s);
    setIsLoading(false);
    setSelectedMother(res.mother);
    setIsMotherDetailVisible(true);
  };

  if (isLoading || !user) {
    return <LoadingState message="Initializing MaAI Maternal Risk Intelligence Engine..." />;
  }

  const unreadAlertsCount = alerts.filter((a) => !a.isResolved).length;

  return (
    <SafeAreaView style={styles.appContainer}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* TAB CONTENT VIEWS */}
      <View style={styles.tabContent}>
        {activeTab === 'home' && (
          <HomeScreen
            user={user}
            mothers={mothers}
            alerts={alerts}
            onOpenNewMother={() => setIsNewMotherVisible(true)}
            onOpenScreeningTab={() => setActiveTab('screen')}
            onSelectMother={(mother) => {
              setSelectedMother(mother);
              setIsMotherDetailVisible(true);
            }}
            onOpenAlertsTab={() => setActiveTab('alerts')}
            onStartDemoFlow={handleStartDemoFlow}
          />
        )}

        {activeTab === 'mothers' && (
          <MothersScreen
            mothers={mothers}
            onSelectMother={(mother) => {
              setSelectedMother(mother);
              setIsMotherDetailVisible(true);
            }}
            onOpenNewMother={() => setIsNewMotherVisible(true)}
            onOpenScreening={(mother) => {
              if (mother) setSelectedMother(mother);
              setIsCameraVisible(true);
            }}
          />
        )}

        {activeTab === 'screen' && (
          <ScreenTab
            onOpenVisualAnemia={() => setIsCameraVisible(true)}
            onOpenPregnancyRisk={() => setIsRiskCheckVisible(true)}
            onOpenSymptomScreening={() => setIsSymptomCheckVisible(true)}
          />
        )}

        {activeTab === 'alerts' && (
          <AlertsScreen
            alerts={alerts}
            mothers={mothers}
            onSelectMother={(mother) => {
              setSelectedMother(mother);
              setIsMotherDetailVisible(true);
            }}
            onResolveAlert={handleResolveAlert}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileScreen
            user={user}
            onUpdateUser={handleUpdateProfile}
            onResetData={handleResetDemoData}
            onLoadHighRiskDemo={handleLoadHighRiskDemo}
          />
        )}
      </View>

      {/* BOTTOM TAB BAR NAVIGATION */}
      <View style={styles.bottomTabBar}>
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab('home')}
          activeOpacity={0.7}
        >
          <Ionicons
            name={activeTab === 'home' ? 'home' : 'home-outline'}
            size={22}
            color={activeTab === 'home' ? COLORS.primary : COLORS.textMuted}
          />
          <Text style={[styles.tabLabel, activeTab === 'home' && styles.activeTabLabel]}>
            Home
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab('mothers')}
          activeOpacity={0.7}
        >
          <Ionicons
            name={activeTab === 'mothers' ? 'people' : 'people-outline'}
            size={22}
            color={activeTab === 'mothers' ? COLORS.primary : COLORS.textMuted}
          />
          <Text style={[styles.tabLabel, activeTab === 'mothers' && styles.activeTabLabel]}>
            Mothers
          </Text>
        </TouchableOpacity>

        {/* Centerpiece Screen Action Tab */}
        <TouchableOpacity
          style={styles.centerTabItem}
          onPress={() => setActiveTab('screen')}
          activeOpacity={0.85}
        >
          <View style={styles.centerTabCircle}>
            <Ionicons name="camera" size={26} color={COLORS.textInverted} />
          </View>
          <Text style={[styles.tabLabel, activeTab === 'screen' && styles.activeTabLabel, { marginTop: 2 }]}>
            Screen
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab('alerts')}
          activeOpacity={0.7}
        >
          <View style={{ position: 'relative' }}>
            <Ionicons
              name={activeTab === 'alerts' ? 'notifications' : 'notifications-outline'}
              size={22}
              color={activeTab === 'alerts' ? COLORS.primary : COLORS.textMuted}
            />
            {unreadAlertsCount > 0 && (
              <View style={styles.badgeDot}>
                <Text style={styles.badgeDotText}>
                  {unreadAlertsCount > 9 ? '9+' : unreadAlertsCount}
                </Text>
              </View>
            )}
          </View>
          <Text style={[styles.tabLabel, activeTab === 'alerts' && styles.activeTabLabel]}>
            Alerts
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab('profile')}
          activeOpacity={0.7}
        >
          <Ionicons
            name={activeTab === 'profile' ? 'person' : 'person-outline'}
            size={22}
            color={activeTab === 'profile' ? COLORS.primary : COLORS.textMuted}
          />
          <Text style={[styles.tabLabel, activeTab === 'profile' && styles.activeTabLabel]}>
            Profile
          </Text>
        </TouchableOpacity>
      </View>

      {/* MODALS & WORKFLOW FLOWS */}

      {/* 1. New Mother Registration Modal */}
      <NewMotherModal
        visible={isNewMotherVisible}
        onClose={() => setIsNewMotherVisible(false)}
        onSaveMother={handleSaveMother}
      />

      {/* 2. Mother Profile Detail Modal */}
      <MotherDetailModal
        visible={isMotherDetailVisible}
        mother={selectedMother}
        onClose={() => setIsMotherDetailVisible(false)}
        onStartScreening={(mother) => {
          setIsMotherDetailVisible(false);
          setSelectedMother(mother);
          setIsCameraVisible(true);
        }}
        onCreateReferral={(mother) => {
          setIsMotherDetailVisible(false);
          setSelectedMother(mother);
          setIsReferralVisible(true);
        }}
      />

      {/* 3. Visual Anemia Camera Screening Modal */}
      <CameraScreeningModal
        visible={isCameraVisible}
        mothers={mothers}
        preSelectedMother={selectedMother}
        onClose={() => setIsCameraVisible(false)}
        onScreeningComplete={handleScreeningComplete}
      />

      {/* 4. Pregnancy Risk Check Modal */}
      <RiskCheckModal
        visible={isRiskCheckVisible}
        mothers={mothers}
        preSelectedMother={selectedMother}
        onClose={() => setIsRiskCheckVisible(false)}
        onScreeningComplete={handleScreeningComplete}
      />

      {/* 5. Symptom Checklist Modal */}
      <SymptomScreeningModal
        visible={isSymptomCheckVisible}
        mothers={mothers}
        preSelectedMother={selectedMother}
        onClose={() => setIsSymptomCheckVisible(false)}
        onScreeningComplete={handleScreeningComplete}
      />

      {/* 6. Result View Screen */}
      <ResultScreen
        visible={isResultVisible}
        screening={activeScreeningResult}
        onClose={() => setIsResultVisible(false)}
        onSaveScreening={handleSaveScreeningRecord}
        onCreateReferral={(screening) => {
          setIsResultVisible(false);
          const m = mothers.find((x) => x.id === screening.motherId) || selectedMother;
          setSelectedMother(m);
          setIsReferralVisible(true);
        }}
        onRetake={() => {
          setIsResultVisible(false);
          setIsCameraVisible(true);
        }}
      />

      {/* 7. Referral Summary Modal */}
      <ReferralSummaryModal
        visible={isReferralVisible}
        mother={selectedMother}
        screening={activeScreeningResult}
        onClose={() => setIsReferralVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  tabContent: {
    flex: 1,
  },
  bottomTabBar: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: COLORS.cardBg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingHorizontal: SPACING.xs,
    ...SHADOWS.modal,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginTop: 3,
  },
  activeTabLabel: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  centerTabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -16,
  },
  centerTabCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.card,
    borderWidth: 3,
    borderColor: COLORS.background,
  },
  badgeDot: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: COLORS.riskHigh,
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeDotText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textInverted,
  },
});
