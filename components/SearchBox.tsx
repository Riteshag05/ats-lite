'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SearchBoxProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  loading: boolean;
}

const SEARCH_SUGGESTIONS = [
  "backend developers with AWS experience",
  "senior React engineers in Berlin", 
  "mobile developers willing to relocate",
  "highest paid frontend developers",
  "junior engineers under 50k salary",
  "DevOps specialists with 10+ years experience"
];

export default function SearchBox({ value, onChange, onSubmit, loading }: SearchBoxProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Filter suggestions based on current input
    if (value.length > 0 && isFocused) {
      const filtered = SEARCH_SUGGESTIONS.filter(suggestion =>
        suggestion.toLowerCase().includes(value.toLowerCase()) ||
        value.toLowerCase().split(' ').some(word => 
          suggestion.toLowerCase().includes(word) && word.length > 2
        )
      );
      setSuggestions(filtered.slice(0, 3));
      setShowSuggestions(filtered.length > 0);
    } else if (isFocused && value.length === 0) {
      setSuggestions(SEARCH_SUGGESTIONS.slice(0, 3));
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  }, [value, isFocused]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      onSubmit();
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      inputRef.current?.blur();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  return (
    <div className="relative w-full max-w-2xl">
      {/* Main Search Container */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`relative transition-all duration-300 ${
          isFocused ? 'transform scale-105' : ''
        }`}
      >
        {/* Search Input with Glass Effect */}
        <div className={`glass rounded-2xl p-1 transition-all duration-300 ${
          isFocused ? 'animate-glow' : ''
        }`}>
          <div className="relative">
            {/* Search Icon */}
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
              <motion.div
                animate={{ rotate: loading ? 360 : 0 }}
                transition={{ duration: 1, repeat: loading ? Infinity : 0 }}
              >
                <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </motion.div>
            </div>

            {/* Input Field */}
            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setTimeout(() => setIsFocused(false), 150)}
              placeholder="Search for candidates... (⌘+Enter to search)"
              disabled={loading}
              className="w-full pl-12 pr-16 py-4 bg-white/80 backdrop-blur-sm rounded-xl border-2 border-transparent focus:border-indigo-500 focus:outline-none transition-all duration-300 text-gray-800 placeholder-gray-500 disabled:opacity-50"
            />

            {/* Search Button */}
            <motion.button
              onClick={onSubmit}
              disabled={loading || !value.trim()}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 btn-premium px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                />
              ) : (
                'Search'
              )}
            </motion.button>
          </div>
        </div>

        {/* Loading Progress Bar */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              exit={{ opacity: 0 }}
              className="absolute -bottom-1 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
            >
              <motion.div
                className="h-full bg-white/30 rounded-full"
                animate={{ x: [-100, 100] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Search Suggestions Dropdown */}
      <AnimatePresence>
        {showSuggestions && !loading && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full mt-2 w-full glass rounded-xl p-2 z-50"
          >
            <div className="text-xs text-gray-600 mb-2 px-3 py-1 font-medium">
              Suggested searches
            </div>
            {suggestions.map((suggestion, index) => (
              <motion.button
                key={suggestion}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/50 transition-colors duration-200 text-sm text-gray-700 flex items-center space-x-2"
              >
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                <span>{suggestion}</span>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Keyboard Shortcut Hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isFocused ? 1 : 0.6 }}
        className="absolute -bottom-8 left-0 text-xs text-gray-500 flex items-center space-x-1"
      >
        <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">⌘</kbd>
        <span>+</span>
        <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Enter</kbd>
        <span>to search</span>
      </motion.div>
    </div>
  );
} 