import { useState, useEffect } from "react";

interface RotatingTextProps {
  words: string[];
  interval?: number;
  className?: string;
}

export const RotatingText = ({ words, interval = 2000, className = "" }: RotatingTextProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % words.length);
        setIsAnimating(false);
      }, 500);
    }, interval);

    return () => clearInterval(timer);
  }, [words.length, interval]);

  // Find the longest word for fixed width
  const longestWord = words.reduce((a, b) => a.length > b.length ? a : b, "");

  return (
    <span className="relative inline-block">
      {/* Invisible text to maintain fixed width based on longest word */}
      <span className="invisible">{longestWord}</span>
      {/* Actual rotating text positioned absolutely */}
      <span
        className={`absolute left-0 right-0 text-left transition-all duration-500 ${className} ${
          isAnimating ? "opacity-0 -translate-y-2" : "opacity-100 translate-y-0"
        }`}
      >
        {words[currentIndex]}
      </span>
    </span>
  );
};
