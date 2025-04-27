import React, { useState, useRef } from 'react';
import { Smile } from 'lucide-react';
import ReactionPicker, { ReactionType, REACTIONS } from './ReactionPicker';

interface ReactionCounts {
  like: number;
  dislike: number;
  love: number;
  laugh: number;
  surprise: number;
  sad: number;
  mad: number;
}

interface ReactionButtonProps {
  commentId: string;
  reactions: ReactionCounts;
  userReaction?: ReactionType;
  onReaction: (commentId: string, type: ReactionType) => void;
}

const ReactionButton: React.FC<ReactionButtonProps> = ({
  commentId,
  reactions,
  userReaction,
  onReaction
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);

  const handleReactionSelect = (type: ReactionType) => {
    onReaction(commentId, type);
    // Don't close the picker immediately to allow for visual feedback
    setTimeout(() => {
      setShowPicker(false);
    }, 100);
  };

  const totalReactions = Object.values(reactions).reduce((sum, count) => sum + count, 0);

  // Get top 2 reactions by count
  const topReactions = Object.entries(reactions)
    .filter(([_, count]) => count > 0)
    .sort(([_, a], [__, b]) => b - a)
    .slice(0, 2)
    .map(([type]) => type as ReactionType);

  return (
    <div className="relative" ref={buttonRef}>
      <button
        onClick={() => setShowPicker(!showPicker)}
        className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors"
      >
        <div className="flex -space-x-2">
          <div className="w-6 h-6 rounded-full bg-[#2c2c2c] border border-white/20 flex items-center justify-center text-sm" style={{ zIndex: 3 }}>
            <Smile className="w-4 h-4" />
          </div>
          {topReactions.map((type, index) => {
            const reaction = REACTIONS.find(r => r.type === type);
            return (
              <div
                key={type}
                className="w-6 h-6 rounded-full bg-[#2c2c2c] border border-white/20 flex items-center justify-center text-sm"
                style={{ zIndex: 2 - index }}
              >
                {reaction?.emoji}
              </div>
            );
          })}
        </div>
        {totalReactions > 0 && (
          <span className="text-sm">{totalReactions}</span>
        )}
      </button>
      {showPicker && (
        <ReactionPicker
          onSelect={handleReactionSelect}
          currentReaction={userReaction}
          onClose={() => setShowPicker(false)}
          reactions={reactions}
          buttonRef={buttonRef}
        />
      )}
    </div>
  );
};

export default ReactionButton; 