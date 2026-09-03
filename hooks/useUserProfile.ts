import { useCallback, useEffect, useState } from 'react';
import { userRepository } from '../db';
import { AshaWorkerProfile } from '../types/user';

export function useUserProfile() {
  const [profile, setProfile] = useState<AshaWorkerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setProfile(await userRepository.getProfile());
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount (async, not sync setState)
    refresh();
  }, [refresh]);

  return { profile, isLoading, refresh };
}
