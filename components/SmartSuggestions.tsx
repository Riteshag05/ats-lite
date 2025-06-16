'use client';

import { motion, AnimatePresence } from "framer-motion";
import { useATSStore } from "@/store/useATSStore";
import { runMCP } from "@/lib/mcp";

interface SmartSuggestionsProps {
  suggestions: string[];
}

export default function SmartSuggestions({ suggestions }: SmartSuggestionsProps) {
  const { setMessage } = useATSStore();

  const handleSuggestionClick = async (suggestion: string) => {
    setMessage(suggestion);
    await runMCP(suggestion);
  };

  if (!suggestions || suggestions.length === 0) return null;

  console.log("🎯 Rendering suggestions:", suggestions.length, suggestions);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="glass-card p-6 rounded-2xl border border-white/10"
      >
        <div className="flex items-center space-x-3 mb-4">
          <motion.span 
            className="text-2xl"
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            💡
          </motion.span>
          <h3 className="text-xl font-semibold text-white">Smart Suggestions</h3>
          <motion.div
            className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm font-medium border border-blue-500/30"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 400 }}
          >
            AI-Powered ({suggestions.length})
          </motion.div>
        </div>
        
        <p className="text-gray-300 mb-4 text-sm">
          Based on your search results, here are some refined queries that might find better matches:
        </p>

        <div className="space-y-3">
          {suggestions.map((suggestion, index) => (
            <motion.button
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full text-left p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 hover:border-blue-400/40 transition-all duration-300 group"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 + 0.1 }}
              whileHover={{ scale: 1.02, x: 5 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1 min-w-0">
                  <motion.div
                    className="w-2 h-2 rounded-full bg-blue-400 mt-2 flex-shrink-0"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity, delay: index * 0.3 }}
                  />
                  <span className="text-white font-medium group-hover:text-blue-300 transition-colors break-words">
                    {suggestion}
                  </span>
                </div>
                <motion.svg 
                  className="w-5 h-5 text-gray-400 group-hover:text-blue-400 transition-colors flex-shrink-0 ml-3"
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  initial={{ x: -5, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: index * 0.1 + 0.3 }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </motion.svg>
              </div>
            </motion.button>
          ))}
        </div>

        <motion.div 
          className="mt-4 pt-4 border-t border-white/10 text-xs text-gray-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          💡 Tip: Click any suggestion to automatically search with that refined query
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
} 