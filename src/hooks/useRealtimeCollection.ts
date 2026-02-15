import { useEffect } from 'react';
import { useQuery, useQueryClient, type QueryKey } from '@tanstack/react-query';

export function useRealtimeCollection<T>(
  queryKey: QueryKey,
  watcher: (cb: (items: T[]) => void) => () => void,
  initialData: T[] = []
) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribe = watcher((items) => {
      queryClient.setQueryData(queryKey, items);
    });
    return unsubscribe;
  }, [watcher, queryClient, queryKey]);

  return useQuery<T[]>({
    queryKey,
    queryFn: async () => queryClient.getQueryData<T[]>(queryKey) ?? initialData,
    initialData
  });
}
