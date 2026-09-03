import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { initializeDatabase } from './db';
import { AuthProvider } from './auth/useAuth';
import { RootNavigator } from './navigation/RootNavigator';
import { LoadingState } from './components/LoadingState';
import { ErrorState } from './components/ErrorState';
import { ErrorBoundary } from './components/ErrorBoundary';
import { COLORS } from './constants/theme';

export default function App() {
  const [isDbReady, setIsDbReady] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  const initDb = useCallback(() => {
    setDbError(null);
    initializeDatabase()
      .then(() => setIsDbReady(true))
      .catch((e) => {
        console.error('Database initialization failed:', e);
        setDbError('Unable to prepare local storage. Please try again.');
        setIsDbReady(true);
      });
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount (DB init), not derivable state
    initDb();
  }, [initDb]);

  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaProvider>
        <View style={styles.webOuterWrapper}>
          <View style={styles.appContainer}>
            <StatusBar style="dark" />
            <ErrorBoundary>
              {!isDbReady ? (
                <LoadingState message="Initializing MaAI..." />
              ) : dbError ? (
                <View style={styles.flex}>
                  <ErrorState title="Startup failed" description={dbError} onRetry={initDb} />
                </View>
              ) : (
                <AuthProvider>
                  <RootNavigator />
                </AuthProvider>
              )}
            </ErrorBoundary>
          </View>
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  webOuterWrapper: {
    flex: 1,
    backgroundColor: '#E8EDF3',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  appContainer: {
    flex: 1,
    width: '100%',
    maxWidth: 600,
    backgroundColor: COLORS.background,
  },
});
