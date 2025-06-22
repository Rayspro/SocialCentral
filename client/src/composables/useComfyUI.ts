import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { comfyService } from '@/services/api';
import { QUERY_KEYS, DEFAULTS } from '@/constants';
import { useToast } from '@/hooks/use-toast';
import type { GenerationForm, GenerationProgress } from '@/types';

export const useComfyProgress = (generationId: number) => {
  return useQuery({
    queryKey: QUERY_KEYS.PROGRESS(generationId),
    queryFn: () => comfyService.getProgress(generationId),
    enabled: !!generationId,
    refetchInterval: DEFAULTS.REFRESH_INTERVALS.PROGRESS,
  });
};

export const useAllProgress = () => {
  return useQuery({
    queryKey: QUERY_KEYS.ALL_PROGRESS,
    queryFn: comfyService.getAllProgress,
    refetchInterval: DEFAULTS.REFRESH_INTERVALS.PROGRESS,
  });
};

export const useComfyModels = (serverId: number) => {
  return useQuery({
    queryKey: ['comfy-models', serverId],
    queryFn: () => comfyService.getModels(serverId),
    enabled: !!serverId,
  });
};

export const useComfyWorkflows = () => {
  return useQuery({
    queryKey: QUERY_KEYS.WORKFLOWS,
    queryFn: comfyService.getWorkflows,
  });
};

export const useStartComfySetup = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (serverId: number) => comfyService.startSetup(serverId),
    onSuccess: (_, serverId) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.EXECUTIONS(serverId) });
      toast({
        title: 'Setup Started',
        description: 'ComfyUI setup has been initiated',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Setup Failed',
        description: error.message || 'Failed to start ComfyUI setup',
        variant: 'destructive',
      });
    },
  });
};

export const useResetComfySetup = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (serverId: number) => comfyService.resetSetup(serverId),
    onSuccess: (_, serverId) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.EXECUTIONS(serverId) });
      toast({
        title: 'Reset Started',
        description: 'ComfyUI reset has been initiated',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Reset Failed',
        description: error.message || 'Failed to reset ComfyUI setup',
        variant: 'destructive',
      });
    },
  });
};

export const useGenerateImage = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ serverId, data }: { serverId: number; data: GenerationForm }) =>
      comfyService.generateImage(serverId, data),
    onSuccess: (result, { serverId }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.GENERATIONS(serverId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ALL_PROGRESS });
      toast({
        title: 'Generation Started',
        description: 'Image generation has been initiated',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Generation Failed',
        description: error.message || 'Failed to start image generation',
        variant: 'destructive',
      });
    },
  });
};

// Custom hook for WebSocket progress monitoring
export const useProgressWebSocket = (generationId?: number) => {
  const [progress, setProgress] = useState<GenerationProgress | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!generationId) return;

    const ws = new WebSocket(`ws://localhost:5000`);
    
    ws.onopen = () => {
      setIsConnected(true);
      ws.send(JSON.stringify({
        type: 'subscribe',
        generationId,
      }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'progress' && data.generationId === generationId) {
        setProgress(data.data);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'unsubscribe',
          generationId,
        }));
      }
      ws.close();
    };
  }, [generationId]);

  return { progress, isConnected };
};