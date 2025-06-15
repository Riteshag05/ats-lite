'use client';

import { useState, useEffect } from 'react';

interface StreamingTextProps {
  text: string;
  speed?: number; // milliseconds per character
}

export default function StreamingText({ text, speed = 20 }: StreamingTextProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    setDisplayedText('');
    setIsComplete(false);
    
    if (!text) return;

    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex <= text.length) {
        setDisplayedText(text.slice(0, currentIndex));
        currentIndex++;
      } else {
        setIsComplete(true);
        clearInterval(interval);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  return (
    <div className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">
      {displayedText}
      {!isComplete && (
        <span className="animate-pulse text-blue-500">|</span>
      )}
    </div>
  );
} 