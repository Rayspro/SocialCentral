import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { serverService, executionService } from '@/services/api';
import { QUERY_KEYS, DEFAULTS } from '@/constants';
import { useToast } from '@/hooks/use-toast';
import type { VastServer, ServerCreateForm } from '@/types';

export const useServers = () => {
  return useQuery({
    queryKey: QUERY_KEYS.SERVERS,
    queryFn: serverService.getAll,
    refetchInterval: DEFAULTS.REFRESH_INTERVALS.SERVERS,
  });
};

export const useServer = (id: number) => {
  return useQuery({
    queryKey: QUERY_KEYS.SERVER(id),
    queryFn: () => serverService.getById(id),
    enabled: !!id,
  });
};

export const useServerExecutions = (serverId: number) => {
  return useQuery({
    queryKey: QUERY_KEYS.EXECUTIONS(serverId),
    queryFn: () => executionService.getByServer(serverId),
    enabled: !!serverId,
    refetchInterval: DEFAULTS.REFRESH_INTERVALS.EXECUTIONS,
  });
};

export const useCreateServer = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: ServerCreateForm) => serverService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SERVERS });
      toast({
        title: 'Success',
        description: 'Server created successfully',
        variant: 'success',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create server',
        variant: 'destructive',
      });
    },
  });
};

export const useStartServer = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: number) => serverService.start(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SERVERS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SERVER(id) });
      toast({
        title: 'Success',
        description: 'Server start initiated',
        variant: 'success',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to start server',
        variant: 'destructive',
      });
    },
  });
};

export const useStopServer = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: number) => serverService.stop(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SERVERS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SERVER(id) });
      toast({
        title: 'Success',
        description: 'Server stop initiated',
        variant: 'success',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to stop server',
        variant: 'destructive',
      });
    },
  });
};

export const useDeleteServer = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: number) => serverService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SERVERS });
      toast({
        title: 'Success',
        description: 'Server deleted successfully',
        variant: 'success',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete server',
        variant: 'destructive',
      });
    },
  });
};