'use client';

import { useState, useEffect } from 'react';

interface StreamingTextProps {
  text: string;
  speed?: number; // milliseconds per character
}

export default function StreamingText({ text, speed = 30 }: StreamingTextProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    setDisplayedText('');
    setIsComplete(false);
    setShowCursor(true);
    
    if (!text) return;

    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex <= text.length) {
        setDisplayedText(text.slice(0, currentIndex));
        currentIndex++;
      } else {
        setIsComplete(true);
        clearInterval(interval);
        // Hide cursor after completion with a delay
        setTimeout(() => setShowCursor(false), 2000);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  // Cursor blinking effect
  useEffect(() => {
    if (!isComplete) {
      const cursorInterval = setInterval(() => {
        setShowCursor(prev => !prev);
      }, 500);
      return () => clearInterval(cursorInterval);
    }
  }, [isComplete]);

  return (
    <div className="text-white font-medium text-lg leading-relaxed">
      <span style={{ color: '#ffffff', fontWeight: '500' }}>
        {displayedText}
      </span>
      {showCursor && (
        <span 
          className="inline-block w-0.5 h-6 bg-white ml-1 animate-pulse"
          style={{ 
            backgroundColor: '#ffffff',
            animation: 'blink 1s infinite',
            verticalAlign: 'text-top'
          }}
        />
      )}
      <style jsx>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
} 