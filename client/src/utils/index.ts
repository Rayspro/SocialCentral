import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { VALIDATION_RULES } from '@/constants';

// Utility for merging Tailwind classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format functions
export const formatters = {
  currency: (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  },

  fileSize: (bytes: number): string => {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  },

  duration: (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
  },

  progress: (current: number, total: number): string => {
    const percentage = Math.round((current / total) * 100);
    return `${percentage}%`;
  },

  relativeTime: (date: Date): string => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  },
};

// Validation functions
export const validators = {
  email: (email: string): boolean => {
    return VALIDATION_RULES.EMAIL.PATTERN.test(email);
  },

  password: (password: string): boolean => {
    return password.length >= VALIDATION_RULES.PASSWORD.MIN_LENGTH;
  },

  serverName: (name: string): boolean => {
    return name.length >= VALIDATION_RULES.SERVER_NAME.MIN_LENGTH && 
           name.length <= VALIDATION_RULES.SERVER_NAME.MAX_LENGTH;
  },

  prompt: (prompt: string): boolean => {
    return prompt.length >= VALIDATION_RULES.PROMPT.MIN_LENGTH && 
           prompt.length <= VALIDATION_RULES.PROMPT.MAX_LENGTH;
  },

  required: (value: any): boolean => {
    if (typeof value === 'string') return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    return value !== null && value !== undefined;
  },
};

// Helper functions
export const helpers = {
  generateId: (): string => {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  },

  sleep: (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  debounce: <T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  },

  throttle: <T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): ((...args: Parameters<T>) => void) => {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  capitalizeFirst: (str: string): string => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  },

  truncate: (str: string, length: number): string => {
    return str.length > length ? str.substring(0, length) + '...' : str;
  },

  getStatusColor: (status: string): string => {
    const colors = {
      pending: 'text-yellow-600 bg-yellow-50',
      running: 'text-blue-600 bg-blue-50',
      completed: 'text-green-600 bg-green-50',
      failed: 'text-red-600 bg-red-50',
      queued: 'text-purple-600 bg-purple-50',
      executing: 'text-orange-600 bg-orange-50',
      stopped: 'text-gray-600 bg-gray-50',
    };
    return colors[status as keyof typeof colors] || 'text-gray-600 bg-gray-50';
  },

  getStatusIcon: (status: string): string => {
    const icons = {
      pending: '⏳',
      running: '🟢',
      completed: '✅',
      failed: '❌',
      queued: '📋',
      executing: '⚡',
      stopped: '⏹️',
    };
    return icons[status as keyof typeof icons] || '⚪';
  },

  isValidUrl: (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  copyToClipboard: async (text: string): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  },

  downloadFile: (content: string, filename: string, type: string = 'text/plain'): void => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },
};

// Type guards
export const typeGuards = {
  isString: (value: unknown): value is string => {
    return typeof value === 'string';
  },

  isNumber: (value: unknown): value is number => {
    return typeof value === 'number' && !isNaN(value);
  },

  isObject: (value: unknown): value is Record<string, unknown> => {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  },

  isArray: (value: unknown): value is unknown[] => {
    return Array.isArray(value);
  },

  isFunction: (value: unknown): value is Function => {
    return typeof value === 'function';
  },

  isValidServer: (server: any): boolean => {
    return server && 
           typeof server.id === 'number' && 
           typeof server.name === 'string' && 
           typeof server.status === 'string';
  },

  isValidGeneration: (generation: any): boolean => {
    return generation && 
           typeof generation.id === 'number' && 
           typeof generation.serverId === 'number' && 
           typeof generation.prompt === 'string';
  },
};

// Error handling
export const errorHandler = {
  getErrorMessage: (error: unknown): string => {
    if (error instanceof Error) return error.message;
    if (typeof error === 'string') return error;
    return 'An unexpected error occurred';
  },

  isNetworkError: (error: unknown): boolean => {
    return error instanceof Error && 
           (error.message.includes('fetch') || 
            error.message.includes('network') ||
            error.message.includes('NetworkError'));
  },

  retryWithBackoff: async <T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> => {
    let lastError: unknown;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        if (attempt === maxRetries) break;
        
        const delay = baseDelay * Math.pow(2, attempt);
        await helpers.sleep(delay);
      }
    }
    
    throw lastError;
  },
};