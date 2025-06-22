import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, ExternalLink, Loader2, Shield, UserCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface OAuthLoadingModalProps {
  isOpen: boolean;
  platform: string;
  onClose: () => void;
}

interface LoadingStep {
  id: string;
  label: string;
  icon: React.ReactNode;
  duration: number;
}

export function OAuthLoadingModal({ isOpen, platform, onClose }: OAuthLoadingModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const steps: LoadingStep[] = [
    {
      id: 'validate',
      label: 'Validating credentials',
      icon: <Shield className="w-5 h-5" />,
      duration: 1500,
    },
    {
      id: 'redirect',
      label: `Redirecting to ${platform}`,
      icon: <ExternalLink className="w-5 h-5" />,
      duration: 2000,
    },
    {
      id: 'authorize',
      label: 'Waiting for authorization',
      icon: <UserCheck className="w-5 h-5" />,
      duration: 3000,
    },
  ];

  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(0);
      setProgress(0);
      setIsComplete(false);
      return;
    }

    const runSteps = async () => {
      for (let i = 0; i < steps.length; i++) {
        setCurrentStep(i);
        
        // Animate progress for current step
        const step = steps[i];
        const startProgress = (i / steps.length) * 100;
        const endProgress = ((i + 1) / steps.length) * 100;
        
        const progressInterval = setInterval(() => {
          setProgress(prev => {
            const increment = (endProgress - startProgress) / (step.duration / 50);
            const newProgress = prev + increment;
            
            if (newProgress >= endProgress) {
              clearInterval(progressInterval);
              return endProgress;
            }
            return newProgress;
          });
        }, 50);

        await new Promise(resolve => setTimeout(resolve, step.duration));
        clearInterval(progressInterval);
      }

      setIsComplete(true);
      setTimeout(() => {
        onClose();
      }, 1000);
    };

    runSteps();
  }, [isOpen, platform, onClose]);

  const getPlatformColor = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'youtube': return 'text-red-500';
      case 'instagram': return 'text-pink-500';
      case 'twitter': return 'text-blue-500';
      case 'linkedin': return 'text-blue-600';
      default: return 'text-gray-500';
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'youtube': return '🎥';
      case 'instagram': return '📷';
      case 'twitter': return '🐦';
      case 'linkedin': return '💼';
      default: return '🔗';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <div className="flex flex-col items-center space-y-6 p-6">
          {/* Platform Header */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="flex items-center space-x-3"
          >
            <div className="text-3xl">
              {getPlatformIcon(platform)}
            </div>
            <div>
              <h3 className="text-lg font-semibold">
                Connecting to {platform}
              </h3>
              <p className="text-sm text-gray-600">
                Secure OAuth authentication
              </p>
            </div>
          </motion.div>

          {/* Progress Bar */}
          <div className="w-full space-y-2">
            <Progress 
              value={progress} 
              className="h-2"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Connecting...</span>
              <span>{Math.round(progress)}%</span>
            </div>
          </div>

          {/* Steps */}
          <div className="w-full space-y-4">
            {steps.map((step, index) => (
              <motion.div
                key={step.id}
                initial={{ x: -20, opacity: 0 }}
                animate={{ 
                  x: 0, 
                  opacity: index <= currentStep ? 1 : 0.3 
                }}
                transition={{ 
                  delay: index * 0.2,
                  duration: 0.4 
                }}
                className="flex items-center space-x-3"
              >
                <div className={`
                  flex items-center justify-center w-8 h-8 rounded-full border-2
                  ${index < currentStep 
                    ? 'bg-green-100 border-green-500 text-green-600' 
                    : index === currentStep
                    ? `bg-blue-100 border-blue-500 ${getPlatformColor(platform)}`
                    : 'bg-gray-100 border-gray-300 text-gray-400'
                  }
                `}>
                  <AnimatePresence mode="wait">
                    {index < currentStep ? (
                      <motion.div
                        key="check"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <CheckCircle className="w-4 h-4" />
                      </motion.div>
                    ) : index === currentStep ? (
                      <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <Loader2 className="w-4 h-4 animate-spin" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="icon"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        {step.icon}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <span className={`
                  text-sm transition-colors duration-300
                  ${index <= currentStep ? 'text-gray-900' : 'text-gray-400'}
                `}>
                  {step.label}
                </span>
              </motion.div>
            ))}
          </div>

          {/* Completion Message */}
          <AnimatePresence>
            {isComplete && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="flex items-center space-x-2 text-green-600"
              >
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">
                  Successfully connected to {platform}!
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Security Notice */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-xs text-gray-500 text-center max-w-xs"
          >
            Your credentials are encrypted and securely stored. 
            This window will close automatically after authentication.
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
}