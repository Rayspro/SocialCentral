import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MobileFormProps {
  title?: string;
  children: ReactNode;
  onSubmit?: () => void;
  submitText?: string;
  isLoading?: boolean;
  className?: string;
}

export function MobileForm({ 
  title, 
  children, 
  onSubmit, 
  submitText = "Submit", 
  isLoading = false,
  className = ""
}: MobileFormProps) {
  return (
    <Card className={`w-full ${className}`}>
      {title && (
        <CardHeader className="pb-4">
          <CardTitle className="text-lg sm:text-xl">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent className="space-y-4 sm:space-y-6">
        <div className="space-y-4">
          {children}
        </div>
        {onSubmit && (
          <Button
            onClick={onSubmit}
            disabled={isLoading}
            className="w-full h-12 sm:h-auto text-base sm:text-sm"
          >
            {isLoading ? "Loading..." : submitText}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

interface MobileFormFieldProps {
  label: string;
  children: ReactNode;
  error?: string;
  required?: boolean;
}

export function MobileFormField({ label, children, error, required }: MobileFormFieldProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm sm:text-base font-medium text-gray-900 dark:text-gray-100">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="[&>*]:h-12 [&>*]:text-base sm:[&>*]:h-10 sm:[&>*]:text-sm">
        {children}
      </div>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}