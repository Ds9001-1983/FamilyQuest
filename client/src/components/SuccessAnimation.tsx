import { Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SuccessAnimationProps {
  isVisible: boolean;
  onClose: () => void;
  xpGained: number;
}

export function SuccessAnimation({ isVisible, onClose, xpGained }: SuccessAnimationProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.3, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="bg-white rounded-3xl p-8 text-center max-w-sm mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                rotate: [0, 10, -10, 0]
              }}
              transition={{ 
                duration: 1,
                repeat: Infinity,
                repeatType: "reverse"
              }}
              className="w-20 h-20 bg-mission-green rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <Trophy className="h-10 w-10 text-white" />
            </motion.div>
            
            <h3 className="text-2xl font-bold text-mission-text mb-2">Mission erfüllt!</h3>
            <p className="text-mission-green text-xl font-semibold mb-4">+{xpGained} XP erhalten</p>
            
            <button
              onClick={onClose}
              className="bg-mission-green text-white px-6 py-3 rounded-xl font-medium hover:bg-green-600 transition-colors"
            >
              Weiter
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
