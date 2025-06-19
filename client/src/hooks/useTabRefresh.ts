import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export function useTabRefresh() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Tab became visible, invalidate all queries to force refetch
        queryClient.invalidateQueries();
      }
    };

    const handleFocus = () => {
      // Window gained focus, invalidate all queries
      queryClient.invalidateQueries();
    };

    // Listen for visibility changes (tab switching)
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Listen for window focus events
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [queryClient]);
}