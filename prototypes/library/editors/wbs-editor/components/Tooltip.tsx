import { useState, useRef, useEffect } from "react";

interface TooltipProps {
  children: React.ReactNode;
  content: string;
  className?: string;
}

export function Tooltip({ children, content, className = "" }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isVisible && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({
        top: rect.top - 10, // Position above the element with some margin
        left: rect.left + rect.width / 2, // Center horizontally
      });
    }
  }, [isVisible]);

  return (
    <>
      <div
        ref={triggerRef}
        className={`relative inline-block ${className}`}
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        {children}
      </div>
      {isVisible && (
        <div
          className="fixed transform -translate-x-1/2 -translate-y-full px-3 py-2 text-xs text-white bg-gray-900 rounded shadow-lg whitespace-nowrap animate-in fade-in-0 duration-150"
          style={{
            zIndex: 9999,
            top: position.top,
            left: position.left,
          }}
        >
          {content}
          {/* Arrow pointing down */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </>
  );
}
