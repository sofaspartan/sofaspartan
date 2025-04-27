import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export type ReactionType = 'like' | 'dislike' | 'love' | 'laugh' | 'surprise' | 'sad' | 'mad';

interface Reaction {
  type: ReactionType;
  emoji: string;
  label: string;
}

export const REACTIONS: Reaction[] = [
  { type: 'like', emoji: '👍', label: 'Like' },
  { type: 'dislike', emoji: '👎', label: 'Dislike' },
  { type: 'love', emoji: '❤️', label: 'Love' },
  { type: 'laugh', emoji: '😂', label: 'Laugh' },
  { type: 'surprise', emoji: '🤯', label: 'Surprise' },
  { type: 'sad', emoji: '😢', label: 'Sad' },
  { type: 'mad', emoji: '😡', label: 'Mad' }
];

interface ReactionPickerProps {
  onSelect: (type: ReactionType) => void;
  currentReaction?: ReactionType;
  onClose: () => void;
  reactions: {
    like: number;
    dislike: number;
    love: number;
    laugh: number;
    surprise: number;
    sad: number;
    mad: number;
  };
  buttonRef: React.RefObject<HTMLDivElement>;
}

const ReactionPicker: React.FC<ReactionPickerProps> = ({ onSelect, currentReaction, onClose, reactions, buttonRef }) => {
  const [position, setPosition] = React.useState({ top: 0, left: 0 });
  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 640);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isButtonClick = buttonRef.current?.contains(target);
      const isPickerClick = pickerRef.current?.contains(target);
      
      if (!isButtonClick && !isPickerClick) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [buttonRef, onClose]);

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  React.useEffect(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const pickerWidth = isMobile ? window.innerWidth * 0.9 : 300; // 90vw on mobile, 300px on desktop
      
      if (isMobile) {
        // Center horizontally on mobile
        setPosition({
          top: rect.top - 10,
          left: window.innerWidth / 2
        });
      } else {
        // Position relative to button on desktop, ensuring it doesn't go off screen
        const leftPosition = Math.max(10, rect.right - pickerWidth); // At least 10px from left edge
        setPosition({
          top: rect.top - 10,
          left: leftPosition
        });
      }
    }
  }, [buttonRef, isMobile]);

  const pickerContent = (
    <div 
      ref={pickerRef}
      className="fixed bg-[#2c2c2c] border border-white/20 rounded-lg shadow-lg z-[9999]"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        maxWidth: '300px',
        width: isMobile ? '90vw' : 'auto',
        transform: isMobile ? 'translateX(-50%)' : 'none'
      }}
    >
      <div className="flex items-center justify-between p-2 border-b border-white/10">
        <h3 className="text-sm font-medium text-white/80">Add Reaction</h3>
        <button
          onClick={onClose}
          className="p-1 rounded-full hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4 text-white/60" />
        </button>
      </div>
      <div className="p-2">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {REACTIONS.map((reaction) => (
            <button
              key={reaction.type}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(reaction.type);
              }}
              className={`p-2 rounded hover:bg-white/10 transition-colors flex flex-col items-center gap-1 flex-shrink-0 ${
                currentReaction === reaction.type ? 'bg-white/10' : ''
              }`}
              title={reaction.label}
            >
              <span className="text-xl">{reaction.emoji}</span>
              <span className="text-xs text-white/60">{reactions[reaction.type]}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return createPortal(pickerContent, document.body);
};

export default ReactionPicker; 