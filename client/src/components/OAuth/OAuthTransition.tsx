import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, Shield, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';

interface OAuthTransitionProps {
  platform: string;
  authUrl: string;
  onComplete: () => void;
  onError: (error: string) => void;
}

export function OAuthTransition({ platform, authUrl, onComplete, onError }: OAuthTransitionProps) {
  const [stage, setStage] = useState<'preparing' | 'redirecting' | 'waiting' | 'success' | 'error'>('preparing');
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    const sequence = async () => {
      // Stage 1: Preparing (1.5s)
      await new Promise(resolve => setTimeout(resolve, 1500));
      setStage('redirecting');
      
      // Stage 2: Countdown and redirect
      let count = 3;
      const countdownInterval = setInterval(() => {
        count--;
        setCountdown(count);
        if (count === 0) {
          clearInterval(countdownInterval);
          // Redirect to OAuth URL
          window.location.href = authUrl;
        }
      }, 1000);
    };

    sequence();
  }, [authUrl]);

  const getPlatformConfig = (platform: string) => {
    const configs: Record<string, { color: string; icon: string; gradient: string }> = {
      youtube: { color: 'red', icon: '🎥', gradient: 'from-red-500 to-red-600' },
      instagram: { color: 'pink', icon: '📷', gradient: 'from-pink-500 to-purple-600' },
      twitter: { color: 'blue', icon: '🐦', gradient: 'from-blue-400 to-blue-600' },
      linkedin: { color: 'blue', icon: '💼', gradient: 'from-blue-600 to-blue-800' },
    };
    return configs[platform.toLowerCase()] || { color: 'gray', icon: '🔗', gradient: 'from-gray-500 to-gray-600' };
  };

  const config = getPlatformConfig(platform);

  const stageVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl"
      >
        <div className="text-center space-y-6">
          {/* Platform Header */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
            className="relative"
          >
            <div className={`w-20 h-20 mx-auto rounded-full bg-gradient-to-br ${config.gradient} flex items-center justify-center text-3xl shadow-lg`}>
              {config.icon}
            </div>
            
            {/* Animated rings */}
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className={`absolute inset-0 w-20 h-20 mx-auto rounded-full border-2 border-${config.color}-400`}
            />
            <motion.div
              animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0, 0.3] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
              className={`absolute inset-0 w-20 h-20 mx-auto rounded-full border-2 border-${config.color}-300`}
            />
          </motion.div>

          {/* Stage Content */}
          <AnimatePresence mode="wait">
            {stage === 'preparing' && (
              <motion.div
                key="preparing"
                variants={stageVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="space-y-4"
              >
                <div className="flex items-center justify-center space-x-2">
                  <Shield className="w-5 h-5 text-blue-500" />
                  <h3 className="text-xl font-semibold">Preparing Secure Connection</h3>
                </div>
                <p className="text-gray-600">
                  Setting up encrypted OAuth authentication with {platform}
                </p>
                <div className="flex justify-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"
                  />
                </div>
              </motion.div>
            )}

            {stage === 'redirecting' && (
              <motion.div
                key="redirecting"
                variants={stageVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="space-y-4"
              >
                <div className="flex items-center justify-center space-x-2">
                  <ExternalLink className="w-5 h-5 text-green-500" />
                  <h3 className="text-xl font-semibold">Redirecting to {platform}</h3>
                </div>
                <p className="text-gray-600">
                  You'll be redirected to {platform}'s secure login page
                </p>
                
                {/* Countdown Circle */}
                <div className="relative w-24 h-24 mx-auto">
                  <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 24 24">
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="2"
                      fill="none"
                      className="text-gray-200"
                    />
                    <motion.circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="2"
                      fill="none"
                      strokeLinecap="round"
                      className={`text-${config.color}-500`}
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: (4 - countdown) / 3 }}
                      transition={{ duration: 1, ease: "linear" }}
                      style={{
                        strokeDasharray: "62.83185307179586",
                        strokeDashoffset: "62.83185307179586"
                      }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.span
                      key={countdown}
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-2xl font-bold"
                    >
                      {countdown}
                    </motion.span>
                  </div>
                </div>

                <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                  <span>Redirecting in</span>
                  <ArrowRight className="w-4 h-4" />
                  <span className="font-medium">{countdown} seconds</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Security Notice */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="bg-blue-50 rounded-lg p-3 text-xs text-blue-800"
          >
            <div className="flex items-center justify-center space-x-1">
              <Shield className="w-3 h-3" />
              <span>Secure OAuth 2.0 • End-to-end encrypted</span>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}