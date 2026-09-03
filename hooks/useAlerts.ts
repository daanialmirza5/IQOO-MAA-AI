import { useCallback, useEffect, useState } from 'react';
import { alertRepository } from '../db';
import { HealthAlert } from '../types/alert';

export function useAlerts() {
  const [alerts, setAlerts] = useState<HealthAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      setAlerts(await alertRepository.list());
    } catch (e) {
      console.warn('Failed to load alerts:', e);
      setError('Unable to load alerts. Pull to refresh to try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount (async, not sync setState)
    refresh();
  }, [refresh]);

  const resolve = useCallback(async (alertId: string) => {
    await alertRepository.resolve(alertId);
    await refresh();
  }, [refresh]);

  const snooze = useCallback(async (alertId: string, hours: number) => {
    const until = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
    await alertRepository.snooze(alertId, until);
    await refresh();
  }, [refresh]);

  return { alerts, isLoading, error, refresh, resolve, snooze };
}
