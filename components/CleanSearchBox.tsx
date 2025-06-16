'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CleanSearchBoxProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  loading: boolean;
}

const SEARCH_EXAMPLES = [
  "frontend developers with React experience",
  "senior backend engineers in Berlin", 
  "mobile developers willing to relocate",
  "highest paid data scientists",
  "junior engineers under 50k salary",
  "full-stack developers with AWS skills"
];

export default function CleanSearchBox({ value, onChange, onSubmit, loading }: CleanSearchBoxProps) {
  const [currentExampleIndex, setCurrentExampleIndex] = useState(0);
  const [animatedPlaceholder, setAnimatedPlaceholder] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Animated placeholder effect
  useEffect(() => {
    if (value.length > 0) return; // Don't animate if user is typing

    const currentExample = SEARCH_EXAMPLES[currentExampleIndex];
    let index = 0;
    setIsTyping(true);

    const typeInterval = setInterval(() => {
      if (index <= currentExample.length) {
        setAnimatedPlaceholder(currentExample.slice(0, index));
        index++;
      } else {
        clearInterval(typeInterval);
        setIsTyping(false);
        // Wait then move to next example
        setTimeout(() => {
          if (value.length === 0) { // Only if user hasn't started typing
            setCurrentExampleIndex((prev) => (prev + 1) % SEARCH_EXAMPLES.length);
          }
        }, 2000);
      }
    }, 80);

    return () => clearInterval(typeInterval);
  }, [currentExampleIndex, value.length]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!loading && value.trim()) {
        onSubmit();
      }
    }
  };

  const placeholderText = value.length > 0 ? 
    "Search for candidates... (Press Enter to search)" : 
    animatedPlaceholder || "Search for candidates...";

  return (
    <div className="relative max-w-3xl mx-auto z-50">
      {/* Search Input Container - Clean and Modern */}
      <div className="relative z-50">
        {/* Search Icon */}
        <motion.div 
          className="absolute left-5 top-1/2 transform -translate-y-1/2 z-10"
          animate={{ rotate: loading ? 360 : 0 }}
          transition={{ duration: 1, repeat: loading ? Infinity : 0, ease: "linear" }}
        >
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </motion.div>

        {/* Input Field with Animated Placeholder */}
        <motion.input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholderText}
          disabled={loading}
          className="w-full bg-slate-700/80 backdrop-blur-lg border-2 border-white/10 rounded-2xl pl-14 pr-32 py-4 text-white placeholder-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200"
          whileFocus={{ scale: 1.01 }}
          transition={{ type: "spring", stiffness: 300 }}
        />

        {/* Search Button */}
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
          <motion.button
            onClick={onSubmit}
            disabled={loading || !value.trim()}
            className="btn-premium px-4 py-2 text-sm"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {loading ? (
              <motion.div className="flex items-center space-x-2">
                <motion.div
                  className="w-3 h-3 border-2 border-white border-t-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                <span>Searching...</span>
              </motion.div>
            ) : (
              <motion.div className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                <span>Search</span>
              </motion.div>
            )}
          </motion.button>
        </div>
      </div>

      {/* Typing indicator */}
      {isTyping && value.length === 0 && (
        <motion.div 
          className="text-center mt-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <span className="text-xs text-gray-400 flex items-center justify-center space-x-1">
            <motion.span
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              ✨
            </motion.span>
            <span>Try searching for...</span>
          </span>
        </motion.div>
      )}

      {/* Keyboard shortcut hint */}
      <motion.div 
        className="text-center mt-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <span className="text-xs text-gray-400">
          Press <kbd className="px-2 py-1 bg-white/10 text-white rounded text-xs border border-white/20">Enter</kbd> to search
        </span>
      </motion.div>

      {/* COMMENTED OUT: Suggestions dropdown that was causing overlap issues */}
      {/*
      <AnimatePresence>
        {showSuggestions && !loading && value.length === 0 && (
          <motion.div 
            className="absolute top-full mt-3 w-full glass-card border border-white/20 rounded-2xl shadow-2xl z-[200] overflow-hidden"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          >
            // Suggestions content was here
          </motion.div>
        )}
      </AnimatePresence>
      */}
    </div>
  );
}