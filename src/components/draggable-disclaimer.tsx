'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ShieldAlert, X } from 'lucide-react';

const DraggableDisclaimer = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 0 });
  const dragStartRef = useRef({ x: 0, y: 0 });
  const nodeRef = useRef<HTMLDivElement>(null);
  const [isInitialPositionSet, setIsInitialPositionSet] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && !isInitialPositionSet) {
      setPosition({ x: 20, y: window.innerHeight - (isOpen ? 200 : 80) });
      setIsInitialPositionSet(true);
    }
  }, [isInitialPositionSet, isOpen]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (nodeRef.current && (e.target as HTMLElement).closest('.disclaimer-header')) {
        setIsDragging(true);
        dragStartRef.current = {
            x: e.clientX - nodeRef.current.offsetLeft,
            y: e.clientY - nodeRef.current.offsetTop,
        };
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging && nodeRef.current) {
      setPosition({
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };
  
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging) return;
    const target = e.target as HTMLElement;
    if (target.closest('.disclaimer-header') && !target.closest('button.close-btn')) {
        setIsOpen(!isOpen);
    }
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  if (!isInitialPositionSet) {
    return null;
  }

  return (
    <div
      ref={nodeRef}
      className={cn("draggable-disclaimer", { 'is-open': isOpen })}
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
    >
        <div className="disclaimer-header">
            <ShieldAlert className="h-5 w-5 text-destructive-foreground" />
            <strong className="disclaimer-title">Disclaimer</strong>
            <button onClick={() => setIsOpen(!isOpen)} className="close-btn">
                {isOpen && <X className="h-4 w-4"/>}
            </button>
        </div>
      {isOpen && (
        <p>
          Trading synthetic indices involves substantial risk and is not suitable for all investors. The tools and information provided on this site are for educational and informational purposes only. Past performance is not indicative of future results. You are solely responsible for any trading decisions you make. Never trade with money you cannot afford to lose.
        </p>
      )}
    </div>
  );
};

export default DraggableDisclaimer;
