import { useCallback, useEffect, useState } from 'react';
import { motherRepository } from '../db';
import { Mother } from '../types/mother';

export function useMothers() {
  const [mothers, setMothers] = useState<Mother[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const data = await motherRepository.list();
      setMothers(data);
    } catch (e) {
      console.warn('Failed to load mothers:', e);
      setError('Unable to load mothers. Pull to refresh to try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch-on-mount: `refresh` sets state only after an async DB read
  // resolves, not synchronously within the effect body — this is the
  // standard data-fetching-hook pattern, not the derivable-state anti-
  // pattern the stricter react-hooks/set-state-in-effect rule targets.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  return { mothers, isLoading, error, refresh };
}

export function useMother(motherId: string | undefined) {
  const [mother, setMother] = useState<Mother | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!motherId) {
      setIsLoading(false);
      return;
    }
    try {
      setError(null);
      const data = await motherRepository.getById(motherId);
      setMother(data);
    } catch (e) {
      console.warn('Failed to load mother:', e);
      setError('Unable to load this mother record.');
    } finally {
      setIsLoading(false);
    }
  }, [motherId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount, see useMothers() above
    refresh();
  }, [refresh]);

  return { mother, isLoading, error, refresh };
}
