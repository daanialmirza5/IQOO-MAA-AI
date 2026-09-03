import { useMemo, useState } from 'react';
import { Mother } from '../types/mother';

/**
 * Derived (not effect-synced) selection state: whichever mother the caller
 * picks, falling back to a route-param preselection, falling back to the
 * first mother in the list once it loads. Computed directly during render
 * instead of `useEffect` + `setState`, which avoids an extra render pass
 * and the "don't setState from an effect for derivable state" pitfall.
 */
export function useSelectedMother(mothers: Mother[], preselectedId?: string) {
  const [selectedMotherId, setSelectedMotherId] = useState<string | null>(preselectedId ?? null);

  const selectedMother = useMemo(() => {
    if (selectedMotherId) {
      const found = mothers.find((m) => m.id === selectedMotherId);
      if (found) return found;
    }
    return mothers[0] ?? null;
  }, [mothers, selectedMotherId]);

  const selectMother = (mother: Mother) => setSelectedMotherId(mother.id);

  return { selectedMother, selectMother };
}
