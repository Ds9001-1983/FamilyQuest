import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star, Sparkles, Gift } from 'lucide-react';
import confetti from 'canvas-confetti';

interface RewardCelebrationProps {
  isVisible: boolean;
  onClose: () => void;
  rewardName: string;
  rewardDescription: string;
}

export function RewardCelebration({ isVisible, onClose, rewardName, rewardDescription }: RewardCelebrationProps) {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShowConfetti(true);
      
      // Feuerwerk-Effekt
      const duration = 3000;
      const animationEnd = Date.now() + duration;
      
      const randomInRange = (min: number, max: number) => {
        return Math.random() * (max - min) + min;
      };

      const confettiInterval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();
        
        if (timeLeft <= 0) {
          clearInterval(confettiInterval);
          return;
        }

        const particleCount = 50 * (timeLeft / duration);
        
        // Feuerwerk von links
        confetti({
          particleCount,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.8 },
          colors: ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'],
        });
        
        // Feuerwerk von rechts
        confetti({
          particleCount,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.8 },
          colors: ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'],
        });

        // Goldenes Konfetti von oben
        confetti({
          particleCount: 30,
          angle: 90,
          spread: 45,
          origin: { x: 0.5, y: 0 },
          colors: ['#ffd700', '#ffed4e', '#fbbf24'],
          shapes: ['star'],
        });
      }, 250);

      // Auto-close nach 5 Sekunden
      const autoCloseTimer = setTimeout(() => {
        onClose();
      }, 5000);

      return () => {
        clearInterval(confettiInterval);
        clearTimeout(autoCloseTimer);
      };
    }
  }, [isVisible, onClose]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{ type: "spring", duration: 0.8, bounce: 0.4 }}
            className="bg-white rounded-3xl p-8 mx-4 max-w-md w-full shadow-2xl relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Floating particles */}
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 bg-yellow-400 rounded-full"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                  }}
                  animate={{
                    y: [-20, -40, -20],
                    opacity: [0, 1, 0],
                    scale: [0, 1, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: Math.random() * 2,
                  }}
                />
              ))}
            </div>

            {/* Main content */}
            <div className="text-center relative z-10">
              <motion.div
                animate={{ rotate: [0, -10, 10, -10, 0] }}
                transition={{ duration: 0.5, repeat: 3 }}
                className="mb-6"
              >
                <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mx-auto flex items-center justify-center shadow-lg">
                  <Trophy className="h-12 w-12 text-white" />
                </div>
              </motion.div>

              <motion.h1
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-3xl font-bold text-gray-800 mb-2"
              >
                🎉 Belohnung freigeschaltet! 🎉
              </motion.h1>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="bg-gradient-to-r from-mission-green to-mission-blue rounded-2xl p-6 text-white mb-6"
              >
                <div className="flex items-center justify-center mb-3">
                  <Gift className="h-8 w-8 mr-2" />
                  <span className="text-2xl font-bold">{rewardName}</span>
                </div>
                <p className="text-white/90">{rewardDescription}</p>
              </motion.div>

              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.7, type: "spring", bounce: 0.6 }}
                className="flex justify-center space-x-4 text-4xl mb-6"
              >
                <motion.span
                  animate={{ rotate: [0, 20, -20, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity, delay: 0 }}
                >
                  🌟
                </motion.span>
                <motion.span
                  animate={{ rotate: [0, -20, 20, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity, delay: 0.2 }}
                >
                  🎊
                </motion.span>
                <motion.span
                  animate={{ rotate: [0, 20, -20, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity, delay: 0.4 }}
                >
                  🎈
                </motion.span>
              </motion.div>

              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.9 }}
                className="text-gray-600 mb-6"
              >
                Du bist fantastisch! Mach weiter so! 🚀
              </motion.p>

              <motion.button
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1.1 }}
                onClick={onClose}
                className="bg-gradient-to-r from-mission-green to-mission-blue text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 transform hover:scale-105"
              >
                Weiter so! 💪
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}