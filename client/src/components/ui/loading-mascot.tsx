import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Server, Cpu, HardDrive, Zap, Settings, Download, Upload, CheckCircle, AlertCircle } from "lucide-react";

interface LoadingMascotProps {
  task: string;
  status?: 'loading' | 'success' | 'error' | 'warning';
  message?: string;
  progress?: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const mascotFaces = {
  loading: ['(◕‿◕)', '(◡‿◡)', '(⌐■_■)', '(ಠ‿ಠ)', '(◔‿◔)'],
  success: ['(◕‿◕)✓', '\\(^‿^)/', '(◡‿◡)♪', '(⌐■_■)👍'],
  error: ['(╥﹏╥)', '(×_×)', '(T_T)', '(◞‸◟)'],
  warning: ['(･_･)', '(¬‿¬)', '(◔_◔)', '(⊙_⊙)']
};

const taskIcons = {
  'server-launch': Server,
  'comfy-setup': Settings,
  'model-download': Download,
  'image-generation': Zap,
  'file-upload': Upload,
  'processing': Cpu,
  'storage': HardDrive,
  'default': Server
};

const loadingMessages = {
  'server-launch': [
    "Powering up the digital hamsters...",
    "Convincing servers to wake up...",
    "Bribing the cloud gods...",
    "Assembling virtual LEGO blocks...",
    "Teaching GPUs to dance..."
  ],
  'comfy-setup': [
    "Installing artistic inspiration...",
    "Teaching AI to paint pretty pictures...",
    "Downloading creative juice...",
    "Calibrating imagination engines...",
    "Setting up the magic paintbrush..."
  ],
  'model-download': [
    "Downloading brain cells...",
    "Collecting digital wisdom...",
    "Gathering AI thoughts...",
    "Importing smart cookies...",
    "Fetching neural networks..."
  ],
  'image-generation': [
    "Mixing pixels with magic...",
    "Consulting the art spirits...",
    "Painting with mathematical brushes...",
    "Dreaming in RGB colors...",
    "Crafting digital masterpieces..."
  ],
  'default': [
    "Working hard behind the scenes...",
    "Computing with style...",
    "Making progress happen...",
    "Doing important computer things...",
    "Processing with personality..."
  ]
};

export function LoadingMascot({ 
  task, 
  status = 'loading', 
  message, 
  progress, 
  className = "",
  size = 'md' 
}: LoadingMascotProps) {
  const [currentFace, setCurrentFace] = useState(0);
  const [currentMessage, setCurrentMessage] = useState(0);
  const [isBlinking, setIsBlinking] = useState(false);

  const sizeClasses = {
    sm: 'w-16 h-16 text-sm',
    md: 'w-24 h-24 text-base',
    lg: 'w-32 h-32 text-lg'
  };

  const faces = mascotFaces[status] || mascotFaces.loading;
  const messages = loadingMessages[task as keyof typeof loadingMessages] || loadingMessages.default;
  const IconComponent = taskIcons[task as keyof typeof taskIcons] || taskIcons.default;

  // Animate face changes
  useEffect(() => {
    if (status === 'loading') {
      const interval = setInterval(() => {
        setCurrentFace((prev) => (prev + 1) % faces.length);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [faces.length, status]);

  // Animate message changes
  useEffect(() => {
    if (status === 'loading') {
      const interval = setInterval(() => {
        setCurrentMessage((prev) => (prev + 1) % messages.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [messages.length, status]);

  // Blinking animation
  useEffect(() => {
    if (status === 'loading') {
      const interval = setInterval(() => {
        setIsBlinking(true);
        setTimeout(() => setIsBlinking(false), 150);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [status]);

  const getStatusColor = () => {
    switch (status) {
      case 'success': return 'text-green-600 border-green-300 bg-green-50 dark:bg-green-900/20';
      case 'error': return 'text-red-600 border-red-300 bg-red-50 dark:bg-red-900/20';
      case 'warning': return 'text-yellow-600 border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20';
      default: return 'text-blue-600 border-blue-300 bg-blue-50 dark:bg-blue-900/20';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default: return <IconComponent className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center p-6 rounded-lg border-2 ${getStatusColor()} ${className}`}>
      {/* Main Mascot */}
      <div className={`${sizeClasses[size]} flex items-center justify-center mb-4`}>
        <motion.div
          animate={status === 'loading' ? {
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0]
          } : {}}
          transition={{
            duration: 2,
            repeat: status === 'loading' ? Infinity : 0,
            ease: "easeInOut"
          }}
          className="relative"
        >
          {/* Mascot Body */}
          <div className="relative">
            <motion.div
              className="w-full h-full rounded-full border-4 border-current flex items-center justify-center font-bold text-2xl"
              animate={status === 'loading' ? {
                borderColor: ['#3B82F6', '#8B5CF6', '#F59E0B', '#10B981', '#3B82F6']
              } : {}}
              transition={{
                duration: 3,
                repeat: status === 'loading' ? Infinity : 0
              }}
            >
              <AnimatePresence mode="wait">
                <motion.span
                  key={currentFace}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ 
                    opacity: isBlinking ? 0.3 : 1, 
                    scale: 1 
                  }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.3 }}
                  className="select-none"
                >
                  {faces[currentFace]}
                </motion.span>
              </AnimatePresence>
            </motion.div>

            {/* Floating Icon */}
            <motion.div
              className="absolute -top-2 -right-2 bg-white dark:bg-gray-800 rounded-full p-1 border-2 border-current"
              animate={status === 'loading' ? {
                y: [-2, 2, -2],
                rotate: [0, 10, -10, 0]
              } : {}}
              transition={{
                duration: 1.5,
                repeat: status === 'loading' ? Infinity : 0
              }}
            >
              {getStatusIcon()}
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Progress Bar */}
      {progress !== undefined && (
        <div className="w-full max-w-xs mb-3">
          <div className="flex justify-between text-xs mb-1">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <motion.div
              className="bg-current h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      )}

      {/* Status Message */}
      <div className="text-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={message || currentMessage}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5 }}
            className="font-medium mb-1"
          >
            {message || messages[currentMessage]}
          </motion.p>
        </AnimatePresence>
        
        {/* Loading dots animation */}
        {status === 'loading' && (
          <div className="flex justify-center space-x-1">
            {[0, 1, 2].map((dot) => (
              <motion.div
                key={dot}
                className="w-2 h-2 bg-current rounded-full"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: dot * 0.2
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Preset configurations for common tasks
export const MascotPresets = {
  ServerLaunch: (props: Partial<LoadingMascotProps>) => 
    <LoadingMascot task="server-launch" {...props} />,
  ComfySetup: (props: Partial<LoadingMascotProps>) => 
    <LoadingMascot task="comfy-setup" {...props} />,
  ModelDownload: (props: Partial<LoadingMascotProps>) => 
    <LoadingMascot task="model-download" {...props} />,
  ImageGeneration: (props: Partial<LoadingMascotProps>) => 
    <LoadingMascot task="image-generation" {...props} />,
  FileUpload: (props: Partial<LoadingMascotProps>) => 
    <LoadingMascot task="file-upload" {...props} />,
};