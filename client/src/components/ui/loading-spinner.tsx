import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  size?: "sm" | "default" | "lg";
  className?: string;
  text?: string;
}

export function LoadingSpinner({ size = "default", className, text }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    default: "h-6 w-6",
    lg: "h-8 w-8"
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Loader2 className={cn("animate-spin", sizeClasses[size])} />
      {text && (
        <span className="text-sm text-muted-foreground animate-pulse">
          {text}
        </span>
      )}
    </div>
  );
}

export function LoadingDots({ className }: { className?: string }) {
  return (
    <div className={cn("flex space-x-1", className)}>
      <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
      <div className="w-2 h-2 bg-current rounded-full animate-bounce animation-delay-150"></div>
      <div className="w-2 h-2 bg-current rounded-full animate-bounce animation-delay-300"></div>
    </div>
  );
}

export function LoadingCard({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse", className)}>
      <div className="space-y-3">
        <div className="skeleton h-4 rounded"></div>
        <div className="space-y-2">
          <div className="skeleton h-3 rounded"></div>
          <div className="skeleton h-3 rounded w-5/6"></div>
        </div>
      </div>
    </div>
  );
}

export function LoadingTable({ rows = 5, cols = 4, className }: { 
  rows?: number; 
  cols?: number; 
  className?: string; 
}) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex space-x-4">
          {Array.from({ length: cols }).map((_, j) => (
            <div key={j} className="skeleton h-4 flex-1 rounded"></div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function LoadingPage({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-t-primary/40 rounded-full animate-spin animation-delay-150"></div>
        </div>
        <div className="text-sm font-medium text-muted-foreground animate-pulse">
          {message}
        </div>
      </div>
    </div>
  );
}

export function LoadingOverlay({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="flex flex-col items-center gap-4 p-6 rounded-lg bg-card shadow-lg border">
        <div className="relative">
          <div className="w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-8 h-8 border-3 border-transparent border-t-primary/40 rounded-full animate-spin animation-delay-150"></div>
        </div>
        <div className="text-sm font-medium text-foreground">
          {message}
        </div>
      </div>
    </div>
  );
}